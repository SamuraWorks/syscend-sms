# Syscend Campus — Backup and Restore Procedures

---

## What to Back Up

| Component | Location | Frequency |
|-----------|----------|-----------|
| PostgreSQL database | Entire `syscend` database | Daily |
| Application storage | `storage/app/` (uploads, documents) | Daily |
| Environment config | `.env` file | On every change |
| Frontend build | `public/build/` | Can be rebuilt from source |
| Uploaded files | `storage/app/private/` | Daily |

---

## Automated Database Backup

### Option A: Cron Job (Recommended)

```bash
# Create backup directory
sudo mkdir -p /var/backups/syscend
sudo chown deploy:deploy /var/backups/syscend

# Add cron job
crontab -e
```

Add this line for daily 2:00 AM backup:

```
0 2 * * * /usr/local/bin/syscend-backup.sh >> /var/log/syscend-backup.log 2>&1
```

Create the backup script:

```bash
sudo nano /usr/local/bin/syscend-backup.sh
```

```bash
#!/bin/bash
set -euo pipefail

BACKUP_DIR="/var/backups/syscend"
DB_NAME="syscend"
DB_USER="syscend_user"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Database dump
pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_DIR/db_$TIMESTAMP.sql.gz"

# Storage backup
tar -czf "$BACKUP_DIR/storage_$TIMESTAMP.tar.gz" -C /var/www/syscend-campus storage/app/

# .env backup
cp /var/www/syscend-campus/.env "$BACKUP_DIR/env_$TIMESTAMP"

# Remove backups older than retention period
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "env_*" -mtime +$RETENTION_DAYS -delete

echo "[$(date)] Backup completed: db_$TIMESTAMP.sql.gz, storage_$TIMESTAMP.tar.gz"
```

```bash
sudo chmod +x /usr/local/bin/syscend-backup.sh
```

### Option B: Manual Backup

```bash
cd /var/www/syscend-campus

# Database
pg_dump -U syscend_user syscend | gzip > /tmp/syscend-db-$(date +%Y%m%d).sql.gz

# Storage
tar -czf /tmp/syscend-storage-$(date +%Y%m%d).tar.gz storage/app/
```

---

## Offsite Backup (Recommended)

Sync backups to an external location:

### Option A: SCP to Another Server

```bash
# Add to backup script after creating backups:
scp "$BACKUP_DIR/db_$TIMESTAMP.sql.gz" backup@remote-server:/backups/syscend/
```

### Option B: S3-Compatible Storage

```bash
# Using AWS CLI or compatible tool
aws s3 cp "$BACKUP_DIR/db_$TIMESTAMP.sql.gz" s3://your-backup-bucket/syscend/
```

### Option C: rsync

```bash
rsync -avz /var/backups/syscend/ backup@remote-server:/backups/syscend/
```

---

## Restore Procedures

### Restore Database

```bash
# 1. Stop the application
cd /var/www/syscend-campus
php artisan down
sudo supervisorctl stop syscend-worker:*

# 2. Drop and recreate database
sudo -u postgres psql -c "DROP DATABASE syscend;"
sudo -u postgres psql -c "CREATE DATABASE syscend OWNER syscend_user;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE syscend TO syscend_user;"

# 3. Restore from backup (gunzip if compressed)
gunzip -c /var/backups/syscend/db_XXXXXXXX_XXXXXX.sql.gz | psql -U syscend_user syscend

# 4. Bring app back up
php artisan up
sudo supervisorctl start syscend-worker:*
```

### Restore Storage

```bash
# 1. Stop the application
php artisan down

# 2. Extract storage backup
tar -xzf /var/backups/syscend/storage_XXXXXXXX_XXXXXX.tar.gz -C /var/www/syscend-campus/

# 3. Fix permissions
sudo chown -R deploy:www-data /var/www/syscend-campus/storage
sudo find /var/www/syscend-campus/storage -type f -exec chmod 644 {} \;
sudo find /var/www/syscend-campus/storage -type d -exec chmod 755 {} \;

# 4. Bring app back up
php artisan up
```

### Restore .env

```bash
cp /var/backups/syscend/env_XXXXXXXX_XXXXXX /var/www/syscend-campus/.env
php artisan config:cache
```

---

## Backup Verification

Verify a backup is restorable:

```bash
# Create a test database
sudo -u postgres psql -c "CREATE DATABASE syscend_test OWNER syscend_user;"

# Restore to test database
gunzip -c /var/backups/syscend/db_XXXXXXXX_XXXXXX.sql.gz | psql -U syscend_user syscend_test

# Verify tables exist
psql -U syscend_user syscend_test -c "\dt"

# Drop test database
sudo -u postgres psql -c "DROP DATABASE syscend_test;"
```

---

## Recovery Time Objectives

| Component | RTO (Recovery Time Objective) |
|-----------|-------------------------------|
| Database restore | ~5-10 minutes (1GB database) |
| Storage restore | ~5-15 minutes (depends on upload volume) |
| Full application restore | ~15-30 minutes |
| Code rollback | ~2-5 minutes |

---

## Backup Checklist

- [ ] Database backups running daily
- [ ] Backups are compressed (gzip)
- [ ] Backups are stored offsite (S3 or remote server)
- [ ] Backup retention policy set (30 days recommended)
- [ ] .env backed up on every change
- [ ] Backup restoration tested monthly
- [ ] Storage backups include all uploaded files
- [ ] Backup logs are monitored
