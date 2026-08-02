# LDP Architecture (P0008)

## Domain

- **Host:** `ldp.infi.io.vn` (single Vercel project)
- **Admin:** `/`, `/pages`, `/templates`
- **Public:** `/001`, `/002`, … (numeric `pathCode`, 3–4 digits)
- **Reserved:** `/api`, `/preview`, `/admin`, `/assets`

## Templates

| Template ID | Source | First page |
|-------------|--------|------------|
| `mie-hair-cod-v1` | P0014 Hair Landing SSOT | `/001` |

## CRM

CRM is **not** part of P0008. Brand CRM stays on separate domains (e.g. `toc.infi.io.vn/crm` iframe → P0005).

## Option A (slot CMS) — next

- Supabase tables: `landing_pages`, `landing_asset_overrides`
- Admin upload per slot; runtime merge override → template default
- Storage bucket: `landing-assets/{pathCode}/{slot}`

## Redirects (when prod cutover)

- `301` `toc.infi.io.vn/ldp01` → `ldp.infi.io.vn/001`
