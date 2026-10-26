# Changelog

## 2026-10-26 - Capture script P0006-Video-Lab ffmpeg path sync

- Version: `2.1.3`
- Timestamp: 2026-10-26 19:06 (UTC+7)
- Type: Patch
- Status: Verified

### Changes

- Updated sites/sync/capture/capture.mjs to resolve ffmpeg from P0006-Video-Lab/worker/bin.

### Verification

- hub-ui-boot-check

---
## 2026-10-26 - Fix P0006-Video-Lab FFmpeg path in media.mjs + AppErrorBoundary deploy

- Version: `2.1.2`
- Timestamp: 2026-10-26 18:43 (UTC+7)
- Type: Patch
- Status: Verified

### Changes

- Update engine/recorder/media.mjs FFmpeg path from P0010-Video-Lab to P0006-Video-Lab so build-home succeeds

### Verification

- node scripts/build-home.mjs

---
## 2026-10-26 - AppErrorBoundary + checkAndReloadIfBundleSkewed

- Version: `2.1.1`
- Timestamp: 2026-10-26 18:32 (UTC+7)
- Type: Patch
- Status: Verified

### Changes

- Wrap P0008 root in AppErrorBoundary with checkAndReloadIfBundleSkewed on uncaught render crash

### Verification

- node Tool/scripts/hub-ui-boot-check.mjs --code P0008

---
## 2026-10-24 - Hub-UI admin for ldp.infi.io.vn

- Version: `2.1.0`
- Type: Minor
- Timestamp: 2026-10-24T02:37:18.113Z
- Status: Verified

### Changes

- ldp.infi.io.vn is now a read-only Hub-UI management app (P0022/P0024 shell SSOT): sidebar, tab header with Session + version chip + Notify · Log · Settings, workspace footer, boot orb, display prefs.
- Screens Templates · Sections · Sites as split directories (FilterBar, KPI, table/cards, right rail); Sections rail shows the live engine preview; Templates rail shows the page → section chain; Sites rail shows og image + language URLs.
- System screen: shared HubSystemParamsScreen + Platform section + empty Design Template.
- engine/catalog.mjs writes dist/catalog.json (derived from the files) instead of a hand-styled HTML page; preview sample = the most complete site on the template.
- scripts/build-home.mjs builds catalog → release notes → admin into one dist/ with the app-version meta.

## 2026-10-24 - Landing Platform v2

- Version: `2.0.0`
- Type: Major
- Status: Verified

### Changes

- Replaced the v1 React COD landing + admin (removed; backup `Tool/.trash/P0008-Landing-Platform-2026-10-24.tgz`) with a static multi-site engine.
- Engine extracted from the P0010 Video Lab site: build-time rendering, guided tour, section rail, ⌘K search, VI/EN with Cloudflare-trace default language, screencast tutorial recorder.
- Template `product-guide`: one HTML per page for every language; product copy in `content/landing.json`.
- First site `videolab` (P0010-SITE → videolab.infi.io.vn/intro/); ldp.infi.io.vn now lists all sites.
- Gate `scripts/audit-sites.mjs`; scaffold `scripts/new-site.mjs`.
