# Cau truc thu muc thuc te

Tai lieu nay mo ta cau truc dang duoc su dung trong repository. Khong tu dong doi ten cac app chi de khop voi mot cay thu muc mau.

```text
/var/app/game/
├── .ai/                  # Prompt, task, report va memory cua agent
├── .github/              # CI/CD workflows
├── .vscode/              # Editor settings va launch config
├── apps/
│   ├── admin-dashboard/  # Vite/React admin dashboard
│   ├── backend/          # Node.js/Express backend
│   ├── frontend-web/     # Frontend nguoi choi
│   └── hermes-vscode-extension/ # VS Code extension Hermes
├── configs/              # Cau hinh va quy uoc chung
├── docs/                 # Tai lieu kien truc, van hanh va AI
├── infra/                # Deploy, nginx, systemd va scripts
├── libs/                 # Shared libraries
├── tools/
│   ├── hermes/           # Hermes tooling
│   └── hermes-vn.sh      # Helper script
├── .env.production       # Khong commit, chua cau hinh production
├── package.json
├── README.md
└── tsconfig.base.json
```

## Thu muc can xem xet rieng

- `.backup-roots` hien dang rong; chua xoa tu dong.
- `.gemini` dang co `settings.json`; can xac nhan truoc khi xoa.
- `apps/backend/dist.old` la artifact backup dang co trong workspace; khong coi la source moi neu chua kiem tra nguon goc.

## Nguyen tac sap xep

- Giu ten app hien tai de tranh break import, workspace va deploy config.
- Them tai lieu hoac tooling truoc khi can nhac di chuyen module.
- Moi thay doi vi tri phai cap nhat import path, TypeScript config, build config va deploy script.