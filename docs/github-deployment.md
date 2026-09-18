# Syscend Campus — GitHub Deployment Recommendations

---

## Branch Strategy

```
main          ← Production-ready code
  └── develop ← Integration branch
       ├── feature/*  ← New features
       ├── fix/*      ← Bug fixes
       └── hotfix/*   ← Emergency production fixes
```

| Branch | Purpose | Deploys To |
|--------|---------|-----------|
| `main` | Stable, production-ready | Production server |
| `develop` | Integration testing | Staging server (optional) |
| `feature/*` | New features in progress | Developer machines only |
| `hotfix/*` | Emergency fixes | Direct to production |

---

## GitHub Secrets (for CI/CD)

If using GitHub Actions, configure these secrets in **Settings → Secrets → Actions**:

| Secret | Purpose |
|--------|---------|
| `DEPLOY_HOST` | VPS IP address or hostname |
| `DEPLOY_USER` | SSH username for deployment |
| `DEPLOY_KEY` | SSH private key |
| `DEPLOY_PATH` | Path to project on server (e.g., `/var/www/syscend-campus`) |

---

## GitHub Actions Workflow (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.2'
          extensions: pgsql, mbstring, xml, curl, zip, gd, bcmath, redis
          coverage: none

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install Dependencies
        run: composer install --no-progress --prefer-dist

      - name: Build Frontend
        run: |
          npm ci
          npm run build

      - name: Run Tests
        run: |
          cp .env.example .env
          php artisan key:generate
          php artisan test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.DEPLOY_HOST }}
          username: ${{ secrets.DEPLOY_USER }}
          key: ${{ secrets.DEPLOY_KEY }}
          script: |
            cd ${{ secrets.DEPLOY_PATH }}
            git pull syscend main
            composer install --no-dev --optimize-autoloader --no-interaction
            npm ci && npm run build
            php artisan migrate --force
            php artisan config:cache
            php artisan route:cache
            php artisan view:cache
            php artisan event:cache
            sudo supervisorctl restart syscend-worker:*
```

---

## Release Tagging

Tag releases for easy rollback:

```bash
# After successful deploy
git tag -a v1.0.0 -m "Production release v1.0.0"
git push syscend v1.0.0
```

To rollback to a specific version:

```bash
git checkout v1.0.0
# Then rebuild and re-cache
```

---

## Pre-Deploy Checklist (Manual)

Before merging to `main`:

- [ ] All tests pass locally
- [ ] `npm run build` completes without errors
- [ ] `php artisan test` passes
- [ ] No `dd()`, `dump()`, `var_dump()` in code
- [ ] No hardcoded passwords or API keys
- [ ] `.env.example` updated with new env vars
- [ ] Database migrations are backward-compatible
- [ ] `APP_DEBUG=false` in production `.env`
- [ ] `APP_KEY` is unique per environment
- [ ] Changelog updated

---

## Post-Deploy Checklist

After deploying to production:

- [ ] Health check: `curl -I https://syscend.com/up` returns 200
- [ ] Login test: Can log in as super-admin
- [ ] Queue workers running: `sudo supervisorctl status`
- [ ] No new errors in `storage/logs/laravel.log`
- [ ] Cron job running: `php artisan schedule:run --force`
- [ ] SSL certificate valid: `echo | openssl s_client -connect syscend.com:443 2>/dev/null | openssl x509 -noout -dates`
