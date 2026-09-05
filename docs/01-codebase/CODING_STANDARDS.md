# CODEBASE_STANDARDS — tc-gaming.live

## 1. Import Rules
- KHÔNG BAO GIỜ import ngang hàng (App A -> App B).
- BẮT BUỘC import theo alias (`@game/*`, `@main/*`, `@utils/*`).

## 2. Coding Style
- Backend: Controller -> Service -> Model.
- Frontend:shadcn/ui (Admin), Redux-Saga (Player).
- Naming: CamelCase, file `.ts`/`.tsx`.

## 3. Tech Debt (Cần dọn dẹp)
- Raw Mongoose documents trong Controller (cần map DTO).
- req.user: any (cần gán type).
- Duplicated Axios client.
