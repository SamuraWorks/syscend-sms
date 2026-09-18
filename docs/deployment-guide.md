# Syscend Campus — Ubuntu VPS Deployment Guide

This guide walks through deploying Syscend Campus on a fresh Ubuntu 22.04/24.04 LTS server. It is provider-agnostic — works on Hetzner, DigitalOcean, AWS Lightsail, Vultr, Linode, Azure, or any VPS.

---

## Prerequisites

- Ubuntu 22.04 or 24.04 LTS server (minimum 2GB RAM, 2 vCPU recommended)
- Root or sudo access
- A domain name pointed to your server's IP (for HTTPS)
- SSH access to the server

---

## Step 1: Initial Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Set timezone
sudo timedatectl set-timezone Africa/Freetown

# Create a deploy user (recommended over using root)
sudo adduser deploy
sudo usermod -aG sudo deploy
sudo usermod -aG www-data deploy

# Switch to deploy user
su - deploy
```

---

## Step 2: Install PHP 8.2+

```bash
sudo add-apt-repository ppa:ondrej/php -y
sudo apt update
sudo apt install -y \
  php8.2-fpm php8.2-cli php8.2-pgsql php8.2-mbstring \
  php8.2-xml php8.2-curl php8.2-zip php8.2-gd \
  php8.2-bcmath php8.2-intl php8.2-redis \
  php8.2-opcache php8.2-dom php8.2-tokenizer
```

Verify:
```bash
php -v   # Should show PHP 8.2.x
```

---

## Step 3: Install PostgreSQL 16+

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

Create the database and user:
```bash
sudo -u postgres psql
```
```sql
CREATE USER syscend_user WITH PASSWORD 'YOUR_STRONG_PASSWORD_HERE';
CREATE DATABASE syscend OWNER syscend_user;
GRANT ALL PRIVILEGES ON DATABASE syscend TO syscend_user;
ALTER USER syscend_user CREATEDB;
\q
```

---

## Step 4: Install Redis

```bash
sudo apt install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Verify Redis is running
redis-cli ping
# Should return: PONG
```

---

## Step 5: Install Nginx

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

---

## Step 6: Install Node.js 18+

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # Should show v18.x or higher
npm -v
```

---

## Step 7: Install Composer

```bash
cd /tmp
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
composer --version
```

---

## Step 8: Deploy the Application

```bash
# Clone the repository
cd /var/www
sudo git clone https://github.com/SamuraWorks/syscend-campus.git syscend-campus
sudo chown -R deploy:www-data /var/www/syscend-campus
cd /var/www/syscend-campus

# Switch to deploy user if not already
# (or ensure your user has ownership of /var/www/syscend-campus)
```

### Configure Environment

```bash
cp .env.production .env
nano .env
```

Fill in ALL `# CHANGE:` fields:
- `APP_KEY` — run `php artisan key:generate` after saving
- `APP_URL` — your domain (e.g., `https://syscend.com`)
- `DB_PASSWORD` — the password you set in Step 3
- `MAIL_*` — your SMTP credentials
- `GEMINI_API_KEY` — get from https://aistudio.google.com/apikey
- `REDIS_PASSWORD` — set a Redis password if exposed externally

### Install Dependencies & Build

```bash
# PHP dependencies (no dev packages)
composer install --no-dev --optimize-autoloader --no-interaction

# Frontend dependencies
npm ci
npm run build
```

### Generate Application Key

```bash
php artisan key:generate --force
```

### Run Migrations & Seed

```bash
php artisan migrate --force
php artisan db:seed --force
```

> **Note:** The seeder creates platform admin accounts (Super Admin, Ministry Admin, District Officer). Each gets a random temporary password printed to the console. Users must change their password on first login.

---

## Step 9: Storage Link

```bash
php artisan storage:link --force
```

---

## Step 10: Cache Configuration

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache
```

---

## Step 11: Set Permissions

```bash
sudo chown -R deploy:www-data /var/www/syscend-campus
sudo find /var/www/syscend-campus -type f -exec chmod 644 {} \;
sudo find /var/www/syscend-campus -type d -exec chmod 755 {} \;
sudo chmod -R 775 /var/www/syscend-campus/storage
sudo chmod -R 775 /var/www/syscend-campus/bootstrap/cache
sudo chmod -R 775 /var/www/syscend-campus/public/storage
```

---

## Step 12: Configure Nginx

Create the server block:

```bash
sudo nano /etc/nginx/sites-available/syscend
```

Paste this configuration (replace `syscend.com` with your domain):

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name syscend.com www.syscend.com;
    root /var/www/syscend-campus/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    index index.php;

    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Deny access to sensitive files
    location ~ /\.env {
        deny all;
    }

    location ~ /\.git {
        deny all;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/syscend /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

---

## Step 13: SSL with Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d syscend.com -d www.syscend.com
sudo certbot renew --dry-run
```

Certbot auto-configures the HTTPS server block and sets up auto-renewal via cron.

---

## Step 14: Queue Worker (Supervisor)

```bash
sudo apt install -y supervisor
```

Create the worker config:

```bash
sudo nano /etc/supervisor/conf.d/syscend-worker.conf
```

```ini
[program:syscend-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/syscend-campus/artisan queue:work --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=deploy
numprocs=2
redirect_stderr=true
stdout_logfile=/var/www/syscend-campus/storage/logs/worker.log
stopwaitsecs=3600
```

Start the workers:

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start "syscend-worker:*"
```

---

## Step 15: Scheduler (Cron)

```bash
sudo crontab -u deploy -e
```

Add this line:

```
* * * * * cd /var/www/syscend-campus && php artisan schedule:run >> /dev/null 2>&1
```

---

## Step 16: Post-Deploy Verification

```bash
# Health check
curl -I https://syscend.com/up

# Should return HTTP 200

# Check routes are registered
php artisan route:list --columns=method,uri | wc -l

# Check migrations are up to date
php artisan migrate:status

# Verify caches
php artisan about | grep -E "Cache|Config|Route"
```

---

## Server Firewall (UFW)

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

---

## Log Rotation

Create a logrotate config:

```bash
sudo nano /etc/logrotate.d/syscend
```

```
/var/www/syscend-campus/storage/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0664 deploy www-data
    sharedscripts
}
```

---

## Environment Requirements Summary

| Component | Minimum Version | Recommended |
|-----------|----------------|-------------|
| PHP | 8.2 | 8.3 |
| PostgreSQL | 14 | 16+ |
| Redis | 6 | 7+ |
| Node.js | 18 | 20 LTS |
| Nginx | 1.18 | Latest stable |
| Composer | 2.0 | 2.7+ |
| Ubuntu | 22.04 | 24.04 LTS |
| RAM | 2 GB | 4 GB |
| Disk | 20 GB | 50 GB |

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| 502 Bad Gateway | PHP-FPM not running: `sudo systemctl restart php8.2-fpm` |
| Permission denied | Fix ownership: `sudo chown -R deploy:www-data /var/www/syscend-campus` |
| CSRF token mismatch | Clear cache: `php artisan config:cache && php artisan route:cache` |
| White screen | Check `APP_DEBUG=false` in .env, check `storage/logs/laravel.log` |
| Queue jobs stuck | Restart workers: `sudo supervisorctl restart syscend-worker:*` |
| SSL not working | Renew: `sudo certbot renew` |
| Session not persisting | Check `SESSION_DOMAIN`, `SESSION_SECURE_COOKIE=true` |
