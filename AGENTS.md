# P0008 Landing Platform — agent rules

One engine renders every product landing + step-by-step guide. A product landing is **content**
in `sites/<id>/`, never a new app. Live: `https://ldp.infi.io.vn` (index of all sites).

## Layout

| Path | What | Who edits |
|---|---|---|
| `engine/render.mjs` | Build-time HTML: blocks (`<!--@story-->`, `<!--@features-->` …), tokens (`{{c.*}}` from landing.json), i18n, `withBase` | engine changes only |
| `engine/client/` | Browser JS/CSS: motion (Lenis + GSAP), tour, section rail, ⌘K search, language menu | engine changes only |
| `engine/site.mjs` | site folder → Vite config (template + overrides → `.pages/` per language) | engine changes only |
| `engine/build-site.mjs` / `dev-site.mjs` | build / preview one site | — |
| `engine/recorder/` | screencast → MP4, edge-tts narration, drawn cursor (shared by every site's recorder) | engine changes only |
| `templates/product-guide/pages/` | one HTML per page, serves every language (`{{l}}` link prefix, `{{c.*}}` copy) | template changes only |
| `sites/<id>/site.config.json` | name, product, registryKey, origin, base, langs, releases repo, product sentences | per site |
| `sites/<id>/content/*.json` | chapters, steps, features, faq, landing (hero/stats/pipeline/CTA/download copy), narration | per site |
| `sites/<id>/public/` | favicon, og.png, `shots/*.webp` (2x), `video/*` (generated, gitignored mp4) | per site |
| `sites/<id>/capture/` | product-specific P0003 capture + tutorial recorder (scenes drive the real app) | per site |
| `sites/<id>/pages/` | optional page overrides (same relative path as the template) — avoid; prefer engine blocks | rare |

## Laws

1. **New landing = `node scripts/new-site.mjs`**, then content. Never hand-roll a landing inside a product (`Tool/P00xx/site`, `src/features/landing`) — `scripts/audit-sites.mjs` fails `staticSite` hosting outside `sites/` and warns on product-local landings.
2. **Hosting key per site:** `<CODE>-SITE` in `Tool/scripts/lib/lenovo-spa-products.mjs` with `companionOf`, `staticSite: true`, `productRoot: Tool/P0008-Landing-Platform/sites/<id>`, `build: ["node","../../engine/build-site.mjs","--site","<id>"]`. The product manifest carries `site { platform: "P0008", siteId, registryKey }` + `urls.site`. `Deploy P00xx` keeps meaning the product itself. When the domain root is the product's own web app, mount the site instead: `new-site.mjs --mount` → `<CODE>-INTRO` with `mountPath: "/intro/"` (see SSOT § Mounted sites; P0009 `sites/sync`).
3. **Copy lives in content, never in templates.** Every `{{c.*}}` token must resolve for every language — `audit-sites` dry-renders all pages × languages.
4. **Browser automation (capture/record/visual checks) = P0003 agent pool, headless** (`Tool/scripts/lib/stealth-playwright-page.mjs`), own `STEALTH_AGENT_KEY` per run. Never system Chrome or Playwright's bundled Chromium.
5. **FFmpeg = the one copy** in `Tool/P0010-Video-Lab/worker/bin` (`VIDEO_LAB_FFMPEG` overrides). edge-tts ≥ 7.3.1.
6. package.json scripts run under PowerShell 5.1 (`.npmrc script-shell`): no `&&`, call bins as `node node_modules/...`.
7. Patch scripts: never `String.replace(str, replacementWithDollarSigns)` — `$$` collapses to `$`. Use `split/join` or the Edit tool.

## Admin app (ldp.infi.io.vn, v2.1.0)

ldp.infi.io.vn is a **read-only Hub-UI management app** for the library — same shell SSOT as P0022/P0024
(HubSidebarShell · HubListChromeHeader with Session + version chip + Notify · Log · Settings · workspace footer ·
boot orb · Hub tokens/typography · display prefs · HubDirectoryTableShell directories).

| Path | What |
|---|---|
| `index.html` · `vite.config.ts` · `src/` | the admin (alias tool: `@tool-workspace/hub-*` → `E:/Dev/packages/*`, no `vendor/`). Own lockfile — install with `pnpm add --ignore-workspace …` |
| `src/features/{templates,sections,sites}/` | split directories (`components/LdpDirectoryScreen.tsx` = P0024 Places golden: FilterBar row-1/2 · KPI · table/cards + right rail) |
| `src/features/system/` | `HubSystemParamsScreen` + Platform section + empty Design Template |
| `engine/catalog.mjs` | renders each section alone under `dist/preview/**` and writes `dist/catalog.json` (templates → pages → sections, section meta/group/blocks/tokens/usedIn/previewUrl, sites with config/steps/langs/urls). Derived from the files — never hand-list |
| `scripts/build-home.mjs` | registry build for `P0008`: catalog → `prebuild-lenovo-metadata` (release-notes.json) → Vite build into the same `dist/` (`emptyOutDir: false`) |

- **Routes are query strings** (`/?screen=templates|sections|sites|system&id=<row>`) so the nginx `staticSite` block
  (`try_files $uri $uri/index.html $uri/ =404`) serves every screen from `/index.html` — no SPA fallback needed.
- **Auth:** none — public read-only catalog, tier *exempt* in `_cards/hub-login-auth.md` (same as P0022/P0024). No writes, no data plane.
- **Read-only bulk rail:** Select · Detail · More (open preview / open site). No New / Delete — library rows are files in this repo.
- **Dev:** `pnpm dev` → http://127.0.0.1:3008 (predev runs `engine/catalog.mjs`; dev middleware serves `/catalog.json` + `/preview/` from `dist/`).
- **Gate:** `node Tool/scripts/gate.mjs --code P0008 --stage post` (lint = audit-sites, typecheck = admin) + `node Tool/scripts/hub-ui-preflight.mjs --code P0008`.

## Commands

```bash
node engine/dev-site.mjs --site videolab          # preview http://127.0.0.1:3108/intro/
node engine/build-site.mjs --site videolab        # → sites/videolab/dist
node scripts/build-all.mjs                         # every site + ldp admin (build-home)
pnpm dev                                           # admin http://127.0.0.1:3008/?screen=sections
node scripts/audit-sites.mjs                       # SSOT gate
node Tool/scripts/deploy-lenovo-static.mjs --code P0010-SITE   # (from E:\Dev) one site
node Tool/scripts/deploy-lenovo-static.mjs --code P0008        # ldp.infi.io.vn admin
```

History: v1 (React COD landing + admin, `/001`) was removed 2026-10-24 — backup `Tool/.trash/P0008-Landing-Platform-2026-10-24.tgz`. The `:8808` landing-order sidecar (`P0008LandingOrder`) was retired the same day together with the P0014 `/ldp01` landing.
