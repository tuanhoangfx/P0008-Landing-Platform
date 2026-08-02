# TOC deploy env (staging hub plane until dedicated toc-crm Supabase)

P0014 order API + CRM iframe can use **hub-api.infi.io.vn** as interim TOC tenant.

| Vercel key | Source (.env.shared) |
|------------|----------------------|
| `TOC_SUPABASE_URL` | `HUB_SUPABASE_URL` → `https://hub-api.infi.io.vn` |
| `TOC_SUPABASE_SERVICE_ROLE` | `HUB_SUPABASE_SERVICE_ROLE` |
| `TOC_CRM_USER_ID` | Run `node scripts/resolve-toc-crm-user.mjs` (hub auth admin) |
| `VITE_TOC_CRM_ORIGIN` | `https://toc-crm.infi.io.vn` (P0005 tenant deploy) |
| `VITE_TOC_CRM_GATE_PIN` | Shop-owner PIN for `/crm` gate |

Resolve user id:

```bash
node scripts/resolve-toc-crm-user.mjs
```

Verify order API after deploy:

```bash
curl -X POST https://toc.infi.io.vn/api/landing-order \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","phone":"0900000000","address":"HCM","tier":"1-clip","color":"den","productSlug":"ldp01","total":249000}'
```

Dedicated `toc-crm` Supabase: see `TOC-SUPABASE-SETUP.md`.
