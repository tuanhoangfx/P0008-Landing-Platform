/**
 * Video Lab guide — ordered demo scenes (shared by capture.mjs and a future video recorder).
 *
 * Each scene: { id, chapter, title, run: async (ctx) => {...}, shot?: { selector?, clip?, full? } }
 *   - run() drives the REAL UI (clicks, typing, setInputFiles). Only native OS dialogs are
 *     intercepted (see installPickRoutes): /pick/files, /pick/directory, /pick/videos-folder
 *     return the neutral demo paths. Probe, Prefight, Mix / Encode / Studio export jobs are real.
 *   - shot.selector → element screenshot (padded), shot.clip → {x,y,w,h} CSS px, else viewport.
 *   - ctx.pace(ms) is ~0 in capture, human-paced in recording.
 *
 * ctx = { page, base, demo, pace, log, pick, state, click, type }   (click/type: see createActions)
 *   demo  = manifest from make-demo-media.mjs ({ intro[], main[], outro[], images[], script, output })
 *   pick  = mutable { files: string[], directory: string|null } consumed by the routes
 *   state = scratch object shared between scenes (job ids, …)
 */
import fs from "node:fs";
import path from "node:path";

export const WORKER = "http://127.0.0.1:8029";

/* ---------------------------------------------------------------- helpers */

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "*",
  "content-type": "application/json",
};

/** Native-dialog stand-ins: return demo paths instead of opening a Tk / Electron dialog. */
export async function installPickRoutes(page, pick, log = () => {}) {
  const reply = (route, body) =>
    route.request().method() === "OPTIONS"
      ? route.fulfill({ status: 204, headers: CORS, body: "" })
      : route.fulfill({ status: 200, headers: CORS, body: JSON.stringify(body) });
  await page.route(`${WORKER}/pick/files`, (route) => {
    const paths = pick.files.slice();
    log(`[pick] /pick/files → ${paths.length} demo path(s)`);
    return reply(route, { paths, canceled: paths.length === 0 });
  });
  await page.route(`${WORKER}/pick/directory`, (route) => {
    log(`[pick] /pick/directory → ${pick.directory}`);
    return reply(route, { path: pick.directory, canceled: !pick.directory });
  });
  // /pick/videos-folder already accepts `root` (no dialog) — let it run for real.
}

/** Hide anything that could carry personal info (account email etc.) — applied every load. */
export const PRIVACY_CSS = `
  /* sidebar account chip: keep generic label only */
  .hub-sidebar-account__email, [data-hub-account-email] { visibility: hidden !important; }
  /* no blinking caret in screenshots */
  * { caret-color: transparent !important; }
`;

export async function applyCaptureCss(page) {
  await page.addStyleTag({ content: PRIVACY_CSS }).catch(() => {});
}

