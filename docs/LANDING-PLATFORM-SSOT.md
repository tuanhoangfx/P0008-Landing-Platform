# Landing Platform SSOT (P0008 v2, 2026-10-24)

**One renderer for every product landing + guide.** A landing is content in
`Tool/P0008-Landing-Platform/sites/<id>/`; the engine, templates, hosting lane and gate are shared.

## Why

Before v2 the workspace had three unrelated landing stacks: P0008 v1 (React COD SPA), P0009
(landing inside the app), P0010 (static site). Each had its own build, i18n, deploy and bugs.
v2 keeps the most complete one (P0010's) as the engine and makes every other landing a site.

## Pieces

| Concern | SSOT |
|---|---|
| Rendering (blocks, tokens, i18n, base path, cache-busting) | `engine/render.mjs` |
| Motion, tour, rail, ⌘K, language menu | `engine/client/` |
| Site → Vite config, template materialisation | `engine/site.mjs` |
| Page structure | `templates/<template>/pages/` (one file per page, all languages) |
| Product copy | `sites/<id>/content/landing.json` (+ chapters/steps/features/faq.json) |
| Product facts | `sites/<id>/site.config.json` (schema `engine/site.schema.json`) |
| Hosting | `<CODE>-SITE` in `Tool/scripts/lib/lenovo-spa-products.mjs` (`companionOf`, `staticSite`) + product manifest `site{}`; mounted sites `<CODE>-INTRO` + `mountPath` (below) |
| Screenshots / tutorial video | `sites/<id>/capture/` (product scenes) + `engine/recorder/` (shared) |
| Gate | `scripts/audit-sites.mjs` |

## Add a site

```bash
node Tool/P0008-Landing-Platform/scripts/new-site.mjs --id <id> --name "<Product>" --product P00xx --origin https://<host>
# fill content, capture shots (P0003 pool), then follow the printed hosting steps
node Tool/P0008-Landing-Platform/scripts/audit-sites.mjs
```

## Conventions

- URL: `https://<tool>.infi.io.vn/intro/` (domain root is reserved for the tool's admin/app); first language at `/intro/`, others at `/intro/<lang>/`.
- Default language: explicit choice (dropdown) > first-visit Cloudflare `/cdn-cgi/trace` country (VN → vi, else en) > page language. Crawlers never redirected; `hreflang` on every page.
- nginx `staticSite` block: real 404, `/(<base>/)?(shots|video)/` cached a day (URLs carry `?v=` fingerprints), HTML `no-cache`.
- Media: shots 1920×1080 @2x via CDP `Page.captureScreenshot`; tutorial MP4 1080p30 H.264 + subtitles per language (`tutorial.<lang>.vtt`, the page language's track is the default) + chapters VTT.

## Mounted sites (`mountPath`) — the domain root is the product's own app

When `<tool>.infi.io.vn/` already serves the product's web app (its own registry entry), the site
does not get a domain of its own: it is **mounted** under `/intro/` of that domain.

| Piece | Mounted site (P0009: `sites/sync` on `sync.infi.io.vn/intro/`) |
|---|---|
| Scaffold | `new-site.mjs … --mount` → key `<CODE>-INTRO`, `site.config.json` `"mounted": true` |
| Registry | `<CODE>-INTRO`: same `domain` as the app entry, `mountPath: "/intro/"`, own `dir` / `remoteDist` / `nginxRoot`, `staticSite: true` |
| nginx | `buildNginxSpaHosts` emits `location ^~ /intro/ { alias <nginxRoot>/intro/; … }` (+ nested `assets` / `shots` / `video` cache rules, `no-cache` HTML, `try_files $uri $uri/index.html $uri/ =404`, `error_page 404 /intro/404.html`) **inside the app entry's server block** — never a second `server_name`. The app entry may add `pathRedirects` (301s for paths that moved, e.g. P0009 `/guide` → `/intro/guide/`) |
| Build | identical; `mounted` also ships `sitemap.xml` inside `/intro/` (root files are the app's) |
| Tunnel / DNS | owned by the app entry — `upsert-lenovo-tunnel-host.mjs` is a no-op for a mounted key |
| Volumes | `sync-lenovo-origin-compose-volumes.mjs --apply --recreate-nginx` (new bind mount) |
| Deploy verify | `deploy-lenovo-static.mjs --code <CODE>-INTRO` probes `https://<domain><mountPath>` |
| Gates | `verify-deploy-ssot`: one root entry per domain, mounts unique; `verify-deploy-pipeline-fast`: `urls.site` must include `<domain><mountPath>`; `audit-sites`: `mounted` ⇔ `mountPath === base` and the domain has a root owner |

## Migration debt

- ~~P0009 Folder Sync: in-app landing (`src/features/landing`)~~ — **done 2026-10-24**: content, recaptured shots and the tutorial live in `sites/sync` (`P0009-INTRO`, mounted at `sync.infi.io.vn/intro/`); `P0009-SITE` keeps building the app at the domain root and 301s `/guide`, `/landing` to `/intro/`. P0009 v0.4.90 has no landing code.
- `:8808` landing-order sidecar (task `P0008LandingOrder` on Lenovo) retired 2026-10-24 with the P0014 `/ldp01` landing — task, process and bundle removed.
