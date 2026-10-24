#!/usr/bin/env node
/**
 * Capture the Folder Sync (P0009) guide screenshots from the REAL running app in a P0003 Stealth
 * agent-pool profile (headless). Read-only: it only navigates, opens/closes modals and dropdowns,
 * toggles UI filters — it never starts/stops/creates/deletes jobs, signs drives in/out or saves.
 *
 * Preconditions (start from E:\Dev\Tool\P0009-Folder-Sync, NOT `pnpm dev` — its predev runs a gate):
 *   node host/server.mjs                                              # host API :6009
 *   (optional) node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 3009  # dev UI, --base http://127.0.0.1:3009
 *   The default base is the host-served production bundle (dist/) on :6009 — build it first if stale.
 *   P0003 Stealth console on :6003
 *
 * Usage:
 *   node sites/sync/capture/capture.mjs [--base http://127.0.0.1:6009] [--only id1,id2]
 *                                       [--from <sceneId>] [--dpr 2] [--keep-png] [--no-mask-names]
 *
 * Outputs:
 *   sites/sync/public/shots/<id>.webp   WebP q88, 3840×2160 (1920×1080 CSS @2x)
 *   sites/sync/public/og.png            1200×630 crop of jobs-overview
 *   sites/sync/capture/highlights.json  { "<id>": {x,y,w,h} } in % of the 1920×1080 viewport
 *   sites/sync/.capture-tmp/            scratch PNGs (+ preview JPGs with --keep-png)
 *
 * Privacy: every visible e-mail is replaced by driveN@gmail.com (N = order of the GG code) and,
 * unless --no-mask-names, Drive account display names by neutral labels. A MutationObserver keeps
 * the mask applied while React re-renders.
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { openStealthPlaywrightPage } from "../../../../scripts/lib/stealth-playwright-page.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.resolve(__dirname, "..");
const TMP = path.join(SITE, ".capture-tmp");
const PNG_DIR = path.join(TMP, "png");
const SHOTS = path.join(SITE, "public", "shots");
const HIGHLIGHTS = path.join(__dirname, "highlights.json");
const FFMPEG = process.env.P0009_CAPTURE_FFMPEG || "E:/Dev/Tool/P0010-Video-Lab/worker/bin/ffmpeg.exe";

const args = process.argv.slice(2);
const arg = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
// Default = the production UI bundle the host serves (dist/ on :6009). The Vite dev UI (:3009) runs
// dev-only hub-ui assertions; at v0.4.89 one of them unmounts the app when a Drive detail opens.
const BASE = arg("--base", "http://127.0.0.1:6009").replace(/\/$/, "");
const FROM = arg("--from", null);
const ONLY = arg("--only", "") ? new Set(arg("--only", "").split(",")) : null;
const DPR = Number(arg("--dpr", "2"));
const WIDTH = 1920;
const HEIGHT = 1080;
const KEEP_PNG = args.includes("--keep-png");
const MASK_NAMES = !args.includes("--no-mask-names");

process.env.STEALTH_AGENT_KEY = "p0009-guide-capture";

const t0 = Date.now();
const log = (...m) => console.log(`[capture +${((Date.now() - t0) / 1000).toFixed(1)}s]`, ...m);
for (const d of [TMP, PNG_DIR, SHOTS]) fs.mkdirSync(d, { recursive: true });

/* ------------------------------------------------------------ preconditions + mask map */
const api = async (p) => {
  const r = await fetch(`${BASE}${p}`);
  if (!r.ok) throw new Error(`${p} → ${r.status}`);
  return r.json();
};
const health = await api("/api/health").catch((e) => {
  throw new Error(`P0009 UI/host not reachable via ${BASE} (${e.message}) — start host + vite first`);
});
log(`host ${health.name} ok=${health.ok}`);
const accounts = (await api("/api/remotes/drive/accounts?view=identity")).accounts || [];
const NEUTRAL_NAMES = ["Personal Drive", "Studio Drive", "Work Drive", "Archive Drive", "Team Drive"];
const sortedAcc = [...accounts].sort((a, b) => String(a.code).localeCompare(String(b.code)));
const replacements = [];
sortedAcc.forEach((a, i) => {
  if (a.email) replacements.push([a.email, `drive${i + 1}@gmail.com`]);
  if (MASK_NAMES && a.displayName) replacements.push([a.displayName, NEUTRAL_NAMES[i] || `Drive ${i + 1}`]);
});
// Longest first so "Name (Suffix)" wins over "Name".
replacements.sort((a, b) => b[0].length - a[0].length);

