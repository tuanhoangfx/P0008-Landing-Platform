#!/usr/bin/env node
/**
 * Capture the Video Lab guide screenshots by replaying the demo flow in a P0003 Stealth
 * agent-pool profile (headless) against the built UI (`vite preview` :4129) + live worker :8029.
 *
 *   node site/scripts/capture.mjs [--base http://127.0.0.1:4129] [--until <sceneId>]
 *                                 [--dpr 2] [--width 1920 --height 1080] [--no-reset] [--keep-png]
 *
 * Outputs:
 *   site/public/shots/<id>.webp   (WebP q88, device pixels = CSS × dpr)
 *   site/public/og.png            (1200×630, 1× crop of the Mixer results shot)
 *   site/content/steps.json       (guide steps; highlight boxes measured from the live DOM)
 *
 * Idempotent: resets the app's browser storage, removes Studio/worker jobs and demo outputs that
 * the PREVIOUS capture run created (ids in site/.capture-tmp/state.json), then replays everything.
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { openStealthPlaywrightPage } from "../../../../scripts/lib/stealth-playwright-page.mjs";
import { scenes, installPickRoutes, resetAppState, applyCaptureCss, createActions, workerJson, WORKER, purgeDemoJobs } from "./lib/demo-flow.mjs";
import { STEPS } from "./lib/steps-copy.mjs";
import { makeDemoMedia } from "./make-demo-media.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.resolve(__dirname, "..");
const APP = path.resolve(SITE, "..");
const FFMPEG = process.env.VIDEO_LAB_FFMPEG || path.join(APP, "worker", "bin", "ffmpeg.exe");
const TMP = path.join(SITE, ".capture-tmp");
const PNG_DIR = path.join(TMP, "png");
const SHOTS = path.join(SITE, "public", "shots");
const STATE_FILE = path.join(TMP, "state.json");

const args = process.argv.slice(2);
const arg = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const BASE = arg("--base", "http://127.0.0.1:4129");
const UNTIL = arg("--until", null);
const DPR = Number(arg("--dpr", "2"));
const WIDTH = Number(arg("--width", "1920"));
const HEIGHT = Number(arg("--height", "1080"));
const NO_RESET = args.includes("--no-reset");
const KEEP_PNG = args.includes("--keep-png");

// Own sticky agent-pool lease: "default" (9990) is shared by every keyless agent and another
// session opening it closes our page mid-run.
process.env.STEALTH_AGENT_KEY ||= "p0010-guide-capture";

const t0 = Date.now();
const log = (...m) => console.log(`[capture +${((Date.now() - t0) / 1000).toFixed(1)}s]`, ...m);
for (const d of [TMP, PNG_DIR, SHOTS, path.join(SITE, "content")]) fs.mkdirSync(d, { recursive: true });

/* ------------------------------------------------------------ preconditions */
const health = await workerJson("/health").catch((e) => {
  throw new Error(`Worker ${WORKER} not reachable (${e.message}) — start it first`);
});
log(`worker ${health.name} v${health.version} ffmpeg=${health.ffmpeg?.found}`);
await fetch(BASE).then((r) => {
  if (!r.ok) throw new Error(`UI ${BASE} → ${r.status}`);
});
const demo = makeDemoMedia();

