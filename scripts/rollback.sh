#!/usr/bin/env bash
# Rollback to last deployment backup
# Usage: ./scripts/rollback.sh [backup-tag]
# If no tag given, uses newest backup.

set -euo pipefail
cd "$(dirname "$0")/.."

DEPLOY_HOST="${DEPLOY_HOST:-159.223.81.157}"
DEPLOY_USER="${DEPLOY_USER:-root}"
DEPLOY_PORT="${DEPLOY_PORT:-22}"
DEPLOY_PATH="${DEPLOY_PATH:-/var/app/game}"
SSH_OPTS="-p $DEPLOY_PORT -o StrictHostKeyChecking=no"

if [ -f .env.deploy ]; then
  set -a; source .env.deploy; set +a
fi

TAG="${1:-}"
echo "==> Rolling back $DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH"

if [ -z "$TAG" ]; then
  TAG=$(ssh $SSH_OPTS "$DEPLOY_USER@$DEPLOY_HOST" \
    "ls -dt $DEPLOY_PATH/infra/backups/backup-* 2>/dev/null | head -1 | xargs -n1 basename")
fi

if [ -z "$TAG" ]; then
  echo "ERROR: No backup found at $DEPLOY_PATH/infra/backups/"
  exit 1
fi

echo "    Using backup: $TAG"

ssh $SSH_OPTS "$DEPLOY_USER@$DEPLOY_HOST" bash -s <<REMOTE_EOF
  set -e
  BK="$DEPLOY_PATH/infra/backups/$TAG"

  [ -d "\$BK/backend-dist" ] && cp -r "\$BK/backend-dist" "$DEPLOY_PATH/apps/backend/dist" && echo "  ✓ backend restored"
  [ -d "\$BK/frontend-dist" ] && cp -r "\$BK/frontend-dist" "$DEPLOY_PATH/apps/frontend-web/dist" && echo "  ✓ frontend restored"
  [ -d "\$BK/admin-dist" ] && cp -r "\$BK/admin-dist" "$DEPLOY_PATH/apps/admin-dashboard/dist" && echo "  ✓ admin restored"
  [ -f "\$BK/ecosystem.production.cjs" ] && cp "\$BK/ecosystem.production.cjs" "$DEPLOY_PATH/infra/" && echo "  ✓ ecosystem restored"

  cd "$DEPLOY_PATH"
  pm2 reload tc-api --update-env 2>/dev/null || true
  pm2 reload tc-admin --update-env 2>/dev/null || true
  pm2 save 2>/dev/null || true

  echo "  ✓ Rollback complete, PM2 reloaded"
REMOTE_EOF

echo ""
echo "==> Rollback done. Verify: ssh $DEPLOY_USER@$DEPLOY_HOST 'curl -sf http://127.0.0.1:8701/health'"
