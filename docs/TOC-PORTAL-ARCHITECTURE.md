# TOC Portal Architecture (P0014)

## Domain layout

```
toc.infi.io.vn
├── /ldp01              → Landing COD funnel (native P0014)
├── /ldp02 …            → Future landing slugs (PRODUCT_REGISTRY)
├── /crm                → redirect /crm/orders
├── /crm/orders         → CRM shell + iframe Orders
├── /crm/customers      → CRM shell + iframe Customers
└── /crm/products       → CRM shell + iframe Products
```

**Hợp lý:** một domain thương hiệu TOC — khách vào `/ldp01`, nội bộ vào `/crm/*`.

## Separate CRM (doanh nghiệp riêng)

Giống **P0026 → P0005**, nhưng **không dùng** `crm.infi.io.vn` (Infi shared).

| Layer | SSOT | TOC instance |
|-------|------|--------------|
| CRM code | `P0005-CRM` | Deploy riêng (Vercel project + Supabase TOC) |
| CRM data | Supabase tenant TOC | `TOC_SUPABASE_*` env |
| Portal shell | `P0014` `/crm/*` | Sidebar + iframe `?embed=1&hostCode=P0014` |
| Landing orders | `api/landing-order.mjs` | Insert vào TOC Supabase |

**Không fork** screen CRM vào P0014 — sửa UI/logic ở P0005, embed qua iframe.

## Deploy checklist (TOC CRM)

1. Tạo Supabase project TOC (schema từ P0005 `SQL_Setup.sql`)
2. Deploy **P0005-CRM** as second Vercel project:
   - Env: `HUB_SUPABASE_URL`, `HUB_SUPABASE_ANON_KEY`, … → TOC values
   - Domain: `toc-crm.infi.io.vn` **hoặc** cùng repo với path base `/crm` (phase 2)
3. P0014 Vercel env: `VITE_TOC_CRM_ORIGIN=https://toc-crm.infi.io.vn` (hoặc `:3005` dev)
4. P0014 Vercel env: `TOC_SUPABASE_*` + `TOC_CRM_USER_ID` cho order API
5. DNS: `A toc.infi.io.vn → 76.76.21.21`

## Dev workflow

```bash
# Terminal 1 — TOC CRM (P0005 with TOC .env.local)
cd Tool/P0005-CRM && pnpm dev

# Terminal 2 — TOC portal
cd Tool/P0014-Hair-Landing-SSOT && pnpm dev
# Landing: http://127.0.0.1:3014/ldp01
# CRM:     http://127.0.0.1:3014/crm/orders
```

## Assets (proposal 1)

```bash
node scripts/mirror-landing-assets.mjs --slug ldp01
# Then point config image URLs to /products/ldp01/...
```

## vs P0026

| | P0026 Enzy | P0014 TOC |
|--|------------|-----------|
| Landing | N/A | Native `/ldp01` |
| CRM source | `crm.infi.io.vn` | TOC P0005 deploy |
| Auth | P0020 NotesAuthGate | P0005 auth on CRM iframe |
| Pattern | iframe prod | iframe prod (same) |
