# AGENTS.md - Huong dan AI agents

## Source of truth

- Ma nguon thuc te la nguon su that uu tien cao nhat.
- Kiem tra code va test truoc khi tin vao memory hoac tai lieu cu.
- Khong xoa, di chuyen, hoac ghi de du lieu neu chua xac dinh ro pham vi.

## Vai tro

- Hermes: dieu phoi, phan tich kien truc, review va tong hop ket qua.
- OpenHands: thuc thi cac task code duoc giao.
- OpenViking: memory dai han, khong thay the source code.

## Quy trinh

1. Discover: doc cau truc va code path lien quan.
2. Plan: neu gia thuyet, pham vi va cach kiem chung.
3. Implement: thay doi nho, giu nguyen public API neu khong bat buoc doi.
4. Test: chay test, typecheck, lint hoac build phu hop.
5. Review: kiem tra diff, regression va tai lieu can cap nhat.

## Cau truc hien tai

- `apps/backend`: Node.js/Express API.
- `apps/frontend-web`: frontend nguoi choi.
- `apps/admin-dashboard`: dashboard quan tri.
- `libs`: shared packages.
- `tools/hermes`: cong cu Hermes.
- `docs`: tai lieu du an va prompt van hanh.

## OpenViking

Hermes co the truy van OpenViking de lay context dai han truoc task va ghi lai tom tat sau task. Neu memory mau thuan voi code, code trong repository duoc uu tien.