/* ------------------------------------------------------------ browser */
const { page, close, profile } = await openStealthPlaywrightPage({ viewport: { width: WIDTH, height: HEIGHT } });
log(`stealth profile ${profile}`);
const highlights = fs.existsSync(HIGHLIGHTS) ? JSON.parse(fs.readFileSync(HIGHLIGHTS, "utf8")) : {};
const results = [];
const skipped = [];
const consoleErrors = [];
page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text().slice(0, 200)));
page.on("dialog", (d) => d.dismiss().catch(() => {}));

const CAPTURE_CSS = `
  *, *::before, *::after { caret-color: transparent !important; }
  [data-vite-dev-id] ~ vite-error-overlay, vite-error-overlay { display: none !important; }
  .hub-toast-viewport, [data-sonner-toaster], .Toastify { display: none !important; }
`;

async function applyMask() {
  await page.evaluate(
    ({ reps, css }) => {
      if (!document.getElementById("__cap_css")) {
        const s = document.createElement("style");
        s.id = "__cap_css";
        s.textContent = css;
        document.head.appendChild(s);
      }
      const emailRe = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
      const known = new Set(reps.map(([, to]) => to));
      const fix = (s) => {
        if (!s) return s;
        let out = s;
        for (const [from, to] of reps) if (out.includes(from)) out = out.split(from).join(to);
        out = out.replace(emailRe, (m) => (known.has(m) ? m : "drive@gmail.com"));
        return out;
      };
      const walk = (root) => {
        const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        let n;
        while ((n = tw.nextNode())) {
          const v = fix(n.nodeValue);
          if (v !== n.nodeValue) n.nodeValue = v;
        }
        const els = root.querySelectorAll ? root.querySelectorAll("[title],[aria-label],input,textarea") : [];
        for (const el of els) {
          for (const a of ["title", "aria-label", "placeholder"]) {
            const v = el.getAttribute(a);
            if (v && fix(v) !== v) el.setAttribute(a, fix(v));
          }
          if ("value" in el && typeof el.value === "string" && fix(el.value) !== el.value) el.value = fix(el.value);
        }
      };
      window.__capFix = fix;
      walk(document.body);
      if (!window.__capObs) {
        window.__capObs = new MutationObserver((muts) => {
          for (const m of muts) {
            if (m.type === "characterData") {
              const v = fix(m.target.nodeValue);
              if (v !== m.target.nodeValue) m.target.nodeValue = v;
            } else if (m.type === "attributes") {
              const el = m.target;
              const v = el.getAttribute(m.attributeName);
              if (v && fix(v) !== v) el.setAttribute(m.attributeName, fix(v));
            } else for (const n of m.addedNodes) {
              if (n.nodeType === 3) {
                const v = fix(n.nodeValue);
                if (v !== n.nodeValue) n.nodeValue = v;
              } else if (n.nodeType === 1) walk(n);
            }
          }
        });
        window.__capObs.observe(document.body, {
          subtree: true,
          childList: true,
          characterData: true,
          attributes: true,
          attributeFilter: ["title", "aria-label"],
        });
      }
    },
    { reps: replacements, css: CAPTURE_CSS },
  );
}

