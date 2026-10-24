# P0008 Landing Platform

One static-site engine for every product landing + step-by-step guide.

- **Admin:** https://ldp.infi.io.vn — read-only Hub-UI app: Templates · Sections (live engine previews) · Sites · System (`/?screen=…`)
- **Sites:** `sites/<id>/` — first site `videolab` → https://videolab.infi.io.vn/intro/ (P0010 Video Lab)
- **Template:** `templates/product-guide/` — hero, pipeline, features bento, pinned guided tour (all steps in a horizontal strip), video with VI subtitles + chapters, FAQ, download; VI/EN with IP-based default language, ⌘K search, section rail.

```bash
pnpm install --ignore-workspace
node engine/dev-site.mjs --site videolab
pnpm dev                                   # admin → http://127.0.0.1:3008
node scripts/build-home.mjs                # catalog.json + /preview/ + admin → dist/
node scripts/new-site.mjs --id sync --name "Folder Sync" --product P0009 --origin https://sync.infi.io.vn
node scripts/audit-sites.mjs
```

Rules for agents: [AGENTS.md](AGENTS.md). SSOT: [docs/LANDING-PLATFORM-SSOT.md](docs/LANDING-PLATFORM-SSOT.md).
