#!/usr/bin/env bash
set -euo pipefail

# ── Syscend Campus · Hetzner VPS one-shot deploy ─────────────────────────────
# Run as root (Ubuntu VM). Pulls the repo from GitHub, builds the Docker stack,
# migrates the DB and seeds the Super Admin account.

APP_DIR=/opt/syscend-campus
GIT_REPO=https://github.com/SamuraWorks/syscend-campus.git
BRANCH=main
COMPOSE_FILE=$APP_DIR/infra/docker-compose.yml
PUBLIC_IP=$(curl -4 -s ifconfig.me 2>/dev/null || echo "157.180.30.84")

export DEBIAN_FRONTEND=noninteractive

echo "==> [1/7] Installing Docker + Compose plugin"
if ! command -v docker >/dev/null 2>&1; then
    apt-get update -y
    apt-get install -y ca-certificates curl gnupg
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" > /etc/apt/sources.list.d/docker.list
    apt-get update -y
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    systemctl enable --now docker
fi
echo "   docker: $(docker --version)  compose: $(docker compose version)"

echo "==> [2/7] Cloning repo ($BRANCH)"
if [ -d "$APP_DIR/.git" ]; then
    cd "$APP_DIR" && git fetch origin && git reset --hard origin/$BRANCH
else
    git clone --branch "$BRANCH" --depth 1 "$GIT_REPO" "$APP_DIR"
fi
cd "$APP_DIR"

echo "==> [3/7] Generating PostgreSQL password (if not exported)"
DB_PASSWORD="${DB_PASSWORD:-}"
if [ -z "$DB_PASSWORD" ]; then
    DB_PASSWORD=$(openssl rand -hex 24)
    echo "   generated DB_PASSWORD for this install: $DB_PASSWORD"
fi
export DB_PASSWORD

echo "==> [3b/7] Writing runtime env file (infra/.env.hetzner)"
cat > "$APP_DIR/infra/.env.hetzner" <<ENV
APP_NAME=Syscend Campus
APP_ENV=production
APP_DEBUG=false
APP_URL=http://$PUBLIC_IP
APP_TIMEZONE=Africa/Freetown
APP_LOCALE=en
APP_FAKER_LOCALE=en_US
LOG_CHANNEL=stack
DB_CONNECTION=pgsql
DB_HOST=db
DB_PORT=5432
DB_DATABASE=syscend_campus
DB_USERNAME=syscend
DB_SSLMODE=disable
SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_SECURE_COOKIE=false
CACHE_STORE=file
QUEUE_CONNECTION=sync
FILESYSTEM_DISK=local
MAIL_MAILER=log
SEED_ADMIN_PASSWORD=Syscend#Admin2026
SEED_ADMIN_EMAIL=syscend@gmail.com
VITE_APP_NAME=Syscend Campus
ENV

echo "==> [4/7] Building app image (may take 5-10 min)"
docker compose -f "$COMPOSE_FILE" build app

echo "==> [5/7] Starting stack (PostgreSQL + app + nginx)"
docker compose -f "$COMPOSE_FILE" up -d

echo "==> [5b/7] Waiting for DB readiness, then migrating + seeding"
for i in $(seq 1 90); do
    if docker compose -f "$COMPOSE_FILE" exec -T db pg_isready -U syscend -d syscend_campus >/dev/null 2>&1; then
        break
    fi
    sleep 2
done

docker compose -f "$COMPOSE_FILE" run --rm app php artisan migrate --force
docker compose -f "$COMPOSE_FILE" run --rm app php artisan db:seed --force
docker compose -f "$COMPOSE_FILE" run --rm app php artisan storage:link || true
docker compose -f "$COMPOSE_FILE" run --rm app php artisan optimize:clear || true

echo "==> [6/7] Syncing built assets to nginx"
docker compose -f "$COMPOSE_FILE" up assets
docker compose -f "$COMPOSE_FILE" restart web

echo "==> [7/7] Done"
cat <<EOF

  ┌────────────────────────────────────────────────────────────┐
  │  Syscend Campus is live at:                                 │
  │                                                             │
  │      http://$PUBLIC_IP                                  │
  │                                                             │
  │  Super Admin login:                                         │
  │      email    : syscend@gmail.com                           │
  │      password : Syscend#Admin2026                           │
  │                                                             │
  │  NOTE: DB_PASSWORD was auto-generated for this server.      │
  │  Save it if you intend to reconnect externally.             │
  └────────────────────────────────────────────────────────────┘
EOF