const escapeRx = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const rx = (s) => (s instanceof RegExp ? s : new RegExp(`^\\s*${s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "i"));

/** Button by visible text (exact, trimmed, case-insensitive) inside an optional scope. */
export function button(page, text, scope) {
  const root = scope ? page.locator(scope) : page;
  return root.locator("button", { hasText: rx(text) }).filter({ visible: true }).first();
}

/** Resolve a Locator or CSS selector string. */
export const resolveTarget = (page, target) => (typeof target === "string" ? page.locator(target).first() : target);

/**
 * Default ctx actions used by capture. A recorder can swap ctx.click / ctx.type for versions that
 * animate a cursor to the target and type human-paced; every scene interaction goes through them.
 *   ctx.click(locatorOrSelector, { pace?, dispatch? })   dispatch → DOM click event (directory <tr>)
 *   ctx.hover(locatorOrSelector)                         hover (tooltips)
 *   ctx.type(locatorOrSelector, text, { clear = true, paste = false })   paste → long text, fill()
 */
export function createActions(page, { pace = async () => {} } = {}) {
  return {
    async click(target, { pace: ms = 350, dispatch = false } = {}) {
      const loc = resolveTarget(page, target);
      await loc.scrollIntoViewIfNeeded().catch(() => {});
      await pace(ms);
      if (dispatch) await loc.evaluate((el) => el.dispatchEvent(new MouseEvent("click", { bubbles: true })));
      else {
        // Headless background tabs throttle rAF, so Playwright's "stable" check can stall for
        // seconds per click; wait for visibility ourselves and click without actionability waits.
        await loc.waitFor({ state: "visible", timeout: 30_000 });
        await loc.click({ force: true });
      }
    },
    async hover(target, { pace: ms = 300 } = {}) {
      const loc = resolveTarget(page, target);
      await loc.scrollIntoViewIfNeeded().catch(() => {});
      await pace(ms);
      await loc.hover({ force: true });
    },
    async type(target, text, { clear = true, paste = false, delay = 0 } = {}) {
      const loc = resolveTarget(page, target);
      // Capture fills in one go; a recorder can pass delay > 0 for visible keystrokes.
      if (paste || delay === 0) return void (await loc.fill(String(text)));
      if (clear) await loc.fill("");
      await loc.pressSequentially(String(text), { delay });
    },
  };
}

export async function goScreen(ctx, screen) {
  const { page } = ctx;
  const link = page.locator(`nav a, nav button, aside a, aside button`, { hasText: rx(screen) }).first();
  if (await link.count()) {
    await ctx.click(link);
  } else {
    await page.goto(`${ctx.base}/${screen.toLowerCase()}`, { waitUntil: "domcontentloaded" });
  }
  await page.waitForTimeout(900);
  await applyCaptureCss(page);
}

/** Rail field by section id + label (labels carry an emoji, so match the heading title attr). */
export function railFieldLocator(page, sectionId, label) {
  return page
    .locator(`#${sectionId} .hub-adm-inline-field`)
    .filter({ has: page.locator(`.hub-adm-inline-field__label .hub-users-th-heading[title="${label}"]`) })
    .first();
}

/** Editing the last rail fields scrolls the Setting body — bring Mix mode back into view. */
export async function scrollRailTop(page) {
  await page.mouse.move(8, 8).catch(() => {}); // drop hover tooltips
  await page.evaluate(() => {
    for (const el of document.querySelectorAll(".video-lab-setting__body")) el.scrollTop = 0;
  });
  await page.waitForTimeout(300);
}

/** Click-edit rail field: section id + field label → type value + Enter. */
export async function setRailField(ctx, sectionId, label, value) {
  const { page } = ctx;
  const field = railFieldLocator(page, sectionId, label);
  // Already holds the value — skip the edit round-trip (same rule as setRailFilter).
  const shown = (await field.innerText().catch(() => "")).replace(/s+/g, " ").trim();
  if (shown.endsWith(String(value)) || shown.includes(` ${value} `)) return;
  await ctx.click(field.locator(".hub-adm-click-edit").first(), { pace: 250 });
  const input = field.locator("input").first();
  await input.waitFor({ state: "visible", timeout: 5000 });
  await ctx.type(input, String(value));
  await input.press("Enter");
  await page.waitForTimeout(200);
}

/** Click-filter rail field (dropdown): open → choose option by text. */
export async function setRailFilter(ctx, sectionId, label, optionText) {
  const { page } = ctx;
  const field = railFieldLocator(page, sectionId, label);
  const want = new RegExp(`(^|[^A-Za-z])${escapeRx(optionText)}([^A-Za-z]|$)`, "i");
  // Already set (e.g. Encode Goal defaults to Vertical 9:16) — opening the menu would only add noise.
  if (want.test((await field.innerText().catch(() => "")).replace(/\s+/g, " "))) return;
  await ctx.click(field.locator("button.hub-filter-trigger, .hub-adm-click-filter button").first(), { pace: 250 });
  // Options render as rows inside the listbox ("🔀 Random · Shuffle within the pool.").
  const opt = page
    // Older ClickFilter renders [role=listbox]; the searchable one (2026-10-24) is a bare .anim-pop popover.
    .locator("[role=listbox], .anim-pop.fixed")
    .filter({ visible: true })
    .last()
    .locator(".hub-filter-dropdown-list button, [role=option], button:not([aria-label=Clear])")
    .filter({ hasText: new RegExp(`(^|[^A-Za-z])${escapeRx(optionText)}([^A-Za-z]|$)`, "i") })
    .first();
  await opt.waitFor({ state: "visible", timeout: 5000 });
  await ctx.click(opt);
  await page.keyboard.press("Escape").catch(() => {});
  await page.waitForTimeout(250);
}

export async function waitFor(fn, { timeout = 60_000, interval = 400, label = "condition" } = {}) {
  const t0 = Date.now();
  let last;
  while (Date.now() - t0 < timeout) {
    last = await fn().catch((e) => {
      if (e?.fatal) throw e; // e.g. worker job reported "error" — no point waiting
      return e;
    });
    if (last === true || (last && last !== false && !(last instanceof Error))) return last;
    await new Promise((r) => setTimeout(r, interval));
  }
  throw new Error(`timeout waiting for ${label}${last instanceof Error ? `: ${last.message}` : ""}`);
}

/**
 * Delete every worker job / Studio job that touched the demo root — whichever run made it.
 * Leftovers are not harmless: Encode re-attaches a finished job with matching paths and marks
 * freshly queued clips Done on arrival (empty queue, Start disabled).
 */
export async function purgeDemoJobs(demoRoot, log = () => {}) {
  const needle = String(demoRoot).toLowerCase().replaceAll("\\", "/");
  // JSON.stringify doubles each backslash, so collapse both forms before comparing.
  const touches = (j) => JSON.stringify(j).toLowerCase().replaceAll("\\\\", "/").replaceAll("\\", "/").includes(needle);
  let n = 0;
  for (const [list, del] of [["/jobs", "/jobs/"], ["/studio/jobs", "/studio/jobs/"]]) {
    const jobs = await workerJson(list).catch(() => []);
    for (const j of jobs.filter(touches)) {
      await fetch(`${WORKER}${del}${encodeURIComponent(j.id)}`, { method: "DELETE" }).catch(() => {});
      n += 1;
    }
  }
  log(`[demo] purged ${n} leftover job(s) under ${demoRoot}`);
  return n;
}

export async function workerJson(p, init) {
  const r = await fetch(`${WORKER}${p}`, init);
  if (!r.ok) throw new Error(`${p} → ${r.status}`);
  return r.json();
}

/** Text of the whole page with whitespace collapsed (for "no error / no spinner" checks). */
export async function pageText(page, sel = "body") {
  return page.evaluate((s) => (document.querySelector(s)?.innerText || "").replace(/\s+/g, " "), sel);
}

/** Table rows (tbody tr) inside a scope, excluding empty-state rows. */
export async function rowCount(page, scope) {
  return page.evaluate((s) => {
    const root = document.querySelector(s);
    if (!root) return -1;
    return [...root.querySelectorAll("tbody tr")].filter((tr) => tr.querySelectorAll("td").length > 1).length;
  }, scope);
}

/* ---------------------------------------------------------------- reset */

export async function resetAppState(ctx) {
  const { page, base } = ctx;
  await page.goto(`${base}/mixer`, { waitUntil: "domcontentloaded" });
  await page.evaluate(async () => {
    localStorage.clear();
    sessionStorage.clear();
    if (indexedDB.databases) {
      for (const db of await indexedDB.databases()) if (db.name) indexedDB.deleteDatabase(db.name);
    }
  });
}

/* ---------------------------------------------------------------- scenes */

const MIX_IN = ".video-lab-hub-app";

export const scenes = [
  /* ------------------------------------------------------------ install */
  {
    id: "install-open",
    chapter: "install",
    title: "First launch",
    run: async (ctx) => {
      await ctx.page.goto(`${ctx.base}/studio`, { waitUntil: "domcontentloaded" });
      await ctx.page.waitForTimeout(2500);
      await applyCaptureCss(ctx.page);
    },
    shot: {},
  },

  /* ------------------------------------------------------------ studio */
  {
    id: "studio-output-settings",
    chapter: "studio",
    title: "Output settings (9:16, auto-download off)",
    run: async (ctx) => {
      const { page } = ctx;
      await ctx.click(page.locator("header button, [role=banner] button", { hasText: rx("Settings") }).first());
      const modal = page.locator("[role=dialog]").filter({ visible: true }).first();
      await modal.waitFor({ timeout: 8000 });
      // Output is the first (and default) Settings section in the Studio tab.
      const outputNav = modal.locator("button, [role=tab], a", { hasText: rx("Output") }).first();
      if (await outputNav.count()) await ctx.click(outputNav).catch(() => {});
      await ctx.click(modal.getByRole("button", { name: "9:16", exact: true }).first());
      // Auto Download OFF: guide exports stay on the worker (no browser download prompt).
      await ctx.click(modal.getByRole("button", { name: "OFF", exact: true }).first());
      // Fit: narration length is split across all images (video ends with the voice).
      await ctx.click(modal.locator("button", { hasText: rx("Fit") }).first());
      await page.waitForTimeout(500);
    },
    shot: { selector: "[role=dialog]" },
    after: async (ctx) => {
      const modal = ctx.page.locator("[role=dialog]").filter({ visible: true }).first();
      const save = button(ctx.page, "Save", "[role=dialog]");
      if ((await save.count()) && !(await save.isDisabled())) await ctx.click(save);
      else await ctx.click(button(ctx.page, "Cancel", "[role=dialog]"));
      await modal.waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
    },
  },
  {
    id: "studio-images",
    chapter: "studio",
    title: "Upload images",
    run: async (ctx) => {
      const { page } = ctx;
      const upload = button(page, "Upload");
      await upload.waitFor({ timeout: 15_000 });
      await ctx.pace(400);
      // Upload button clicks a hidden <input type=file> — feed it the demo PNGs directly.
      const input = page.locator('input[type=file][accept*="image"]').first();
      await input.setInputFiles(ctx.demo.images);
      const n = ctx.demo.images.length;
      await waitFor(async () => (await page.locator('button[aria-label="Select image"], button[aria-label="Deselect image"]').count()) >= n, {
        timeout: 20_000,
        label: "images in library",
      });
      await page.waitForTimeout(800);
    },
    shot: {},
  },
  {
    id: "studio-keyframe",
    chapter: "studio",
    title: "Add images to the keyframe timeline",
    run: async (ctx) => {
      const { page } = ctx;
      // Select-all chip in the library toolbar, then "Add to Keyframe (n)".
      // HubDirectorySelectAllChip renders reserve labels, so match "Select" loosely and skip
      // the per-thumbnail "Select image" toggles (aria-label only).
      await ctx.click(page.locator('button[aria-label="Select"][title^="Select all"]').first());
      const add = page.locator("button", { hasText: /Add to Keyframe/i }).first();
      await waitFor(async () => !(await add.isDisabled()), { timeout: 8000, label: "Add to Keyframe enabled" });
      await ctx.click(add);
      await page.waitForTimeout(1200);
    },
    shot: {},
  },
  {
    id: "studio-script",
    chapter: "studio",
    title: "Paste the narration script",
    run: async (ctx) => {
      const { page } = ctx;
      const script = fs.readFileSync(ctx.demo.script, "utf8").trim();
      const box = page.locator('textarea[placeholder^="Paste script"]').first();
      await ctx.click(box);
      await ctx.type(box, script, { paste: true });
      await page.waitForTimeout(800);
      await box.evaluate((el) => (el.scrollTop = 0)); // show the script from its first line
    },
    shot: {},
  },
  {
    id: "studio-voice",
    chapter: "studio",
    title: "Choose a Vietnamese voice",
    run: async (ctx) => {
      const { page } = ctx;
      const search = page.locator('input[placeholder*="Search voice" i]').first();
      await ctx.click(search);
      await ctx.type(search, "vi-VN");
      await page.waitForTimeout(900);
      const row = page.locator("tr", { hasText: "Hoài My" }).first();
      await row.waitFor({ timeout: 8000 });
      await ctx.click(row, { dispatch: true });
      await page.waitForTimeout(800);
    },
    shot: {},
  },
  {
    id: "studio-export",
    chapter: "studio",
    title: "Export the video",
    // Real TTS + render on the worker. Optional: if the Studio pipeline is down the rest of
    // the guide is still captured (capture prints the reason; the step is left out).
    optional: true,
    run: async (ctx) => {
      const { page } = ctx;
      const before = new Set((await workerJson("/studio/jobs")).map((j) => j.id));
      const exp = page.locator("button", { hasText: /Export\s*&\s*Download|Queue export/i }).first();
      await waitFor(async () => !(await exp.isDisabled()), { timeout: 10_000, label: "Export enabled" });
      await ctx.click(exp);
      await waitFor(
        async () => {
          const j = (await workerJson("/studio/jobs")).find((x) => !before.has(x.id));
          if (j?.status === "error" || j?.status === "canceled") {
            throw Object.assign(new Error(`studio job ${j.id} ${j.status}: ${j.error || j.message}`), { fatal: true });
          }
          return j?.status === "done" ? j : false;
        },
        { timeout: 300_000, interval: 1500, label: "studio export done" },
      );
      await page.waitForTimeout(2500);
    },
    shot: {},
  },

  /* ------------------------------------------------------------ mixer */
  {
    id: "mixer-add-inputs",
    chapter: "mixer",
    title: "Add Intro / Main / Outro clips",
    run: async (ctx) => {
      const { page } = ctx;
      await goScreen(ctx, "Mixer");
      await ctx.click(button(page, "New"));
      const modal = page.locator("[role=dialog]").filter({ visible: true }).first();
      await modal.waitFor({ timeout: 8000 });
      const stage = async (kind, files) => {
        await ctx.click(modal.locator(".hub-toc-nav__item", { hasText: new RegExp(`^\\s*\\S*\\s*${kind}`, "i") }).first());
        ctx.pick.files = files;
        await ctx.click(button(page, "Browse", "[role=dialog]"));
        await waitFor(async () => (await pageText(page, "[role=dialog]")).includes(path.basename(files.at(-1))), {
          timeout: 10_000,
          label: `${kind} staged`,
        });
        await page.waitForTimeout(400);
      };
      await stage("Intro", ctx.demo.intro);
      await stage("Outro", ctx.demo.outro);
      await stage("Main", ctx.demo.main);
      ctx.pick.files = [];
    },
    shot: { selector: "[role=dialog]" },
  },
  {
    id: "mixer-inputs",
    chapter: "mixer",
    title: "Inputs probed",
    run: async (ctx) => {
      const { page } = ctx;
      await ctx.click(button(page, "Save", "[role=dialog]"));
      await page.waitForTimeout(500);
      await closeDialogIfOpen(ctx);
      // Wait for probe → durations (m:ss) on every input row.
      await waitFor(
        async () => {
          const t = await pageText(page);
          return (t.match(/main-0\d\.mp4|intro-\w\.mp4|outro-\w\.mp4/g) || []).length >= 10 && /0:0[3-8]/.test(t);
        },
        { timeout: 30_000, label: "inputs probed" },
      );
      await page.waitForTimeout(1500);
    },
    shot: {},
  },
  {
    id: "mixer-settings",
    chapter: "mixer",
    title: "Mix mode, counts, workers",
    run: async (ctx) => {
      await setRailFilter(ctx, "p0010-setting-mix-mode", "Main", "Random");
      await setRailField(ctx, "p0010-setting-counts", "Main", 2);
      await setRailField(ctx, "p0010-setting-counts", "Total", 6);
      await setRailField(ctx, "p0010-setting-workers", "Concurrent", 3);
      await setRailField(ctx, "p0010-setting-output", "Directory", path.join(ctx.demo.output, "Mixer"));
      await scrollRailTop(ctx.page);
      await ctx.page.waitForTimeout(600);
    },
    shot: {},
  },
  {
    id: "mixer-running",
    chapter: "mixer",
    title: "Start — watch progress",
    run: async (ctx) => {
      const { page } = ctx;
      fs.mkdirSync(path.join(ctx.demo.output, "Mixer"), { recursive: true });
      const start = button(page, "Start", ".stealth-runtime-setting");
      await ctx.click(start);
      // Grab the first frame where a row is running (stream-copy mixes are quick).
      await waitFor(
        () =>
          page.evaluate(() =>
            [...document.querySelectorAll("tbody tr")].some((tr) => /Mix_.*Running/.test(tr.innerText.replace(/\s+/g, " "))),
          ),
        { timeout: 20_000, interval: 50, label: "mix row running" },
      );
    },
    shot: {},
  },
  {
    id: "mixer-done",
    chapter: "mixer",
    title: "Outputs + history",
    run: async (ctx) => {
      const { page } = ctx;
      await waitFor(
        async () => {
          const jobs = await workerJson("/jobs");
          const mix = jobs.find((j) => j.type === "mixer" || j.job_type === "mixer" || j.items);
          if (mix?.status === "error") throw Object.assign(new Error(`mix job error: ${mix.message}`), { fatal: true });
          return mix && mix.status === "done";
        },
        { timeout: 180_000, interval: 800, label: "mix done" },
      );
      await page.waitForTimeout(2000);
    },
    shot: {},
  },

  {
    id: "mixer-output-detail",
    chapter: "mixer",
    title: "Output detail",
    run: async (ctx) => {
      const { page } = ctx;
      // Directory rows: dispatch the click on <tr> (cells stopPropagation).
      await ctx.click(page.locator("tr", { hasText: /Mix_.*\.mp4/ }).first(), { dispatch: true });
      await page.locator("[role=dialog]").filter({ visible: true }).first().waitFor({ timeout: 8000 });
      await page.waitForTimeout(900);
    },
    shot: { selector: "[role=dialog]" },
    after: async (ctx) => {
      await ctx.click(button(ctx.page, "Close", "[role=dialog]"));
      await ctx.page.locator("[role=dialog]").first().waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
    },
  },

  /* ------------------------------------------------------------ encode */
  {
    id: "encode-queue",
    chapter: "encode",
    title: "Queue videos for Encode",
    run: async (ctx) => {
      const { page } = ctx;
      // Mixer leaves an auto-start Encode seed (src/lib/encode-seed.ts) that the app also holds in memory —
      // drop it and reload so the guide's own clips wait in the queue instead of encoding on Save.
      await page.evaluate(() => sessionStorage.removeItem("p0010_encode_seed_v1")).catch(() => {});
      await page.goto(`${ctx.base}/encode`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1500);
      await applyCaptureCss(page);
      await ctx.click(button(page, "New"));
      await page.locator("[role=dialog]").filter({ visible: true }).first().waitFor({ timeout: 8000 });
      ctx.pick.files = ctx.demo.main;
      await ctx.click(button(page, "Browse", "[role=dialog]"));
      await waitFor(async () => (await pageText(page, "[role=dialog]")).includes("main-06"), { timeout: 10_000, label: "encode staged" });
      await ctx.click(button(page, "Save", "[role=dialog]"));
      await page.waitForTimeout(400);
      await closeDialogIfOpen(ctx);
      ctx.pick.files = [];
      await waitFor(async () => /0:0[3-8]/.test(await pageText(page)), { timeout: 30_000, label: "queue probed" });
      await page.waitForTimeout(800);
    },
    shot: {},
  },
  {
    id: "encode-settings",
    chapter: "encode",
    title: "Profile + output folder",
    run: async (ctx) => {
      const { page } = ctx;
      await setRailFilter(ctx, "p0010-encode-preset", "Profile", "Vertical 9:16");
      await setRailField(ctx, "p0010-encode-workers", "Concurrent", 2);
      await setRailFilter(ctx, "p0010-encode-output", "Location", "Custom folder");
      await setRailField(ctx, "p0010-encode-output", "Directory", path.join(ctx.demo.output, "Encode"));
      await scrollRailTop(page);
      await page.waitForTimeout(500);
    },
    shot: {},
  },
  {
    id: "encode-running",
    chapter: "encode",
    title: "Encode running",
    run: async (ctx) => {
      const { page } = ctx;
      await ctx.click(button(page, "Start", ".stealth-runtime-setting"));
      await waitFor(async () => /Running|Encoding|\d+%/.test(await pageText(page)), {
        timeout: 20_000,
        interval: 150,
        label: "encode running",
      });
      await page.waitForTimeout(1200);
    },
    shot: {},
  },
  {
    id: "encode-done",
    chapter: "encode",
    title: "Encode results",
    run: async (ctx) => {
      const { page } = ctx;
      await waitFor(
        async () => {
          const jobs = await workerJson("/jobs");
          const enc = jobs.find((j) => j.type === "encode" || j.encode_map);
          if (enc?.status === "error") throw new Error(`encode job error: ${enc.message}`);
          return enc && enc.status === "done";
        },
        { timeout: 240_000, interval: 1000, label: "encode done" },
      );
      // "Encode complete" dialog pops when the batch finishes.
      await page.locator("[role=dialog]").filter({ hasText: /Encode complete/i }).first().waitFor({ timeout: 15_000 });
      await page.waitForTimeout(800);
    },
    shot: { selector: "[role=dialog]", pad: 24 },
    after: async (ctx) => {
      await ctx.click(button(ctx.page, /Stay on Encode/i, "[role=dialog]"));
      await ctx.page.locator("[role=dialog]").first().waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
    },
  },
  {
    id: "encode-results",
    chapter: "encode",
    title: "Encoded outputs + history",
    run: async (ctx) => {
      await ctx.page.waitForTimeout(1200);
    },
    shot: {},
  },

  /* ------------------------------------------------------------ system */
  {
    id: "system",
    chapter: "system",
    title: "System",
    run: async (ctx) => {
      await goScreen(ctx, "System");
      await ctx.page.waitForTimeout(800);
    },
    shot: {},
  },
];

/** Encode's New modal closes itself on Save; Mixer's stays open (staging kept until Close). */
export async function closeDialogIfOpen(ctx) {
  const close = button(ctx.page, "Close", "[role=dialog]");
  if (await close.isVisible().catch(() => false)) await ctx.click(close);
  await ctx.page.locator("[role=dialog]").first().waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
}