/* ------------------------------------------------------------ DOM helpers */
/** Rect of the first visible element matching css whose own trimmed text equals/contains `text`. */
async function rectOf(css, text, opts = {}) {
  return page.evaluate(
    ({ css, text, exact, within }) => {
      const scope = within ? document.querySelector(within) : document;
      if (!scope) return null;
      const els = [...scope.querySelectorAll(css)].filter((e) => {
        const r = e.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) return false;
        if (text == null) return true;
        const t = (e.innerText || e.textContent || "").trim();
        return exact ? t === text : t.includes(text);
      });
      const e = els[0];
      if (!e) return null;
      const r = e.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    },
    { css, text: text ?? null, exact: opts.exact ?? true, within: opts.within ?? null },
  );
}
/** System screen panel (section) whose header starts with title. */
async function systemSection(title) {
  return page.evaluate((title) => {
    const sec = [...document.querySelectorAll('[data-hub-screen="system"] section')].find((sx) =>
      (sx.querySelector("header")?.innerText || "").trim().startsWith(title),
    );
    if (!sec) return null;
    sec.scrollIntoView({ block: "nearest" });
    const r = sec.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  }, title);
}
/** The System tab's "Design Template" card is the design-preview scaffold (internal) — keep it out of shots. */
async function hideDesignTemplate() {
  await page.evaluate(() => {
    for (const sx of document.querySelectorAll('[data-hub-screen="system"] section')) {
      if ((sx.querySelector("header")?.innerText || "").trim().startsWith("Design Template")) sx.style.display = "none";
    }
  });
}
/** Union of all visible elements matching css. */
async function unionRect(css, skipEmpty = false) {
  return page.evaluate(({ css, skipEmpty }) => {
    const rs = [...document.querySelectorAll(css)].filter((e) => !skipEmpty || (e.innerText || "").trim()).map((e) => e.getBoundingClientRect()).filter((r) => r.width > 1 && r.height > 1);
    if (!rs.length) return null;
    const x = Math.min(...rs.map((r) => r.left)), y = Math.min(...rs.map((r) => r.top));
    return { x, y, width: Math.max(...rs.map((r) => r.right)) - x, height: Math.max(...rs.map((r) => r.bottom)) - y };
  }, { css, skipEmpty });
}
async function recoverIfCrashed() {
  const crashed = await page.evaluate(() => document.body.innerText.includes("This screen stopped rendering")).catch(() => true);
  if (!crashed) return;
  log("  ↻ app crashed — reloading");
  if (page.isClosed()) throw new Error("browser page closed — rerun");
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await waitFor(() => document.querySelectorAll("aside nav button").length > 0, null, 30000);
  await page.waitForTimeout(2500);
  await applyMask();
}
async function clickOn(css, text, opts) {
  const r = await rectOf(css, text, opts);
  if (!r) throw new Error(`not found: ${css} "${text ?? ""}"`);
  await page.mouse.click(r.x + r.width / 2, r.y + r.height / 2);
  return r;
}
async function waitFor(fn, arg, timeout = 15000) {
  await page.waitForFunction(fn, arg, { timeout, polling: 200 });
}
async function goScreen(label) {
  await clickOn("aside nav button", label);
  await waitFor((l) => localStorage.getItem("p0009:screen") === l.toLowerCase(), label);
  await page.waitForTimeout(1200);
}
async function escapeAll() {
  for (let i = 0; i < 3; i++) {
    const open = await page.evaluate(() => !!document.querySelector('[role="dialog"]'));
    if (!open) return;
    await page.keyboard.press("Escape");
    await page.waitForTimeout(400);
  }
}
/** Close dialogs via their Close/Cancel button (never Save). */
async function closeDialog() {
  const ok = await page.evaluate(() => {
    const dlg = [...document.querySelectorAll('[role="dialog"]')].pop();
    if (!dlg) return true;
    const btn = [...dlg.querySelectorAll("button")].find((b) =>
      /^(close|cancel)$/i.test((b.innerText || b.getAttribute("aria-label") || "").trim()),
    );
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  if (!ok) await page.keyboard.press("Escape");
  await page.waitForTimeout(600);
  await escapeAll();
}
async function clickRow(text, tableScope = "") {
  const ok = await page.evaluate(
    ({ text, tableScope }) => {
      const rows = [...document.querySelectorAll(`${tableScope} table tbody tr`)].filter(
        (tr) => tr.getBoundingClientRect().height > 0 && tr.innerText.includes(text),
      );
      if (!rows[0]) return false;
      rows[0].dispatchEvent(new MouseEvent("click", { bubbles: true }));
      return true;
    },
    { text, tableScope },
  );
  if (!ok) throw new Error(`row "${text}" not found`);
}
async function noSpinners(timeout = 20000) {
  await page
    .waitForFunction(
      () =>
        ![...document.querySelectorAll(".animate-spin, [aria-busy='true']")].some((e) => {
          const r = e.getBoundingClientRect();
          return r.width > 0 && r.height > 0;
        }),
      null,
      { timeout, polling: 300 },
    )
    .catch(() => log("  ⚠ spinner still visible"));
}

/* ------------------------------------------------------------ capture */
const cdp = await page.context().newCDPSession(page);
const metrics = { width: WIDTH, height: HEIGHT, deviceScaleFactor: DPR, mobile: false };
const pct = (v, total) => Math.round((v / total) * 1000) / 10;

async function shoot(id, highlightRect) {
  await applyMask();
  await page.evaluate(() => document.activeElement?.blur?.());
  await page.mouse.move(WIDTH - 2, HEIGHT - 2);
  await page.waitForTimeout(500);
  const leak = await page.evaluate(() => {
    const re = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
    return (document.body.innerText.match(re) || []).filter((m) => !/^drive\d*@gmail\.com$/.test(m));
  });
  if (leak.length) throw new Error(`unmasked e-mail visible in ${id}: ${leak.length} hit(s)`);
  const tour = await page.evaluate(() => !!document.querySelector('[aria-label="Interactive Guided Setup"]'));
  if (tour) throw new Error(`guided tour overlay visible in ${id}`);
  const shot = await cdp.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  const png = path.join(PNG_DIR, `${id}.png`);
  fs.writeFileSync(png, Buffer.from(shot.data, "base64"));
  ff(["-i", png, "-c:v", "libwebp", "-quality", "88", "-compression_level", "6", "-preset", "text", "-frames:v", "1", "-update", "1", path.join(SHOTS, `${id}.webp`)]);
  if (KEEP_PNG) ff(["-i", png, "-vf", "scale=1600:-2:flags=lanczos", "-q:v", "3", "-frames:v", "1", "-update", "1", path.join(TMP, `${id}.preview.jpg`)]);
  const b = fs.readFileSync(png);
  const dims = { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  if (highlightRect) {
    highlights[id] = {
      x: pct(Math.max(0, highlightRect.x), WIDTH),
      y: pct(Math.max(0, highlightRect.y), HEIGHT),
      w: pct(Math.min(highlightRect.width, WIDTH - Math.max(0, highlightRect.x)), WIDTH),
      h: pct(Math.min(highlightRect.height, HEIGHT - Math.max(0, highlightRect.y)), HEIGHT),
    };
  } else log(`  ⚠ no highlight for ${id}`);
  results.push({ id, ...dims });
  fs.writeFileSync(HIGHLIGHTS, JSON.stringify(highlights, null, 2) + "\n");
  log(`  ✓ shots/${id}.webp ${dims.w}×${dims.h}`);
}

const scenes = [
  {
    id: "jobs-overview",
    async run() {
      await goScreen("Jobs");
      await noSpinners();
      // Highlight: the jobs table as clipped by its scroll container (header + all rows).
      return page.evaluate(() => {
        const t = document.querySelector('[data-hub-screen="jobs"] table');
        let clip = t.parentElement;
        while (clip && getComputedStyle(clip).overflowX === "visible") clip = clip.parentElement;
        const c = clip.getBoundingClientRect();
        const rows = [t.querySelector("thead"), ...t.querySelectorAll("tbody tr")].filter((e) => e && (e.innerText || "").trim()).map((e) => e.getBoundingClientRect()).filter((r) => r.height > 1);
        const top = Math.min(...rows.map((r) => r.top)), bottom = Math.max(...rows.map((r) => r.bottom));
        return { x: c.left, y: top, width: c.width, height: bottom - top };
      });
    },
  },
  {
    id: "drives-list",
    async run() {
      await goScreen("Drives");
      await waitFor(() => document.querySelectorAll('[data-hub-screen="drives"] table tbody tr').length > 0);
      await noSpinners();
      await page.waitForTimeout(1500);
      return unionRect('[data-hub-screen="drives"] table thead, [data-hub-screen="drives"] table tbody tr', true);
    },
  },
  {
    id: "drive-detail",
    async run() {
      const first = sortedAcc[0]?.code || "GG0001";
      await clickRow(first, '[data-hub-screen="drives"]');
      await waitFor(() => !!document.querySelector('[role="dialog"]'));
      await page.waitForTimeout(2500);
      await noSpinners();
      return rectOf('[role="dialog"]');
    },
    after: closeDialog,
  },
  {
    id: "job-new",
    async run() {
      await goScreen("Jobs");
      await clickOn(".hub-bulk-action-btn", "New", { within: '[data-hub-screen="jobs"]' });
      await waitFor(() => !!document.querySelector('[role="dialog"]'));
      await page.waitForTimeout(1500);
      // Open the Mode click-filter so the modes are visible.
      await page.evaluate(() => {
        const dlg = document.querySelector('[role="dialog"]');
        const field = [...dlg.querySelectorAll(".hub-adm-inline-field")].find((f) => /Mode/.test(f.querySelector("label, .hub-adm-inline-field__label, [class*=label]")?.innerText || ""));
        field?.querySelector("button")?.click();
      });
      await page.waitForTimeout(800);
      // Highlight: the Mode trigger + its open option list.
      return page.evaluate(() => {
        const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 2 && r.height > 2; };
        const search = [...document.querySelectorAll("input")].find((i) => /search mode/i.test(i.placeholder || "") && vis(i));
        let pop = search;
        while (pop && pop.parentElement && !/Local/.test(pop.innerText || "")) pop = pop.parentElement;
        const trig = [...document.querySelectorAll('[role="dialog"] button')].find((b) => vis(b) && b.getAttribute("aria-expanded") === "true");
        const rs = [pop, trig].filter(Boolean).map((e) => e.getBoundingClientRect());
        if (!rs.length) return null;
        const x = Math.min(...rs.map((r) => r.left)), y = Math.min(...rs.map((r) => r.top));
        return { x, y, width: Math.max(...rs.map((r) => r.right)) - x, height: Math.max(...rs.map((r) => r.bottom)) - y };
      });
    },
    async after() {
      await page.keyboard.press("Escape").catch(() => {});
      await page.waitForTimeout(300);
      // Escape may have closed the whole modal — reopen for the next scene if needed.
    },
  },
  {
    id: "job-folder-pick",
    async run() {
      const open = await page.evaluate(() => !!document.querySelector('[role="dialog"]'));
      if (!open) {
        await clickOn(".hub-bulk-action-btn", "New", { within: '[data-hub-screen="jobs"]' });
        await waitFor(() => !!document.querySelector('[role="dialog"]'));
        await page.waitForTimeout(1200);
      }
      await page.evaluate(() => document.querySelector('[role="dialog"] button[aria-label="Drive"]')?.click());
      await page.waitForTimeout(2500);
      await noSpinners();
      return page.evaluate(() => {
        const trg = document.querySelector('[role="dialog"] button[aria-label="Drive"]');
        const field = trg?.closest(".hub-adm-form-row") || trg;
        const fr = field.getBoundingClientRect();
        // dropdown panel: the largest visible element positioned right under the field
        const cands = [...document.querySelectorAll("[class*=folder-pick], [class*=fs-browse], [role=tree], [role=listbox]")]
          .map((e) => e.getBoundingClientRect())
          .filter((r) => r.width > 100 && r.height > 60 && r.y >= fr.y);
        cands.sort((a, b) => b.width * b.height - a.width * a.height);
        const d = cands[0];
        if (!d) return { x: fr.x, y: fr.y, width: fr.width, height: fr.height };
        const x = Math.min(fr.x, d.x), y = Math.min(fr.y, d.y);
        return { x, y, width: Math.max(fr.right, d.right) - x, height: Math.max(fr.bottom, d.bottom) - y };
      });
    },
    after: closeDialog,
  },
  {
    id: "jobs-kpi-filter",
    async run() {
      await escapeAll();
      if ((await page.evaluate(() => localStorage.getItem("p0009:screen"))) !== "jobs") await goScreen("Jobs");
      const r = await clickOn(".hub-kpi-tile", "SYNCED", { exact: false, within: '[data-hub-screen="jobs"]' });
      await page.waitForTimeout(1200);
      return rectOf(".hub-kpi-tile", "SYNCED", { exact: false, within: '[data-hub-screen="jobs"]' }) ?? r;
    },
    async after() {
      // Restore the unfiltered view (UI pref only).
      await clickOn(".hub-kpi-tile", "SYNCED", { exact: false, within: '[data-hub-screen="jobs"]' }).catch(() => {});
      await page.waitForTimeout(800);
    },
  },
  {
    id: "jobs-console",
    async run() {
      await clickOn(".hub-runtime-console-filter-pill", "SYNC", { exact: false });
      await page.waitForTimeout(1000);
      return page.evaluate(() => {
        const pill = document.querySelector(".hub-runtime-console-filter-pill");
        const panel = pill?.closest("section, .hub-runtime-console, [class*=console-panel], [class*=rail-panel]") || pill?.parentElement?.parentElement?.parentElement;
        const r = panel.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height };
      });
    },
    async after() {
      await clickOn(".hub-runtime-console-filter-pill", "All", { exact: false }).catch(() => {});
    },
  },
  {
    id: "job-detail",
    async run() {
      await clickRow("JB0004", '[data-hub-screen="jobs"]');
      await waitFor(() => !!document.querySelector('[role="dialog"]'));
      await page.waitForTimeout(2500);
      await noSpinners();
      return rectOf('[role="dialog"]');
    },
  },
  {
    id: "job-detail-folders",
    async run() {
      const open = await page.evaluate(() => !!document.querySelector('[role="dialog"]'));
      if (!open) {
        await clickRow("JB0004", '[data-hub-screen="jobs"]');
        await waitFor(() => !!document.querySelector('[role="dialog"]'));
        await page.waitForTimeout(2000);
      }
      await clickOn('[role="dialog"] nav button, [role="dialog"] nav a, [role="dialog"] [class*=toc] button', "Folders", { exact: false });
      await page.waitForTimeout(1500);
      await waitFor(() => !!document.querySelector('[role="dialog"] [role="tree"]'), null, 30000).catch(() => log("  ⚠ tree not found"));
      await noSpinners(30000);
      await page.waitForTimeout(1500);
      return page.evaluate(() => {
        const sec = document.querySelector('[role="dialog"] [role="tree"]')?.closest("section") || document.querySelector('[role="dialog"] [role="tree"]');
        const r = sec.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height };
      });
    },
    after: closeDialog,
  },
  {
    id: "system-host",
    async run() {
      await goScreen("System");
      await noSpinners();
      await hideDesignTemplate();
      await page.waitForTimeout(1200);
      return systemSection("Host");
    },
  },
  {
    id: "system-network",
    async run() {
      if ((await page.evaluate(() => localStorage.getItem("p0009:screen"))) !== "system") await goScreen("System");
      await hideDesignTemplate();
      // Run the read-only latency probe so the result is on screen (no setting is saved).
      await clickOn('[data-hub-screen="system"] button', "Test Connection", { exact: false });
      await page
        .waitForFunction(() => ![...document.querySelectorAll("button")].some((b) => /Testing…/.test(b.innerText)), null, { timeout: 45000, polling: 300 })
        .catch(() => log("  ⚠ probe still running"));
      await page.waitForTimeout(1200);
      return systemSection("Setting");
    },
  },
  {
    id: "system-safety",
    async run() {
      if ((await page.evaluate(() => localStorage.getItem("p0009:screen"))) !== "system") await goScreen("System");
      await hideDesignTemplate();
      await page.waitForTimeout(500);
      return systemSection("Safety");
    },
  },
];

