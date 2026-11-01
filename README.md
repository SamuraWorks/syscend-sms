# Syscend Campus

School Management Platform for Sierra Leone — built with Laravel 13 + React (Inertia.js).

## Stack

- **Backend:** Laravel 13, PostgreSQL 17, PHP 8.3+
- **Frontend:** React 19, TypeScript, Tailwind CSS 4, Inertia.js 3, Zustand
- **Build:** Vite 8, Composer, npm

## Quick Start

```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
npm install
npm run dev
php artisan serve
```

## Production

```bash
composer install --no-dev --optimize-autoloader
npm run build
php artisan migrate --force
php artisan config:cache && php artisan route:cache && php artisan view:cache
```

Automated deployment options: `deploy.bat` (manual SSH), `render.yaml` (Render), `railway.json` (Railway), and `infra/docker-compose.yml` (Docker). See `docs/deployment-guide.md`.

## Testing

```bash
composer run test
```

Requires a PostgreSQL database `syscend_campus_testing` (credentials come from `phpunit.xml` / env).

## License

MIT
