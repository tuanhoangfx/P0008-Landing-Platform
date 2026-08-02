# Landing Platform (P0008)

Multi-template COD landing host at **ldp.infi.io.vn**.

| Route | Purpose |
|-------|---------|
| `/` | Admin — pages, templates, asset slots (Option A) |
| `/001` | Public — Mie Hair COD (`mie-hair-cod-v1`) |
| `/api/*` | Order intake + future slot uploads |

## Dev

```bash
cd Tool/P0008-Landing-Platform
corepack pnpm install
corepack pnpm dev
```

- Admin: http://127.0.0.1:3008/
- Landing: http://127.0.0.1:3008/001

## Migration

- Source template migrated from P0014 (`toc.infi.io.vn/ldp01` → `ldp.infi.io.vn/001`)
- CRM remains on `toc.infi.io.vn/crm` (P0014 + P0005 tenant)

See `docs/LDP-ARCHITECTURE.md`.
