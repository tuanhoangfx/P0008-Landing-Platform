# Changelog

## 2026-11-03 - Canonicalize site.config.json origin to *.infi28.com and sync Stealth v9.2.144 release

- Version: `2.1.22`
- Timestamp: 2026-11-03 17:01 (UTC+7)
- Type: Patch
- Status: Verified

### Changes

- Updated all P0008 site.config.json origin URLs to canonical *.infi28.com and synced stealth v9.2.144 release metadata.

### Verification

- node Tool/scripts/verify-deploy-ssot.mjs

---
## 2026-11-03 - Link @tool-workspace/hub-identity via workspace:* canonical junction

- Version: `2.1.21`
- Timestamp: 2026-11-03 05:39 (UTC+7)
- Type: Patch
- Status: Verified

### Changes

- Switched @tool-workspace/hub-identity from file: copy to workspace:@dev/hub-identity@* canonical symlink/junction.

### Verification

- node Tool/scripts/refresh-hub-ui-node-link.cjs --code P0008 + pnpm --dir Tool/P0008-Landing-Platform run typecheck

---
## 2026-11-03 - Link @tool-workspace/hub-ui via workspace:* canonical junction

- Version: `2.1.20`
- Timestamp: 2026-11-03 04:42 (UTC+7)
- Type: Patch
- Status: Verified

### Changes

- Switched @tool-workspace/hub-ui from physical .pnpm file: copy to workspace:* canonical symlink/junction (15/15 Hub-UI SSOT).

### Verification

- node Tool/scripts/refresh-hub-ui-node-link.cjs + pnpm --dir Tool/P0008-Landing-Platform run typecheck

---
## 2026-11-03 - Standardize Section directory cell typography & sync Vietnamese Inter SSOT

- Version: `2.1.19`
- Timestamp: 2026-11-03 04:21 (UTC+7)
- Type: Patch
- Status: Verified

### Changes

- Removed font-mono override on section-directory-cells.tsx blocks column and synced self-hosted Inter vietnamese + latin-ext woff2 assets.

### Verification

- node Tool/scripts/hub-ui-body-font-weight-check.mjs --code P0008

---
## 2026-11-02 - Filter ElevenLabs TTS Pool to Free Accounts Only

- Version: `2.1.18`
- Timestamp: 2026-11-02 02:37 (UTC+7)
- Type: Patch
- Status: Verified

### Changes

- Updated getElevenLabsPoolKeys in engine/recorder/media.mjs to strictly filter for tier=free and allow_ecosystem_pool!=false.

### Verification

- node --check Tool/P0008-Landing-Platform/engine/recorder/media.mjs

---
## 2026-10-31 - Declarative Micro-Guide CLI & ElevenLabs Pool TTS Integration

- Version: `2.1.17`
- Timestamp: 2026-10-31 02:26 (UTC+7)
- Type: Patch
- Status: Verified

### Changes

- Added ttsElevenLabs (backed by P0006/P0020 796-key pool with automatic failover and silence trimming) to engine/recorder/media.mjs and built scripts/build-micro-guide.mjs + specs/claude-org-id.guide.json to record real authenticated web apps via headless Stealth and mux multi-voice 15s micro-guides with P0001 sidechain BGM and UI click SFX.

### Verification

- node Tool/P0008-Landing-Platform/scripts/audit-sites.mjs

---
## 2026-10-30 - Recorder BGM sidechain ducking, click SFX & burned-in subtitles

- Version: `2.1.16`
- Timestamp: 2026-10-30 19:08 (UTC+7)
- Type: Patch
- Status: Verified

### Changes

- Added P0001 landing BGM asset (bgm-p0001.mp3), mixVideoWithBgmAndClicks with sidechain ducking and tactile UI click SFX in media.mjs, and bilingual burned-in subtitle bar ctx.sub(on, { text, en }) in overlay.mjs.

### Verification

- node Tool/P0008-Landing-Platform/scripts/audit-sites.mjs

---
## 2026-10-30 - Strict 2-row Mobile FilterBar SSOT (default 2 primary filters + Row 1 Search/Toolbar nowrap)

- Version: `2.1.15`
- Timestamp: 2026-10-30 06:09 (UTC+7)
- Type: Patch
- Status: Verified

### Changes

- Keep Search and Toolbar on Row 1 on mobile and cap default unselected Row 2 filters to 2.

### Verification

- node Tool/scripts/smoke-hub-mobile-ui.mjs --code P0008 --scenario filterbar --json

---
## 2026-10-29 - Mobile FilterBar 2-row searchbar + distinct semantic filter icons

- Version: `2.1.14`
- Timestamp: 2026-10-29 22:23 (UTC+7)
- Type: Patch
- Status: Verified

### Changes

- Sync Hub-UI mobile FilterBar 2-row search + Display icon row, hidden tab header meta, and distinct semantic filter trigger icons.

### Verification

- smoke-hub-mobile-ui P0008 filterbar

---
## 2026-10-29 - Mobile Filter & Display popover viewport clamping

- Version: `2.1.13`
- Timestamp: 2026-10-29 17:18 (UTC+7)
- Type: Patch
- Status: Verified

### Changes

- Adopt @infi/hub-ui mobile popover clamping and flip-above positioning for 320x568 devices

### Verification

- node Tool/scripts/node-run.mjs Tool/scripts/smoke-hub-mobile-ui.mjs --code P0008 --scenario table-filter-popover --viewport 320x568

---
## 2026-10-29 - AppErrorBoundary HMR & popstate auto-recovery

