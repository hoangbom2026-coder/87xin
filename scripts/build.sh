#!/usr/bin/env bash
# Build all apps — backend, frontend-web, admin-dashboard
# Usage: ./scripts/build.sh [backend|frontend-web|admin-dashboard]

set -euo pipefail
cd "$(dirname "$0")/.."

ROOT=$(pwd)
ARTIFACT_DIR="$ROOT/build-artifact"

echo "==> Building TC-Gaming monorepo..."
echo "    Root: $ROOT"

build_backend() {
  echo ""
  echo "==> [1/3] Building apps/backend..."
  cd "$ROOT/apps/backend"
  npm run typecheck 2>&1 || true
  npm run build 2>&1
  echo "    ✓ backend built"
}

build_frontend() {
  echo ""
  echo "==> [2/3] Building apps/frontend-web..."
  cd "$ROOT/apps/frontend-web"
  npm run typecheck 2>&1 || true
  npm run build 2>&1
  echo "    ✓ frontend-web built"
}

build_admin() {
  echo ""
  echo "==> [3/3] Building apps/admin-dashboard..."
  cd "$ROOT/apps/admin-dashboard"
  npm run typecheck 2>&1 || true
  npm run build 2>&1
  echo "    ✓ admin-dashboard built"
}

prepare_artifacts() {
  echo ""
  echo "==> Preparing build artifacts..."
  rm -rf "$ARTIFACT_DIR"
  mkdir -p "$ARTIFACT_DIR/apps/backend"
  mkdir -p "$ARTIFACT_DIR/apps/frontend-web"
  mkdir -p "$ARTIFACT_DIR/apps/admin-dashboard"
  mkdir -p "$ARTIFACT_DIR/infra"

  cp -r "$ROOT/apps/backend/dist" "$ARTIFACT_DIR/apps/backend/"
  cp "$ROOT/apps/backend/package.json" "$ARTIFACT_DIR/apps/backend/"

  cp -r "$ROOT/apps/frontend-web/dist" "$ARTIFACT_DIR/apps/frontend-web/"

  cp -r "$ROOT/apps/admin-dashboard/dist" "$ARTIFACT_DIR/apps/admin-dashboard/"

  cp "$ROOT/infra/ecosystem.production.cjs" "$ARTIFACT_DIR/infra/"
  cp "$ROOT/package.json" "$ARTIFACT_DIR/"
  cp "$ROOT/package-lock.json" "$ARTIFACT_DIR/"

  echo "    ✓ Artifacts ready at $ARTIFACT_DIR"
}

TARGET="${1:-all}"
case "$TARGET" in
  backend)       build_backend ;;
  frontend-web)  build_frontend ;;
  admin-dashboard) build_admin ;;
  all)
    build_backend
    build_frontend
    build_admin
    prepare_artifacts
    ;;
  *)
    echo "Usage: $0 [backend|frontend-web|admin-dashboard|all]"
    exit 1
    ;;
esac

echo ""
echo "==> Build complete!"
