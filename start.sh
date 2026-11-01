#!/bin/sh

echo "Running migrations..."
php artisan migrate --force || echo "WARNING: migrations failed, continuing..."

echo "Linking storage..."
php artisan storage:link || echo "WARNING: storage:link failed, continuing..."

echo "Optimizing application..."
php artisan optimize:clear || true

echo "Starting FrankenPHP..."
exec docker-php-entrypoint --config /Caddyfile --adapter caddyfile 2>&1