try {
  await cdp.send("Emulation.setDeviceMetricsOverride", metrics);
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    localStorage.setItem("p0009_guided_tour_dismissed_v1", "1");
    localStorage.setItem("p0009:screen", "jobs");
  });
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await waitFor(() => document.querySelectorAll('[data-hub-screen="jobs"] table tbody tr').length > 0, null, 30000);
  await page.waitForTimeout(2500);
  await applyMask();

  const startAt = FROM ? Math.max(0, scenes.findIndex((s) => s.id === FROM)) : 0;
  for (const scene of scenes.slice(startAt)) {
    log(`▶ ${scene.id}`);
    try {
      const rect = await scene.run();
      if (!ONLY || ONLY.has(scene.id)) await shoot(scene.id, rect);
    } catch (err) {
      await page.screenshot({ path: path.join(TMP, `fail-${scene.id}.png`) }).catch(() => {});
      skipped.push({ id: scene.id, reason: err.message.split("\n")[0] });
      log(`  ✗ ${scene.id}: ${err.message.split("\n")[0]}`);
      await escapeAll().catch(() => {});
      await recoverIfCrashed();
    }
    if (scene.after) await scene.after().catch((e) => log(`  ⚠ after(${scene.id}): ${e.message}`));
  }
} finally {
  await page.evaluate(() => localStorage.setItem("p0009:screen", "jobs")).catch(() => {});
  await close();
}

