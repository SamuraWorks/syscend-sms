# Syscend Campus — Health Check Documentation

---

## Built-in Health Check Endpoint

Laravel provides a health check route at `/up` (configured in `bootstrap/app.php`).

```bash
curl -I https://syscend.com/up
```

**Expected response:** HTTP 200 with empty body

---

## Manual Health Checks

### 1. Application Health

```bash
# HTTP response
curl -s -o /dev/null -w "%{http_code}" https://syscend.com/
# Expected: 200

# Inertia page load
curl -s -o /dev/null -w "%{http_code}" https://syscend.com/login
# Expected: 200
```

### 2. Database Connection

```bash
php artisan tinker --execute="echo \DB::connection()->getPdo() ? 'OK' : 'FAIL';"
```

### 3. Redis Connection

```bash
php artisan tinker --execute="echo \Cache::store('redis')->put('health-check', 1, 10) ? 'OK' : 'FAIL';"
```

### 4. Queue Worker Status

```bash
sudo supervisorctl status syscend-worker:*
```

### 5. Storage Writable

```bash
php artisan tinker --execute="echo \Illuminate\Support\Facades\Storage::disk('local')->put('health-check.txt', 'ok') ? 'OK' : 'FAIL';"
```

---

## Automated Health Check Script

Create `/usr/local/bin/syscend-health-check.sh`:

```bash
#!/bin/bash
set -euo pipefail

DOMAIN="syscend.com"
LOG="/var/log/syscend-health.log"
ALERT_EMAIL="admin@syscend.com"

timestamp() { date '+%Y-%m-%d %H:%M:%S'; }

fail=0

# 1. HTTP check
http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "https://$DOMAIN/up" 2>/dev/null || echo "000")
if [ "$http_code" != "200" ]; then
    echo "[$(timestamp)] FAIL: HTTP check returned $http_code" >> "$LOG"
    fail=1
else
    echo "[$(timestamp)] OK: HTTP check" >> "$LOG"
fi

# 2. PHP-FPM check
if ! systemctl is-active --quiet php8.2-fpm; then
    echo "[$(timestamp)] FAIL: PHP-FPM is not running" >> "$LOG"
    fail=1
else
    echo "[$(timestamp)] OK: PHP-FPM" >> "$LOG"
fi

# 3. PostgreSQL check
if ! systemctl is-active --quiet postgresql; then
    echo "[$(timestamp)] FAIL: PostgreSQL is not running" >> "$LOG"
    fail=1
else
    echo "[$(timestamp)] OK: PostgreSQL" >> "$LOG"
fi

# 4. Redis check
if ! systemctl is-active --quiet redis-server; then
    echo "[$(timestamp)] FAIL: Redis is not running" >> "$LOG"
    fail=1
else
    echo "[$(timestamp)] OK: Redis" >> "$LOG"
fi

# 5. Nginx check
if ! systemctl is-active --quiet nginx; then
    echo "[$(timestamp)] FAIL: Nginx is not running" >> "$LOG"
    fail=1
else
    echo "[$(timestamp)] OK: Nginx" >> "$LOG"
fi

# 6. Queue worker check
if ! sudo supervisorctl status syscend-worker:0 | grep -q "RUNNING"; then
    echo "[$(timestamp)] FAIL: Queue worker 0 not running" >> "$LOG"
    fail=1
else
    echo "[$(timestamp)] OK: Queue workers" >> "$LOG"
fi

# 7. Disk space check (alert if > 85%)
disk_usage=$(df / | awk 'NR==2 {print $5}' | tr -d '%')
if [ "$disk_usage" -gt 85 ]; then
    echo "[$(timestamp)] WARNING: Disk usage at ${disk_usage}%" >> "$LOG"
    fail=1
else
    echo "[$(timestamp)] OK: Disk usage ${disk_usage}%" >> "$LOG"
fi

# 8. Memory check (alert if > 90%)
mem_usage=$(free | awk '/Mem:/ {printf "%.0f", $3/$2 * 100}')
if [ "$mem_usage" -gt 90 ]; then
    echo "[$(timestamp)] WARNING: Memory usage at ${mem_usage}%" >> "$LOG"
    fail=1
else
    echo "[$(timestamp)] OK: Memory usage ${mem_usage}%" >> "$LOG"
fi

if [ $fail -eq 1 ]; then
    echo "[$(timestamp)] HEALTH CHECK FAILED" >> "$LOG"
    # Uncomment to send email alert:
    # echo "Syscend Campus health check failed. See $LOG" | mail -s "Syscend Health Alert" "$ALERT_EMAIL"
else
    echo "[$(timestamp)] ALL CHECKS PASSED" >> "$LOG"
fi
```

```bash
sudo chmod +x /usr/local/bin/syscend-health-check.sh
```

Schedule every 5 minutes:

```bash
crontab -e
```

```
*/5 * * * * /usr/local/bin/syscend-health-check.sh
```

---

## Uptime Monitoring

### External Services

| Service | Purpose | Free Tier |
|---------|---------|-----------|
| UptimeRobot | HTTP monitoring, 5-min intervals | 50 monitors free |
| Better Uptime | Status pages + monitoring | 10 monitors free |
| cron-job.org | Cron job monitoring | Free tier available |

### Setup UptimeRobot

1. Create account at https://uptimerobot.com
2. Add HTTP(s) monitor for `https://syscend.com/up`
3. Set monitoring interval: 5 minutes
4. Configure alert contacts (email, SMS, Slack)

---

## Log Monitoring

```bash
# Watch for errors in real-time
tail -f storage/logs/laravel.log | grep -i "error\|exception\|critical"

# Count errors in last hour
grep "$(date -d '1 hour ago' '+%Y-%m-%d %H')" storage/logs/laravel.log | grep -c "error\|exception"
```

---

## Performance Monitoring

### Database Query Analysis

```bash
php artisan tinker --execute="
\$start = microtime(true);
\App\Models\Student::count();
echo 'Student count query: ' . round((microtime(true) - \$start) * 1000, 2) . 'ms';
"
```

### Cache Hit Ratio

```bash
redis-cli info stats | grep -E "keyspace_hits|keyspace_misses"
```

---

## SSL Certificate Monitoring

```bash
# Check SSL expiry
echo | openssl s_client -connect syscend.com:443 -servername syscend.com 2>/dev/null | \
  openssl x509 -noout -dates
```

Certbot auto-renews, but monitor for failures:
```bash
sudo journalctl -u certbot.timer --since "7 days ago"
```
