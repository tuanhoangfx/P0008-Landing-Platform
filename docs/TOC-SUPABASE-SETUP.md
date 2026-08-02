# TOC Supabase setup (separate CRM tenant)

Separate business data for `toc.infi.io.vn` — **not** shared with `crm.infi.io.vn`.

## Steps

1. Create Supabase project `toc-crm` (org: Infi / TOC brand).
2. Run schema from `Tool/P0005-CRM/SQL_Setup.sql` (same tables: `order_desk_customers`, `order_desk_orders`, …).
3. Copy anon + service role keys to:
   - **P0014 Vercel:** `TOC_SUPABASE_URL`, `TOC_SUPABASE_SERVICE_ROLE`, `TOC_CRM_USER_ID`
   - **TOC P0005 deploy:** `HUB_SUPABASE_URL`, `HUB_SUPABASE_ANON_KEY`, `HUB_SUPABASE_SERVICE_ROLE`
4. Create auth user for shop owner → set `TOC_CRM_USER_ID` = that user's UUID.
5. Deploy P0005 as second Vercel project (TOC env) → set `VITE_TOC_CRM_ORIGIN` on P0014.

## RLS note

Landing order API uses **service role** server-side only (`api/landing-order.mjs`). Do not expose service role to browser.

## Verify

```bash
curl -X POST https://toc.infi.io.vn/api/landing-order \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","phone":"0900000000","address":"HCM","tier":"1-clip","color":"den","productSlug":"ldp01","total":249000}'
```

Order should appear in TOC CRM `/crm/orders`.
