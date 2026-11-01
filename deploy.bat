@echo off
echo === Syscend Campus Deployment ===
echo.

echo [1/5] Pulling latest code from GitHub...
ssh -o StrictHostKeyChecking=no deploy@62.238.62.178 "cd /var/www/syscend && git pull origin main"
if %errorlevel% neq 0 (
    echo ERROR: git pull failed
    pause
    exit /b 1
)

echo.
echo [2/5] Running migrations...
ssh deploy@62.238.62.178 "cd /var/www/syscend && php artisan migrate --force"
if %errorlevel% neq 0 (
    echo ERROR: migration failed
    pause
    exit /b 1
)

echo.
echo [3/5] Installing composer dependencies...
ssh deploy@62.238.62.178 "cd /var/www/syscend && composer install --no-dev --optimize-autoloader"

echo.
echo [4/5] Building frontend assets...
ssh deploy@62.238.62.178 "cd /var/www/syscend && npm run build"

echo.
echo [5/5] Clearing caches...
ssh deploy@62.238.62.178 "cd /var/www/syscend && php artisan config:clear && php artisan cache:clear && php artisan view:clear"

echo.
echo === Deployment complete! ===
echo Visit: https://62.238.62.178
pause
