# Syscend Campus — Security Hardening Checklist

---

## 1. Server Hardening

### SSH

```bash
# Disable root login
sudo sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sudo sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config

# Use SSH key authentication only
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config

# Change default SSH port (optional but recommended)
# sudo sed -i 's/#Port 22/Port 2222/' /etc/ssh/sshd_config

# Restart SSH
sudo systemctl restart sshd
```

### Firewall (UFW)

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status verbose
```

### Fail2Ban

```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban

# Create jail for Nginx
sudo nano /etc/fail2ban/jail.local
```

```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[nginx-http-auth]
enabled = true
port = http,https
filter = nginx-http-auth
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
port = http,https
filter = nginx-limit-req
logpath = /var/log/nginx/error.log
```

```bash
sudo systemctl restart fail2ban
```

---

## 2. PHP Hardening

Edit `/etc/php/8.2/fpm/php.ini`:

```ini
; Disable dangerous functions
disable_functions = exec,passthru,shell_exec,system,proc_open,popen,curl_exec,curl_multi_exec,parse_ini_file,show_source,pcntl_exec,pcntl_fork

; Hide PHP version
expose_php = Off

; Limit resources
memory_limit = 256M
max_execution_time = 60
max_input_time = 60
post_max_size = 50M
upload_max_filesize = 25M

; Security headers
session.cookie_httponly = 1
session.cookie_secure = 1
session.use_strict_mode = 1

; Error handling
display_errors = Off
display_startup_errors = Off
log_errors = On
error_log = /var/log/php-errors.log
```

```bash
sudo systemctl restart php8.2-fpm
```

---

## 3. Nginx Hardening

Add to the `server` block in Nginx config:

```nginx
# Security headers (already in deployment guide)
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

# Hide server version
server_tokens off;

# Limit request body size
client_max_body_size 50M;

# Timeouts
client_body_timeout 60s;
client_header_timeout 60s;
send_timeout 60s;

# Rate limiting (add to http block in /etc/nginx/nginx.conf)
# limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
# limit_req_zone $binary_remote_addr zone=api:10m rate=30r/s;

# Apply rate limiting to login
# location /login {
#     limit_req zone=login burst=3 nodelay;
#     try_files $uri $uri/ /index.php?$query_string;
# }
```

---

## 4. Laravel Application Security

### .env Security

```bash
# Ensure .env is not web-accessible (already in nginx config)
# Verify .env is not in git
git check-ignore .env  # Should output: .env

# Set proper permissions on .env
chmod 640 .env
chown deploy:www-data .env
```

### APP_KEY Rotation

If APP_KEY was ever exposed, rotate immediately:

```bash
php artisan key:generate --force
php artisan config:cache
```

> **Warning:** Rotating APP_KEY invalidates all existing sessions and encrypted cookies.

### CSRF Protection

- Inertia.js handles CSRF via XSRF-TOKEN cookie automatically
- Verify `VerifyCsrfToken` middleware is active (it is, via `web` middleware group)

### Rate Limiting

The application uses `RoleRateLimiter` middleware globally. Default limits:

| Role | Limit |
|------|-------|
| super-admin | 200/min |
| school-admin | 150/min |
| teacher | 100/min |
| student | 60/min |
| guest | 30/min |

### Content Security Policy

Update CSP in `config/cors.php` and Nginx to only allow trusted origins.

---

## 5. Database Security

```bash
# Use a dedicated user (NOT postgres superuser for app)
sudo -u postgres createuser --no-createdb --no-superuser --no-createrole syscend_user

# Set a strong password
sudo -u postgres psql -c "ALTER USER syscend_user WITH PASSWORD 'YOUR_STRONG_PASSWORD';"

# Restrict to the syscend database only
sudo -u postgres psql -c "REVOKE ALL ON DATABASE syscend FROM PUBLIC;"
sudo -u postgres psql -c "GRANT ALL ON DATABASE syscend TO syscend_user;"

# Enable SSL for PostgreSQL connections
# Edit /etc/postgresql/*/main/pg_hba.conf:
# hostssl syscend syscend_user 127.0.0.1/32 scram-sha-256

# Restart PostgreSQL
sudo systemctl restart postgresql
```

---

## 6. File Permissions

```bash
# Set ownership
sudo chown -R deploy:www-data /var/www/syscend-campus

