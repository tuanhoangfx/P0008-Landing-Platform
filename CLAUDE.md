# CLAUDE.md — P0008 Landing Platform agent entry point

React 19 + Vite + TS. Dual-zone SPA: **admin console** (Hub-UI shell) tại `/` + **public landing pages** tại `/001`, `/002`… Port **3008**, prod `ldp.infi.io.vn`.

## Hub-UI SSOT — LUẬT BẤT BIẾN

1. **Mọi chrome admin (sidebar/header/footer/main/table/filter/toast/modal) phải import từ `@tool-workspace/hub-ui`** — không tự viết component song song, không copy CSS vendor vào `src/`. Golden shell: P0020; golden directory: P0004/users (xem `tool.manifest.json` → `uiShell`, `uiScreens`).
2. **`vendor/**` là bản mirror tự sinh** từ `E:\Dev\packages` — không sửa tay; predev tự sync. Sửa nguồn tại `packages/hub-ui` (hoặc P0004 cho filter stack).
3. **CSS hub chỉ được import qua `src/styles/hub-ui-styles.css`** (đường dẫn tương đối `../../vendor/hub-ui/src/styles/*.css`). Không fork file CSS vendor vào `src/theme/` (bài học: `hub-boot.css` fork stale đã bị xóa 2026-08-03).
4. **Zone landing (`src/landing/`, `src/index.css`, token `hair-*`, font Be Vietnam Pro) không được rò vào admin**: `HairLandingPage` phải luôn lazy-load trong `App.tsx`; font admin ép `Inter` qua `body:has(.hub-app.theme-hub)` trong `src/styles.css`.
5. `HubToolLoadingProvider` phải nằm trong **`src/App.tsx`** (gate `hub-loading-parity` chỉ đọc file này).

## Commands

| Command | Ý nghĩa |
|---|---|
| `pnpm dev` | Chạy **predev chain** (sync vendor + toàn bộ gate SSOT) rồi Vite :3008 |
| `pnpm gates` | Chạy nhanh 3 gate: css-check + parity-check + wave-gate cho P0008 |
| `pnpm build` | tsc --noEmit + vite build (CI may skip tsc) |
| `pnpm typecheck` | tsc --noEmit |

Predev chain: `sync-hub-ui-vendor` → `sync-hub-identity-vendor` → `verify-hub-vendor-prereqs` → `verify-hub-ui-exports --fix` → `sync-hub-brand-icons` → `audit-react-hook-imports --sidebar` → `hub-ui-css-check` → `hub-ui-parity-check` → `hub-ssot-wave-gate`.

## Gate registry (P0008 đã đăng ký 2026-08-03 — đừng gỡ)

P0008 nằm trong: `HUB_UI_CODES` (gate-profiles.mjs), `HUB_SSOT_UI_SHELL_CODES` (hub-ssot-focus.cjs), `UI_SHELL_REQUIRED` (hub-main-shell-gate.mjs), `MAIN_SHELL_CODES` + `VERSION_META_CODES` (hub-ssot-wave-gate.mjs), `DIRECTORY_TOOLBAR_PAGE_SIZE_CODES` (directory-toolbar-page-size-contract.mjs), `PRODUCT_ROOTS` của verify-hub-vendor-prereqs / audit-duplicate-imports / refresh-hub-ui-node-link / audit-react-hook-imports, `ALL_TARGETS` của sync-hub-brand-icons. Thêm concern mới → chạy `node Tool/scripts/hub-ssot-gate-registry-check.mjs`.

## Facts agents get wrong

- `sync-hub-shell.cjs --force` sẽ đè shell P0008 bằng scaffold generic — sau đó **phải chạy** `node Tool/scripts/restore-p0008-admin-shell.mjs` để khôi phục dual-zone nav/brand.
- Overview dùng raw `rounded-2xl` sections theo **golden P0004/overview-toc** — đó là chuẩn, đừng "sửa" thành HubPanel.
- `src/theme/p0008-hub-shell.css` là skin local hợp lệ (tương đương `p0005-crm-shell.css` bên P0005).
- Không còn `src/crm/` — TOC CRM portal (hand-rolled, dead code) đã xóa 2026-08-03; CRM ở P0005.
- Design preview pattern: `src/app/design-preview/` chưa có — khi thêm feature UI mới, tạo 5 variants theo workflow design-first của workspace.
