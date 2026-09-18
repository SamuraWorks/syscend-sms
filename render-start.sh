#!/bin/bash
php artisan key:generate --force
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache
php artisan serve --host=0.0.0.0 --port=$PORT