/* ------------------------------------------------------------ cleanup previous run */
const prev = fs.existsSync(STATE_FILE) ? JSON.parse(fs.readFileSync(STATE_FILE, "utf8")) : {};
if (!NO_RESET) {
  for (const id of prev.studioJobs ?? []) await fetch(`${WORKER}/studio/jobs/${id}`, { method: "DELETE" }).catch(() => {});
  for (const id of prev.workerJobs ?? []) await fetch(`${WORKER}/jobs/${id}`, { method: "DELETE" }).catch(() => {});
  // Every fresh Studio load persists a draft project on the worker — drop the ones we made.
  for (const id of prev.studioProjects ?? []) await fetch(`${WORKER}/studio/projects/${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => {});
  // Demo outputs live only under the neutral demo root's Output/ folder.
  fs.rmSync(demo.output, { recursive: true, force: true });
  fs.mkdirSync(path.join(demo.output, "Mixer"), { recursive: true });
  fs.mkdirSync(path.join(demo.output, "Encode"), { recursive: true });
}
if (!NO_RESET) await purgeDemoJobs(demo.root, log);
const jobsBefore = new Set((await workerJson("/jobs")).map((j) => j.id));
const studioBefore = new Set((await workerJson("/studio/jobs")).map((j) => j.id));
const projectsBefore = new Set((await workerJson("/studio/projects")).map((p) => p.id));

/* ------------------------------------------------------------ browser */
const { page, close, profile, browser } = await openStealthPlaywrightPage({ viewport: { width: WIDTH, height: HEIGHT } });
log(`stealth profile ${profile}`);
const consoleErrors = [];
const results = [];
const skipped = [];
const stepBoxes = {};
const pick = { files: [], directory: null };
const state = {};
try {
  const cdp = await page.context().newCDPSession(page);
  const metrics = { width: WIDTH, height: HEIGHT, deviceScaleFactor: DPR, mobile: false };
  await cdp.send("Emulation.setDeviceMetricsOverride", metrics);
  // Studio "Export & Download" would save into the profile's Downloads — not wanted here.
  await browser
    ?.newBrowserCDPSession?.()
    .then((b) => b.send("Browser.setDownloadBehavior", { behavior: "deny" }))
    .catch(() => {});
  page.on("dialog", (d) => {
    consoleErrors.push(`dialog: ${d.message()}`);
    d.dismiss().catch(() => {});
  });
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(m.text().slice(0, 300));
  });
  page.on("load", () => applyCaptureCss(page));
  await installPickRoutes(page, pick, log);

  const pace = async () => {}; // capture: no human pauses
  const ctx = { page, base: BASE, demo, pick, state, log, pace, ...createActions(page, { pace }) };
  if (!NO_RESET) await resetAppState(ctx);

  for (const scene of scenes) {
    const s0 = Date.now();
    log(`▶ ${scene.id}`);
    try {
      await scene.run(ctx);
    } catch (err) {
      const dbg = path.join(TMP, `fail-${scene.id}.png`);
      await page.screenshot({ path: dbg }).catch(() => {});
      if (!scene.optional) throw new Error(`scene ${scene.id} failed: ${err.message} (debug ${dbg})`);
      // Optional scene (depends on a service that may be down): keep going without its shot.
      const reason = err.message.split("\n")[0];
      skipped.push({ id: scene.id, reason });
      fs.rmSync(path.join(SHOTS, `${scene.id}.webp`), { force: true });
      log(`  ⚠ optional scene skipped: ${reason}`);
      if (scene.recover) await scene.recover(ctx).catch(() => {});
      continue;
    }
    await page.evaluate(() => document.activeElement?.blur?.()).catch(() => {});
    if (!scene.shot?.keepHover) await page.mouse.move(WIDTH - 4, HEIGHT - 4).catch(() => {});
    await page.waitForTimeout(150);
    const metricsNow = await page.evaluate(() => ({ dpr: devicePixelRatio, w: innerWidth, h: innerHeight }));
    if (metricsNow.dpr !== DPR) await cdp.send("Emulation.setDeviceMetricsOverride", metrics);

    if (scene.shot) {
      const png = path.join(PNG_DIR, `${scene.id}.png`);
      const clip = await shotClip(page, scene.shot);
      const shot = await cdp.send("Page.captureScreenshot", {
        format: "png",
        ...(clip ? { clip: { ...clip, scale: 1 } } : {}),
        captureBeyondViewport: false,
      });
      fs.writeFileSync(png, Buffer.from(shot.data, "base64"));
      const webp = path.join(SHOTS, `${scene.id}.webp`);
      toWebp(png, webp);
      const dims = pngSize(png);
      results.push({ id: scene.id, chapter: scene.chapter, webp, ...dims, ms: Date.now() - s0 });
      log(`  ✓ ${path.relative(SITE, webp)} ${dims.w}×${dims.h}`);
    }
    // Highlight boxes measured after the shot (keeps transient states like "Running" in frame).
    for (const step of STEPS.filter((s) => s.scene === scene.id && s.highlight)) {
      const box = await measure(page, step.highlight, scene.shot?.selector);
      if (box) stepBoxes[step.id] = box;
      else log(`  ⚠ highlight selector not found for step ${step.id}: ${step.highlight}`);
    }

    if (scene.after) await scene.after(ctx);
    if (UNTIL && scene.id === UNTIL) break;
  }

} finally {
  state.workerJobs = (await workerJson("/jobs").catch(() => [])).map((j) => j.id).filter((id) => !jobsBefore.has(id));
  state.studioJobs = (await workerJson("/studio/jobs").catch(() => [])).map((j) => j.id).filter((id) => !studioBefore.has(id));
  state.studioProjects = (await workerJson("/studio/projects").catch(() => [])).map((p) => p.id).filter((id) => !projectsBefore.has(id));
  fs.writeFileSync(
    STATE_FILE,
    JSON.stringify(
      {
        at: new Date().toISOString(),
        workerJobs: [...new Set([...(state.workerJobs ?? []), ...(NO_RESET ? prev.workerJobs ?? [] : [])])],
        studioJobs: [...new Set([...(state.studioJobs ?? []), ...(NO_RESET ? prev.studioJobs ?? [] : [])])],
        studioProjects: [...new Set([...(state.studioProjects ?? []), ...(NO_RESET ? prev.studioProjects ?? [] : [])])],
      },
      null,
      2,
    ),
  );
  await close();
}

/* ------------------------------------------------------------ OG + steps.json */
const ogSrc = path.join(PNG_DIR, "mixer-done.png");
if (fs.existsSync(ogSrc)) {
  // 1× hero: the whole Mixer results screen at 1200 px wide, top 630 px (drops the pager row).
  ff(["-i", ogSrc, "-vf", "scale=1200:-1:flags=lanczos,crop=1200:630:0:0", "-frames:v", "1", "-update", "1", path.join(SITE, "public", "og.png")]);
  log(`og → public/og.png`);
}

const shotsById = new Map(results.map((r) => [r.id, r]));
const steps = STEPS.filter((s) => shotsById.has(s.scene)).map((s, i) => {
  const { scene, highlight, ...rest } = s;
  const out = { ...rest, order: i + 1, shot: `shots/${scene}.webp` };
  if (stepBoxes[s.id]) out.highlight = stepBoxes[s.id];
  return out;
});
if (!UNTIL) {
  fs.writeFileSync(path.join(SITE, "content", "steps.json"), JSON.stringify(steps, null, 2) + "\n");
  log(`steps.json → ${steps.length} steps`);
}
if (!KEEP_PNG && !UNTIL) fs.rmSync(PNG_DIR, { recursive: true, force: true });

console.log("\n=== capture summary ===");
for (const r of results) console.log(`${r.chapter.padEnd(8)} ${r.id.padEnd(22)} ${r.w}×${r.h}  ${(r.ms / 1000).toFixed(1)}s`);
if (skipped.length) console.log(`skipped optional scenes: ${skipped.map((x) => `${x.id} (${x.reason})`).join("; ")}`);
if (consoleErrors.length) console.log(`console errors (${consoleErrors.length}):\n  ` + [...new Set(consoleErrors)].slice(0, 12).join("\n  "));
console.log(`total ${((Date.now() - t0) / 1000).toFixed(1)}s · ${results.length} shots · viewport ${WIDTH}×${HEIGHT}@${DPR}x`);

/* ------------------------------------------------------------ utils */
function ff(argv) {
  const r = spawnSync(FFMPEG, ["-hide_banner", "-loglevel", "error", "-y", ...argv], { encoding: "utf8", windowsHide: true });
  if (r.status !== 0) throw new Error(`ffmpeg: ${r.stderr}`);
}
function toWebp(src, dest) {
  ff(["-i", src, "-c:v", "libwebp", "-quality", "88", "-compression_level", "6", "-preset", "text", "-frames:v", "1", "-update", "1", dest]);
}
function pngSize(file) {
  const b = fs.readFileSync(file);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}
async function shotClip(pg, shot) {
  if (shot.clip) return shot.clip;
  if (!shot.selector) return null;
  const box = await pg.locator(shot.selector).filter({ visible: true }).first().boundingBox({ timeout: 5000 }).catch(() => null);
  if (!box) return null;
  const pad = shot.pad ?? 16;
  const x = Math.max(0, box.x - pad);
  const y = Math.max(0, box.y - pad);
  return {
    x,
    y,
    width: Math.min(WIDTH - x, box.width + pad * 2),
    height: Math.min(HEIGHT - y, box.height + pad * 2),
  };
}
/** Highlight box in % of the shot (viewport, or the scene's element clip). */
async function measure(pg, selector, shotSelector) {
  const loc = typeof selector === "function" ? selector(pg) : pg.locator(selector).filter({ visible: true }).first();
  const box = await loc.boundingBox({ timeout: 2000 }).catch(() => null);
  if (!box) return null;
  const frame = (await shotClip(pg, { selector: shotSelector })) || { x: 0, y: 0, width: WIDTH, height: HEIGHT };
  const pct = (v, total) => Math.round((v / total) * 1000) / 10;
  return {
    x: pct(box.x - frame.x, frame.width),
    y: pct(box.y - frame.y, frame.height),
    w: pct(box.width, frame.width),
    h: pct(box.height, frame.height),
  };
}
