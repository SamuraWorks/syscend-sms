# Syscend Campus — Rollback Guide

This guide covers rolling back a deployment that introduced issues. Always test in staging first if possible.

---

## Pre-Deployment Checklist (Do Before Every Deploy)

Before deploying, create a backup and record the current state:

```bash
# 1. Record current git commit
cd /var/www/syscend-campus
git rev-parse HEAD > /tmp/syscend-last-good-commit.txt

# 2. Backup database
pg_dump -U syscend_user syscend > /tmp/syscend-pre-deploy-$(date +%Y%m%d_%H%M%S).sql

# 3. Backup storage
tar -czf /tmp/syscend-storage-backup-$(date +%Y%m%d_%H%M%S).tar.gz storage/app/

# 4. Backup .env
cp .env /tmp/syscend-env-backup-$(date +%Y%m%d_%H%M%S)
```

---

## Quick Rollback (Code Only)

If the new code is broken but the database is fine:

```bash
cd /var/www/syscend-campus

# 1. Stop the queue worker
sudo supervisorctl stop syscend-worker:*

# 2. Rollback to previous commit
PREVIOUS=$(cat /tmp/syscend-last-good-commit.txt)
git checkout $PREVIOUS

# 3. Rebuild frontend
npm ci
npm run build

# 4. Re-cache configuration
php artisan config:cache
php artisan route:cache
php artisan view:cache

# 5. Restart queue worker
sudo supervisorctl start syscend-worker:*
```

---

## Full Rollback (Code + Database)

If a migration was run and needs to be undone:

```bash
cd /var/www/syscend-campus

# 1. Stop traffic (optional — put app in maintenance mode)
php artisan down --message="Rolling back deployment" --retry=60

# 2. Stop queue workers
sudo supervisorctl stop syscend-worker:*

# 3. Rollback the last migration (one step)
php artisan migrate:rollback

# Or rollback N steps:
php artisan migrate:rollback --step=3

# 4. Checkout previous code
PREVIOUS=$(cat /tmp/syscend-last-good-commit.txt)
git checkout $PREVIOUS

# 5. Reinstall dependencies
composer install --no-dev --optimize-autoloader
npm ci && npm run build

# 6. Re-cache
php artisan config:cache
php artisan route:cache
php artisan view:cache

# 7. Bring app back up
php artisan up
sudo supervisorctl start syscend-worker:*
```

---

## Full Database Restore

If the database needs to be restored from backup:

```bash
# 1. Stop the application
php artisan down
sudo supervisorctl stop syscend-worker:*

# 2. Drop and recreate the database
sudo -u postgres psql
```
```sql
DROP DATABASE syscend;
CREATE DATABASE syscend OWNER syscend_user;
GRANT ALL PRIVILEGES ON DATABASE syscend TO syscend_user;
\q
```

```bash
# 3. Restore from backup
psql -U syscend_user syscend < /tmp/syscend-pre-deploy-XXXXXXXX_XXXXXX.sql

# 4. Re-cache configuration (if .env changed)
php artisan config:cache
php artisan route:cache

# 5. Bring app back up
php artisan up
sudo supervisorctl start syscend-worker:*
```

---

## Atomic Deploy with Git

For zero-downtime style deployments:

```bash
cd /var/www/syscend-campus

# Fetch latest
git fetch syscend

# Switch to specific commit (the good one)
git checkout <commit-hash>

# Then rebuild, re-cache, restart workers as shown above
```

---

## Rollback Decision Tree

| Situation | Action |
|-----------|--------|
| New code has a bug, DB untouched | Quick Rollback (code only) |
| Migration ran but broke something | Rollback code + `migrate:rollback` |
| Database corrupted or bad data | Full Database Restore from backup |
| .env was changed incorrectly | Restore .env from backup + re-cache |
| Queue jobs failing after deploy | Restart workers + check `storage/logs/laravel.log` |
| White screen of death | Check `APP_DEBUG=true` temporarily, check logs |

---

## Monitoring After Rollback

After rolling back, monitor:

```bash
# Check error logs
tail -50 storage/logs/laravel.log

# Check worker status
sudo supervisorctl status

# Check queue failed jobs
php artisan queue:failed

# Health check
curl -I https://your-domain.com/up
```

---

## Communication Template

If the service was down:

```
[System Name] experienced a brief service interruption.
Duration: [X] minutes
Impact: [Description]
Resolution: We rolled back to the previous version and restored service.
We are investigating the root cause and will deploy a fix after thorough testing.
```
