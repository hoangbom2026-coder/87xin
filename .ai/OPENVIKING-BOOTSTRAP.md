# OPENVIKING-BOOTSTRAP.md — Nạp Context Vào OpenViking

_Chạy 1 lần sau khi cài Hermes hoặc khi OpenViking bị reset._
_File: /var/app/game/tools/hermes/openviking_bootstrap.py_

---

## BƯỚC 1: Tạo file bootstrap script

Chạy lệnh này trên VPS terminal:

```bash
cat > /var/app/game/tools/hermes/openviking_bootstrap.py << 'PYEOF'
#!/usr/bin/env python3
import requests, json
from datetime import datetime

BASE = "http://159.223.81.157:1933/api/v1"

def write(uri, content, meta=None):
    r = requests.post(f"{BASE}/content/write",
        json={"uri": uri, "content": content.strip(), "mode": "replace", **({"metadata": meta} if meta else {})},
        timeout=10)
    r.raise_for_status()
    print(f"[OK] {uri}")

def qry(q):
    r = requests.post(f"{BASE}/search/search",
        json={"query": q, "mode": "list", "top_k": 3, "score_threshold": 0.3}, timeout=10)
    res = r.json().get("resources", [])
    print(f"[QUERY] '{q}' -> {len(res)} results")
    return res

# ── DATA ──
write("viking://tc-gaming/project/overview", """
Project: tc-gaming.live | Repo: /var/app/game (VPS monorepo)
Stack: Node/Express :8701 + React admin :8781 + React frontend (Nginx)
Deploy: GitHub Actions -> rsync -> PM2 reload
Domains: tc-gaming.live (player) | admin.tc-gaming.live (admin)
""", {"project": "tc-gaming", "type": "overview"})

write("viking://tc-gaming/architecture/rules", """
Dependency: Apps -> Libs ONLY. Never App -> App.
Pattern: Controller -> Service -> Model (never skip Service)
Error: throw new ApiError(httpStatus.XXX, msg) not throw new Error()
Auth: req.user! (guaranteed non-null after auth middleware)
No manual try/catch inside catchAsync
API Response: { success: bool, data?, error?: { code, message } }
UI: AdminLayout on ALL admin pages. DataTable for tables. No hex colors.
""", {"project": "tc-gaming", "type": "architecture"})

write("viking://tc-gaming/architecture/paths", """
@game/ui -> libs/ui/src/index.ts
@game/types -> libs/shared-types/src/index.ts
@game/db -> libs/db/index.ts
@game/cron -> libs/cron/index.ts
@game/shared-utils -> libs/shared-utils/src/index.ts
@game/i18n -> libs/i18n/index.ts
@main/* -> apps/backend/src/main/*
@utils/* -> apps/backend/src/utils/*
@middlewares/* -> apps/backend/src/middlewares/*
@config/* -> apps/backend/src/config/*
""", {"project": "tc-gaming", "type": "paths"})

write("viking://tc-gaming/state/current", f"""
Updated: {datetime.now().strftime('%Y-%m-%d')}
Done: TASK-001 (role), TASK-002 (admin-staff), BOOT-001..007
TS errors: ~82 (pre-existing ObjectId/string + req.user optional)
Issues:
  11 controllers import Model directly
  35 try/catch in controllers
  15 services throw generic Error
  14 admin pages missing AdminLayout
  8 fetch() bypass api.ts
Next: /var/app/game/.ai/HERMES-MASTER-TASKS.md
""", {"project": "tc-gaming", "type": "state"})

write("viking://tc-gaming/team/roles", """
Hermes: Maestro - reads .ai/tasks/, executes, reports
OpenViking: Memory at 159.223.81.157:1933
OmniRoute: LLM gateway at 127.0.0.1:20128 (routes free accounts)
OpenHands: Code executor - spec from .ai/tasks/TASK-ID.md
BOB: Lead Architect (strategic decisions)
""", {"project": "tc-gaming", "type": "team"})

write("viking://tc-gaming/hermes/rules", """
1. Before task: openviking_query("tc-gaming [topic]")
2. After task: openviking_write to save progress
3. One task per prompt - no bundling
4. Verify: npm run typecheck after editing TS
5. Report: "Done [task]. TS errors: [N]. Next: [task]."
6. No emoji. Vietnamese replies. Keep English tech terms.
7. OmniRoute 127.0.0.1:20128 routes to free LLM accounts
8. Task specs: /var/app/game/.ai/tasks/TASK-ID.md
""", {"project": "tc-gaming", "type": "rules"})

write("viking://tc-gaming/commands/deploy", """
Deploy: sudo bash /var/app/game/infra/scripts/deploy.sh
Rollback: sudo bash /var/app/game/infra/scripts/rollback.sh
Monitor: bash /var/app/game/infra/scripts/monitor.sh
Health: curl -sf http://127.0.0.1:8701/health
PM2: pm2 status
Typecheck: cd /var/app/game && npm run typecheck
Test: npm run test -w apps/backend
""", {"project": "tc-gaming", "type": "commands"})

write("viking://tc-gaming/sprint/pending", """
P1 - Do now:
  req.user! fix in 8 controllers
  15 services: throw Error -> ApiError
  26 models: ObjectId | string
  14 admin pages: add AdminLayout
  3 files: fetch() -> api.ts
  .env.example: cuocbong99 -> tc-gaming

P2 - After P1:
  article.service.ts + refactor controller
  ticket.service.ts + refactor controller
  Remove 35 try/catch from controllers
  Admin pages: useState -> TanStack Query
""", {"project": "tc-gaming", "type": "tasks"})

# ── VERIFY ──
print("\n-- Verify --")
qry("tc-gaming architecture")
qry("tc-gaming pending tasks")
print("\nBootstrap complete.")
PYEOF
echo "Script created."
```

---

## BƯỚC 2: Chạy bootstrap

```bash
cd /var/app/game
python3 tools/hermes/openviking_bootstrap.py
```

**Output mong đợi:**
```
[OK] viking://tc-gaming/project/overview
[OK] viking://tc-gaming/architecture/rules
[OK] viking://tc-gaming/architecture/paths
[OK] viking://tc-gaming/state/current
[OK] viking://tc-gaming/team/roles
[OK] viking://tc-gaming/hermes/rules
[OK] viking://tc-gaming/commands/deploy
[OK] viking://tc-gaming/sprint/pending

-- Verify --
[QUERY] 'tc-gaming architecture' -> 3 results
[QUERY] 'tc-gaming pending tasks' -> 3 results

Bootstrap complete.
```

---

## BƯỚC 3: Kiểm tra từ Hermes

Sau khi bootstrap, test trong Hermes:

```
openviking_query query="tc-gaming state" mode="list" top_k=3
```

Phải nhận được kết quả từ `viking://tc-gaming/state/current`.

---

## CẬP NHẬT ĐỊNH KỲ

Chạy lại script sau mỗi sprint lớn để cập nhật state:

```bash
# Hoặc chỉ update state hiện tại từ Hermes:
openviking_write uri="viking://tc-gaming/state/current"
content="Updated: [DATE]. Done: [tasks]. TS: [N] errors. Next: [task]."
```