fs.writeFileSync(HIGHLIGHTS, JSON.stringify(highlights, null, 2) + "\n");
const ogSrc = path.join(PNG_DIR, "jobs-overview.png");
if (fs.existsSync(ogSrc)) {
  // 3840×2160 → 1200×675, keep the top 630 px (brand + header + KPI strip; drops the empty table tail).
  ff(["-i", ogSrc, "-vf", "scale=1200:-1:flags=lanczos,crop=1200:630:0:0", "-frames:v", "1", "-update", "1", path.join(SITE, "public", "og.png")]);
  log("og → public/og.png");
}
if (!KEEP_PNG) fs.rmSync(PNG_DIR, { recursive: true, force: true });

console.log("\n=== capture summary ===");
for (const r of results) console.log(`${r.id.padEnd(22)} ${r.w}×${r.h}  ${JSON.stringify(highlights[r.id] || null)}`);
if (skipped.length) console.log(`skipped: ${skipped.map((s) => `${s.id} (${s.reason})`).join("; ")}`);
if (consoleErrors.length) console.log(`console errors (${consoleErrors.length}): ${[...new Set(consoleErrors)].slice(0, 6).join(" | ")}`);

function ff(argv) {
  // Single-threaded + one retry: on a loaded box ffmpeg's thread pool init can fail transiently.
  let r;
  for (let i = 0; i < 3; i++) {
    r = spawnSync(FFMPEG, ["-hide_banner", "-loglevel", "error", "-y", "-threads", "1", ...argv, ], { encoding: "utf8", windowsHide: true });
    if (r.status === 0) return;
    spawnSync(process.execPath, ["-e", "setTimeout(()=>{},1500)"]);
  }
  throw new Error(`ffmpeg: ${r.stderr}`);
}
