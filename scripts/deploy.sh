#!/usr/bin/env bash
# Deploy to production VPS — rsync + PM2 reload + healthcheck
# Usage: ./scripts/deploy.sh [--no-backup]
#
# Env vars (or .env.deploy):
#   DEPLOY_HOST, DEPLOY_USER, DEPLOY_PORT, DEPLOY_PATH

set -euo pipefail
cd "$(dirname "$0")/.."

# ─── Config ──────────────────────────────────────────────────────────────────
if [ -f .env.deploy ]; then
  set -a; source .env.deploy; set +a
fi

DEPLOY_HOST="${DEPLOY_HOST:-159.223.81.157}"
DEPLOY_USER="${DEPLOY_USER:-root}"
DEPLOY_PORT="${DEPLOY_PORT:-22}"
DEPLOY_PATH="${DEPLOY_PATH:-/var/app/game}"
SSH_OPTS="-p $DEPLOY_PORT -o StrictHostKeyChecking=no -o ConnectTimeout=10"
NO_BACKUP=false

for arg in "$@"; do
  case "$arg" in
    --no-backup) NO_BACKUP=true ;;
    *) echo "Unknown flag: $arg"; exit 1 ;;
  esac
done

# ─── Pre-flight ──────────────────────────────────────────────────────────────
if [ ! -d "apps/backend/dist" ]; then
  echo "ERROR: apps/backend/dist not found. Run: ./scripts/build.sh"
  exit 1
fi

echo "==> Deploying TC-Gaming to $DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH"
echo "    Port: $DEPLOY_PORT | Backup: $( $NO_BACKUP && echo 'skip' || echo 'yes' )"

# ─── Backup (on remote) ─────────────────────────────────────────────────────
if [ "$NO_BACKUP" = false ]; then
  echo ""
  echo "==> Creating remote backup..."
  BACKUP_TAG="backup-$(date +%Y%m%d-%H%M%S)"
  ssh $SSH_OPTS "$DEPLOY_USER@$DEPLOY_HOST" bash -s <<REMOTE_EOF
    set -e
    BACKUP_DIR="$DEPLOY_PATH/infra/backups/$BACKUP_TAG"
    mkdir -p "$BACKUP_DIR"
    cp -r "$DEPLOY_PATH/apps/backend/dist" "$BACKUP_DIR/backend-dist" 2>/dev/null || true
    cp -r "$DEPLOY_PATH/apps/frontend-web/dist" "$BACKUP_DIR/frontend-dist" 2>/dev/null || true
    cp -r "$DEPLOY_PATH/apps/admin-dashboard/dist" "$BACKUP_DIR/admin-dist" 2>/dev/null || true
    cp "$DEPLOY_PATH/infra/ecosystem.production.cjs" "$BACKUP_DIR/" 2>/dev/null || true
    echo "    ✓ Backup: $BACKUP_DIR"

    # Keep only last 5 backups
    cd "$DEPLOY_PATH/infra/backups"
    ls -dt backup-* 2>/dev/null | tail -n +6 | xargs rm -rf 2>/dev/null || true
REMOTE_EOF
  echo "    ✓ Backup complete"
fi

# ─── Rsync artifacts ─────────────────────────────────────────────────────────
echo ""
echo "==> Uploading build artifacts..."
rsync -avz -e "ssh $SSH_OPTS" --delete \
  ./apps/backend/dist/ "$DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH/apps/backend/dist/"

rsync -avz -e "ssh $SSH_OPTS" --delete \
  ./apps/frontend-web/dist/ "$DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH/apps/frontend-web/dist/"

rsync -avz -e "ssh $SSH_OPTS" --delete \
  ./apps/admin-dashboard/dist/ "$DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH/apps/admin-dashboard/dist/"

rsync -avz -e "ssh $SSH_OPTS" \
  ./infra/ecosystem.production.cjs "$DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH/infra/ecosystem.production.cjs"

rsync -avz -e "ssh $SSH_OPTS" \
  ./package.json ./package-lock.json "$DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH/"

echo "    ✓ Artifacts uploaded"

# ─── Reload PM2 ──────────────────────────────────────────────────────────────
echo ""
echo "==> Reloading PM2 processes..."
ssh $SSH_OPTS "$DEPLOY_USER@$DEPLOY_HOST" bash -s <<'REMOTE_EOF'
  set -e
  cd /var/app/game

  # Install root deps if package.json changed
  npm ci --omit=dev 2>/dev/null || npm install --omit=dev 2>/dev/null || true

  echo "  → Reloading tc-api..."
  pm2 reload tc-api --update-env 2>/dev/null || \
    pm2 start /var/app/game/infra/ecosystem.production.cjs --only tc-api

  echo "  → Reloading tc-admin..."
  pm2 reload tc-admin --update-env 2>/dev/null || \
    pm2 start /var/app/game/infra/ecosystem.production.cjs --only tc-admin

  pm2 save 2>/dev/null || true
REMOTE_EOF
echo "    ✓ PM2 reloaded"

# ─── Healthcheck ─────────────────────────────────────────────────────────────
echo ""
echo "==> Running healthcheck..."
for i in 1 2 3; do
  if ssh $SSH_OPTS "$DEPLOY_USER@$DEPLOY_HOST" "curl -sf http://127.0.0.1:8701/health" 2>/dev/null; then
    echo ""
    echo "    ✓ Healthcheck passed (attempt $i)"
    break
  fi
  if [ "$i" -eq 3 ]; then
    echo ""
    echo "    ✗ Healthcheck failed after 3 attempts"
    echo "    Rollback: ssh $DEPLOY_USER@$DEPLOY_HOST 'cd $DEPLOY_PATH && ./scripts/rollback.sh'"
    exit 1
  fi
  echo "    Attempt $i failed, retrying in 5s..."
  sleep 5
done

echo ""
echo "==> Deploy complete!"