# Files: 644 (readable by all, writable by owner)
sudo find /var/www/syscend-campus -type f -exec chmod 644 {} \;

# Directories: 755 (accessible by all, writable by owner)
sudo find /var/www/syscend-campus -type d -exec chmod 755 {} \;

# Storage and cache: writable by web server
sudo chmod -R 775 /var/www/syscend-campus/storage
sudo chmod -R 775 /var/www/syscend-campus/bootstrap/cache

# .env: readable by owner and group only
chmod 640 /var/www/syscend-campus/.env
```

---

## 7. HTTPS Enforcement

```bash
# After running certbot, verify redirect is configured
# Nginx should have:
# server { listen 80; return 301 https://$host$request_uri; }
```

Verify:
```bash
curl -I http://syscend.com
# Should return: 301 Moved Permanently → https://syscend.com
```

---

## 8. Session Security (Already Configured)

From `.env.production`:

```
SESSION_SECURE_COOKIE=true     # HTTPS only
SESSION_HTTP_ONLY=true         # No JavaScript access
SESSION_SAME_SITE=lax          # CSRF protection
SESSION_ENCRYPT=true           # Encrypted session data
SESSION_LIFETIME=60            # 60 minute timeout
```

---

## 9. Payment Gateway Security

- Orange Money and Afrimoney credentials are stored per-school in `school_settings` table (encrypted)
- Webhook URLs must use HTTPS in production
- Never log full webhook payloads (fixed in `routes/api.php`)
- Verify webhook signatures from payment providers when available

---

## 10. Pre-Production Security Checklist

### Critical (Must Fix)

- [ ] `APP_ENV=production` in `.env`
- [ ] `APP_DEBUG=false` in `.env`
- [ ] `SESSION_SECURE_COOKIE=true` in `.env`
- [ ] `SESSION_DOMAIN=.syscend.com` in `.env`
- [ ] Strong database password (not `password` or `wiseAndroid1`)
- [ ] APP_KEY generated fresh for production (`php artisan key:generate`)
- [ ] No hardcoded credentials in source code
- [ ] HTTPS configured with valid SSL certificate
- [ ] `.env` file not accessible from web

### High Priority

- [ ] SSH key-only authentication
- [ ] Firewall enabled (UFW)
- [ ] Fail2Ban installed and configured
- [ ] PHP `expose_php = Off`
- [ ] PHP `display_errors = Off`
- [ ] Nginx `server_tokens off`
- [ ] Rate limiting on login endpoint
- [ ] Database user is not superuser
- [ ] PostgreSQL uses SSL connections
- [ ] CORS policy restricted to production domain

### Medium Priority

- [ ] Content-Security-Policy header configured
- [ ] Strict-Transport-Security header (HSTS)
- [ ] X-Frame-Options: SAMEORIGIN
- [ ] X-Content-Type-Options: nosniff
- [ ] Referrer-Policy configured
- [ ] Password reset token expiry reviewed
- [ ] Session timeout appropriate (60 min recommended)
- [ ] Log level set to `error` (not `debug`)
- [ ] Daily log rotation configured
- [ ] Database backups automated

### Low Priority

- [ ] Redis password set (if exposed externally)
- [ ] PHP disabled functions configured
- [ ] File upload size limits appropriate
- [ ] Audit logging enabled
- [ ] 2FA enforced for admin accounts

---

## 11. Security Monitoring

```bash
# Monitor failed login attempts
grep "Failed" /var/log/auth.log | tail -20

# Monitor Laravel authentication failures
grep "invalid" storage/logs/laravel.log | tail -20

# Check for suspicious file changes
find /var/www/syscend-campus -newer /tmp/syscend-last-good-commit.txt -name "*.php" -type f

# Monitor PostgreSQL connections
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity WHERE state = 'active';"
```

---

## 12. Incident Response

1. **Detect:** Monitoring alerts or user reports
2. **Contain:** `php artisan down` to put site in maintenance mode
3. **Investigate:** Check `storage/logs/laravel.log`, `/var/log/nginx/access.log`, `/var/log/auth.log`
4. **Eradicate:** Rotate APP_KEY, change database password, check for backdoors
5. **Recover:** Restore from clean backup if needed
6. **Document:** Record what happened and what was fixed