- Version: `2.1.12`
- Timestamp: 2026-10-29 01:46 (UTC+7)
- Type: Patch
- Status: Verified

### Changes

- Added vite:afterUpdate, popstate, 800ms DEV auto-retry, Retry button, and recordHubCaughtBoundaryError telemetry to AppErrorBoundary.

### Verification

- vitest 15/15 PASS + verify-agent-docs-skills-ssot PASS

---
## 2026-10-29 - Capture real 2x WebP screenshots and deploy P0003-SITE & P0009-SITE to Lenovo

- Version: `2.1.11`
- Timestamp: 2026-10-29 01:02 (UTC+7)
- Type: Patch
- Status: Verified

### Changes

- Added capture.mjs and full VI/EN content for stealth (P0003-SITE) and livestream (P0009-SITE), provisioned Cloudflare Tunnel & Nginx, and deployed all sites.

### Verification

- node Tool/P0008-Landing-Platform/scripts/audit-sites.mjs

---
## 2026-10-29 - Add stealth (P0003-SITE) and livestream (P0009-SITE) landing sites

- Version: `2.1.10`
- Timestamp: 2026-10-29 00:24 (UTC+7)
- Type: Patch
- Status: Verified

### Changes

- Scaffolded and configured sites/stealth (stealth.infi.io.vn) and sites/livestream (livestream.infi.io.vn) on P0008 Landing Platform with GitHub Release installer + SHA-256 sync.

### Verification

- audit-sites.mjs + build-all.mjs PASS (4 sites)

---
## 2026-10-29 - Sync manifest release asset & SHA-256 into P0008 landing sites

- Version: `2.1.9`
- Timestamp: 2026-10-29 00:15 (UTC+7)
- Type: Patch
- Status: Verified

### Changes

- Updated engine/site.mjs and sections/download-hero/section.html to read release.latestPublished.asset (downloadUrl, size, sha256, feedUrl) from tool.manifest.json and render SHA-256 verification badge on download pages.

### Verification

- build-site.mjs --site sync & --site videolab PASS

---
## 2026-10-28 - Standardize LdpSidebar onto HubSidebarNavList SSOT

- Version: `2.1.8`
- Timestamp: 2026-10-28 21:09 (UTC+7)
- Type: Patch
- Status: Verified
- Release: https://github.com/tuanhoangfx/P0008-Landing-Platform/releases/tag/v2.1.8

### Changes

- Migrated LdpSidebar from manual NAV_ITEMS.map to shared HubSidebarNavList + NAV_STRUCTURE

### Verification

- node Tool/scripts/smoke-hub-sidebar-subnav.mjs --static-only

---
## 2026-10-27 - Upgrade P0006 Video Lab landing page (Studio Loop FX, Reup, Smart Cut, Mixer, Encode, v6.1.84)

- Version: `2.1.7`
- Timestamp: 2026-10-27 19:53 (UTC+7)
- Type: Patch
- Status: Verified

### Changes

- Upgrade sites/videolab to cover all 6 workspaces (Studio with 20-minute Loop FX & Ping-Pong motion, Reup AI downloader/transforms, Smart Cut 1-to-N, Mixer, Encode, System) with 19 steps, 7 chapters, 9 features, 6 FAQs, and real 3840x2160 WebP screenshots.

### Verification

- node scripts/audit-sites.mjs + node scripts/build-all.mjs

---
## 2026-10-27 - Google OAuth Privacy Policy & Terms of Service pages + footer links on sync site

- Version: `2.1.6`
- Timestamp: 2026-10-27 14:42 (UTC+7)
- Type: Patch
- Status: Verified

### Changes

- Add Privacy Policy (/intro/privacy/) and Terms of Service (/intro/terms/) pages with Google API Services User Data Policy Limited Use disclosure on sites/sync, and wire conditional legal footer links in engine/render.mjs.

### Verification

- node Tool/P0008-Landing-Platform/engine/build-site.mjs --site sync && curl -sI https://sync.infi.io.vn/intro/privacy/

---
## 2026-10-26 - Recapture P0001 Desk Console 2x WebP shots, 7-chapter tutorial video & Clips/Runners guide expansion

- Version: `2.1.5`
- Timestamp: 2026-10-26 20:02 (UTC+7)
- Type: Patch
- Status: Verified

### Changes

- Updated sites/sync/capture/capture.mjs for unified P0001 Desk Console (:6010), recaptured 15 @2x WebP screenshots + og.png via Stealth headless pool, generated new 7-chapter tutorial.mp4 + VI/EN/Chapters VTTs, expanded chapters/steps/landing with Clips (Ctrl+Shift+Q) and Runners & PC Optimizer, and added sync-product-landing-site.mjs to auto-sync landing releases

### Verification

- node Tool/P0008-Landing-Platform/scripts/audit-sites.mjs && node Tool/P0008-Landing-Platform/scripts/build-all.mjs

---
## 2026-10-26 - Sync P0001 Desk Console (Folder Sync) & P0006 Video Lab landing sites and GitHub release auth

- Version: `2.1.4`
- Timestamp: 2026-10-26 19:28 (UTC+7)
- Type: Patch
- Status: Verified

### Changes

- Updated sites/sync to P0001 (P0001-INTRO, tuanhoangfx/Desk-Console, Desk-Console-Setup.exe copy) and sites/videolab to P0006 (P0006-SITE), added GH token auth to engine/site.mjs latestRelease, and scoped localStorage release cache by repo in engine/client/motion.js.

### Verification

- audit-sites.mjs + verify-deploy-ssot.mjs + deploy-lenovo-static.mjs --code P0001-INTRO

---
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
