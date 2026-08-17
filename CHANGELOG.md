# Changelog

## 2026-08-18 - Patch bump for completed agent task

- Version: `0.2.2`
- Timestamp: 2026-08-18 02:37 (UTC+7)
- Type: Patch
- Status: Verified
- Release: https://ldp.infi.io.vn

### Changes

- Automatic patch bump after completed P0008 task.

### Verification

- pending

---
## 2026-08-15 - P0008 Git backup

- Version: `0.2.1`
- Timestamp: 2026-08-15 21:52 (UTC+7)
- Type: Patch
- Status: Verified
- Release: https://ldp.infi.io.vn

### Changes

- Git/Commit Minor bump (P0008): 0.1.5 → 0.2.1 (MINOR+1, PATCH=1).

### Verification

- pending

---
# Changelog — P0008 Landing Platform

## 2026-08-03 — Overview TOC + TabScreenChrome HubTabScreenBody SSOT

- Version: `0.1.5`
- Timestamp: 2026-08-03 15:13 (UTC+7)
- Type: Patch
- Status: Committed

### Changes

- Overview: `OverviewTocNav` + document-toc grid (P0024 golden); `TabScreenChrome` wraps `HubTabScreenBody`.
- Shell CSS: `p0008-hub-shell.css` (chrome bleed SSOT); class `p0008-hub-app` / `p0008-hub-main`.
- Tooling: `hub-shell.css.tpl`, `restore-p0008-admin-shell.mjs`, `Fix P0008 theo P0020` in fix-hub-shell.

---

## 2026-08-03 — Re-clone admin shell P0020 SSOT

- Version: `0.1.4`
- Type: Patch
- Status: Verified

### Changes

- Force re-scaffold: `sync-hub-shell P0008 --force --with-tab-header`; restore pages/templates nav + dual-zone routes.
- Shell parity P0024: `hubMainShellClassFromManifest`, chrome-bleed CSS (`p0008-landing-hub-shell.css`), `p0008-ui-shell.ts`.
- Overview: `HubTabScreenBody` + grid layout SSOT; sidebar DisplayPrefs + identity restored.

### Verification

- `node scripts/build.mjs` — pass
- `hub-ui-preflight --code P0008` — pass
- Stealth CDP `/`, `/pages`, `/templates` — pass

---

## 2026-08-03 — Directory table body-only SSOT + row smoke

- Version: `0.1.3`
- Type: Patch
- Status: Verified

### Changes

- Fix empty tbody on Pages/Templates: remove split-pane `wrapClassName` on body-only `HubDirectoryTableShell`.
- Fix Pages tab crash: unique `colClass` per column in `page-column-meta.ts` (duplicate `hub-users-col--meta`).
- Gates: `verify-directory-body-only-wrap.mjs` + preflight step; CDP row assert on `/pages` and `/templates` smoke.

### Verification

- `verify-directory-body-only-wrap --code P0008` — pass
- `hub-ui-preflight --code P0008` — pass
- Stealth shell-only `/templates` CDP rows — pass

---

## 2026-08-03 — Hub SSOT gate + re-scaffold admin

- Version: `0.1.2`
- Type: Patch
- Status: Verified

### Changes

- SSOT pipeline: P0008 auto-registered in hub-ui-preflight/parity/css/gates via `uiShell.golden` manifest.
- Re-scaffold admin shell (`sync-hub-shell --force`); directory search SSOT hooks; version meta from hub-ui.
- Playbook: `Tool/docs/playbooks/hub-dual-zone-landing.md`.

### Verification

- `node scripts/build.mjs` — pass
- `hub-ui-preflight --code P0008` — pass
- Stealth shell-only profile 9990 — pass

---

## 2026-08-03 — Hub-UI admin shell (P0020 golden)

- Version: `0.1.1`
- Timestamp: 2026-08-03 02:12 (UTC+7)
- Type: Minor
- Status: Ready

### Changes

- Admin console migrated to Hub-UI SSOT (P0020 golden): sidebar, hub header, footer, main chrome.
- Pages + Templates tabs use `HubDirectoryScreen` + `HubDirectoryTableShell` directory tables.
- Overview tab uses `HubTabChrome` + `HubTabScreenBody`.
- Public landing `/001` unchanged (isolated CSS, no hub theme bleed).

### Verification

- `node scripts/build.mjs` — pass
- Stealth pool 9990: `/`, `/pages`, `/001` — pass
- `agent-verify-gate --code P0008` — pass (light profile)

---

- Version: 0.1.0 — Initial Landing Platform: admin at `/`, public Mie Hair landing at `/001`, template `mie-hair-cod-v1` migrated from P0014. Domain target: `ldp.infi.io.vn`.
