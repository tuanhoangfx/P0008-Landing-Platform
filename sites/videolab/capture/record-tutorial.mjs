#!/usr/bin/env node
/**
 * Record the Video Lab tutorial: replays the same demo-flow scenes as capture.mjs in a P0003
 * agent-pool profile (headless), human-paced with a drawn cursor, narrated by edge-tts.
 *
 *   node site/scripts/record-tutorial.mjs [--base http://127.0.0.1:4129] [--keep]
 *
 * Out (site/public/video/):
 *   tutorial.mp4 + tutorial.vi.vtt + tutorial.chapters.vtt + tutorial.vi.srt   full walkthrough
 *   <chapter>.mp4 + <chapter>.vi.vtt                                          one per chapter
 *
 * Timing model: one continuous screencast, cut per segment afterwards. A segment keeps real
 * time up to its last interaction (+1.2s); whatever it spent waiting on the worker (export,
 * mix, encode) is sped up so the segment lasts as long as its narration, with a "tua nhanh"
 * badge when the speed-up is noticeable. Short segments hold their last frame instead.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { openStealthPlaywrightPage } from "../../../../scripts/lib/stealth-playwright-page.mjs";
import { scenes, createActions, installPickRoutes, resetAppState, applyCaptureCss, workerJson, purgeDemoJobs, WORKER } from "./lib/demo-flow.mjs";
import { makeDemoMedia } from "./make-demo-media.mjs";
import { recordingCtx, ensureOverlay } from "../../../engine/recorder/overlay.mjs";
import { tts, parseSrt, writeVtt, writeSrt, startScreencast, framesToVideo, ffmpeg, probeDuration } from "../../../engine/recorder/media.mjs";

const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TMP = path.join(SITE, ".record-tmp");
const OUT = path.join(SITE, "public", "video");
const STATE_FILE = path.join(TMP, "state.json");
const args = process.argv.slice(2);
const arg = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const BASE = arg("--base", "http://127.0.0.1:4129");
const W = 1920;
const H = 1080;
const FPS = 30;
const AUDIO_LEAD = 0.25;
const FONT = "C\\:/Windows/Fonts/segoeuib.ttf";

const t0 = Date.now();
const log = (...m) => console.log(`[record +${((Date.now() - t0) / 1000).toFixed(1)}s]`, ...m);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
for (const d of [TMP, OUT]) fs.mkdirSync(d, { recursive: true });

const narration = JSON.parse(fs.readFileSync(path.join(SITE, "content/narration.json"), "utf8"));
const chapters = JSON.parse(fs.readFileSync(path.join(SITE, "content/chapters.json"), "utf8")).sort((a, b) => a.order - b.order);
const caption = (text) =>
  Object.entries(narration.captionFix ?? {}).reduce((s, [from, to]) => s.replace(new RegExp(from, "gi"), to), text);

/* ------------------------------------------------------------ narration first (fails fast) */
const voice = { voice: narration.voice, rate: narration.rate };
const ttsDir = path.join(TMP, "tts");
const say = (key, text) => ({ ...tts(text, ttsDir, { ...voice, key }), text });
const audio = { intro: say("intro", narration.intro.say), outro: say("outro", narration.outro.say), chapter: {}, scene: {} };
for (const c of chapters) if (narration.chapters[c.id]) audio.chapter[c.id] = say(`ch-${c.id}`, narration.chapters[c.id].say);
for (const s of scenes) {
  const n = narration.scenes[s.id];
  if (!n) throw new Error(`narration.json has no scene "${s.id}"`);
  audio.scene[s.id] = say(`sc-${s.id}`, n.say);
}
log(`narration ready: ${Object.keys(audio.scene).length} scenes`);

/* ------------------------------------------------------------ worker + demo state */
await workerJson("/health");
const demo = makeDemoMedia();
const leftovers = [path.join(SITE, ".capture-tmp/state.json"), STATE_FILE].filter(fs.existsSync).map((f) => JSON.parse(fs.readFileSync(f, "utf8")));
for (const st of leftovers) {
  for (const id of st.studioJobs ?? []) await fetch(`${WORKER}/studio/jobs/${id}`, { method: "DELETE" }).catch(() => {});
  for (const id of st.workerJobs ?? []) await fetch(`${WORKER}/jobs/${id}`, { method: "DELETE" }).catch(() => {});
  for (const id of st.studioProjects ?? []) await fetch(`${WORKER}/studio/projects/${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => {});
}
await purgeDemoJobs(demo.root, log);
fs.rmSync(demo.output, { recursive: true, force: true });
for (const d of ["Mixer", "Encode"]) fs.mkdirSync(path.join(demo.output, d), { recursive: true });
const before = {
  jobs: new Set((await workerJson("/jobs")).map((j) => j.id)),
  studio: new Set((await workerJson("/studio/jobs")).map((j) => j.id)),
  projects: new Set((await workerJson("/studio/projects")).map((p) => p.id)),
};

/* ------------------------------------------------------------ record */
// Own pool lease: the default key maps to 9990, which other sessions open and close mid-run.
process.env.STEALTH_AGENT_KEY ||= "p0010-guide-record";
const { page, close, profile, browser } = await openStealthPlaywrightPage({ viewport: { width: W, height: H } });
log(`stealth profile ${profile}`);
const marks = [];
const skipped = new Set();
let rec;
try {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: 1, mobile: false });
  await browser?.newBrowserCDPSession?.().then((b) => b.send("Browser.setDownloadBehavior", { behavior: "deny" })).catch(() => {});
  page.on("dialog", (d) => d.dismiss().catch(() => {}));
  page.on("load", () => applyCaptureCss(page));
  const pick = { files: [], directory: null };
  await installPickRoutes(page, pick, log);

  // Cursor-animated click/type that delegate to demo-flow's own actions (dispatch/paste/clear).
  const cursor = recordingCtx(page);
  const base = createActions(page, { pace: async () => {} });
  let lastAct = 0;
  const ctx = {
    page, base: BASE, demo, pick, state: {}, log,
    pace: (ms) => sleep(Math.max(250, ms * 1.6)),
    async click(target, opts = {}) {
      await cursor.moveTo(target).catch(() => {});
      await page.evaluate(() => window.__vl?.click()).catch(() => {});
      await base.click(target, { ...opts, pace: 0 });
      await sleep(opts.dispatch ? 500 : 420);
      await ensureOverlay(page).catch(() => {});
      lastAct = rec?.now() ?? 0;
    },
    async hover(target, opts = {}) {
      await cursor.moveTo(target).catch(() => {});
      await base.hover(target, { ...opts, pace: 0 });
      await sleep(900);
      lastAct = rec?.now() ?? 0;
    },
    async type(target, text, opts = {}) {
      await cursor.moveTo(target).catch(() => {});
      await base.type(target, text, { ...opts, delay: opts.paste ? 0 : 55 });
      await sleep(opts.paste ? 900 : 400);
      lastAct = rec?.now() ?? 0;
    },
  };

  await resetAppState(ctx);
  await page.goto(`${BASE}/studio`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  await applyCaptureCss(page);
  await cursor.card(true, narration.intro);
  await sleep(1200);

  rec = await startScreencast(page, path.join(TMP, "frames"), { width: W, height: H });
  const segment = async (kind, id, a, body) => {
    const m = { kind, id, a, start: rec.now() };
    lastAct = m.start;
    await body?.();
    const minEnd = m.start + a.duration + AUDIO_LEAD + 0.7;
    if (rec.now() < minEnd && kind !== "scene") await sleep((minEnd - rec.now()) * 1000);
    m.lastAct = Math.max(lastAct, m.start);
    m.end = rec.now();
    marks.push(m);
    log(`  ${kind} ${id}: ${(m.end - m.start).toFixed(1)}s (voice ${a.duration.toFixed(1)}s)`);
  };

  await segment("intro", "intro", audio.intro);
  for (const ch of chapters) {
    const chScenes = scenes.filter((s) => s.chapter === ch.id);
    if (!chScenes.length) continue;
    await cursor.card(true, { kicker: ch.kicker_vi, title: ch.title_vi, sub: ch.summary_vi, color: ch.color });
    await segment("chapter", ch.id, audio.chapter[ch.id] ?? say(`ch-${ch.id}`, ch.title_vi), async () => sleep(400));
    await cursor.card(false);
    await sleep(700);
    let k = 0;
    for (const scene of chScenes) {
      k += 1;
      const n = narration.scenes[scene.id];
      await segment("scene", scene.id, audio.scene[scene.id], async () => {
        await cursor.label(true, { n: `${ch.title_vi} · ${k}`, text: n.label, color: ch.color });
        await sleep(600);
        try {
          await scene.run(ctx);
          if (scene.after) await scene.after(ctx);
        } catch (err) {
          if (!scene.optional) throw new Error(`scene ${scene.id} failed: ${err.message}`);
          // Optional scene (Studio export): keep going; its segment is dropped in post.
          log(`  ⚠ optional scene ${scene.id} skipped: ${err.message}`);
          skipped.add(scene.id);
        }
        await sleep(500);
      });
      await cursor.label(false).catch(() => {});
    }
  }
  await cursor.card(true, narration.outro);
  await segment("outro", "outro", audio.outro, async () => sleep(400));
  await sleep(800);
} finally {
  var raw = rec ? await rec.stop() : null;
  const st = {
    at: new Date().toISOString(),
    workerJobs: (await workerJson("/jobs").catch(() => [])).map((j) => j.id).filter((id) => !before.jobs.has(id)),
    studioJobs: (await workerJson("/studio/jobs").catch(() => [])).map((j) => j.id).filter((id) => !before.studio.has(id)),
    studioProjects: (await workerJson("/studio/projects").catch(() => [])).map((p) => p.id).filter((id) => !before.projects.has(id)),
  };
  fs.writeFileSync(STATE_FILE, JSON.stringify(st, null, 2));
  await close();
}

/* ------------------------------------------------------------ post: raw → segment clips */
const rawMp4 = path.join(TMP, "raw.mp4");
framesToVideo(raw, rawMp4, { fps: FPS, width: W, height: H });
log(`raw ${probeDuration(rawMp4).toFixed(1)}s · ${raw.frames.length} frames`);

const clipsDir = path.join(TMP, "clips");
fs.rmSync(clipsDir, { recursive: true, force: true });
fs.mkdirSync(clipsDir, { recursive: true });

const clips = marks.filter((m) => !skipped.has(m.id)).map((m, i) => {
  const need = m.a.duration + AUDIO_LEAD + 0.7;
  const realEnd = Math.min(m.end, Math.max(m.start + 0.5, m.lastAct + 1.2));
  const realLen = realEnd - m.start;
  const waitLen = Math.max(0, m.end - realEnd);
  let waitOut = waitLen;
  if (realLen + waitLen > need + 1.0 && waitLen > 1.5) waitOut = Math.min(waitLen, Math.max(need - realLen, 1.2));
  const factor = waitOut > 0 ? waitLen / waitOut : 1;
  const len = realLen + waitOut;
  const pad = Math.max(0, need - len);
  const total = len + pad;
  const file = path.join(clipsDir, `${String(i).padStart(2, "0")}-${m.id}.mp4`);
  const fast = factor >= 1.6;
  const badge = fast
    ? `,drawbox=x=w-300:y=36:w=264:h=56:color=0x0a0c18@0.82:t=fill:enable='gte(t,${realLen.toFixed(3)})*lte(t,${len.toFixed(3)})',drawtext=fontfile='${FONT}':text='»  Tua nhanh ×${Math.round(factor)}':fontcolor=0xeceef7:fontsize=24:x=w-282:y=52:enable='gte(t,${realLen.toFixed(3)})*lte(t,${len.toFixed(3)})'`
    : "";
  const vParts = waitLen > 0.04
    ? `[0:v]trim=start=0:end=${realLen.toFixed(3)},setpts=PTS-STARTPTS[a];[0:v]trim=start=${realLen.toFixed(3)}:end=${(m.end - m.start).toFixed(3)},setpts=(PTS-STARTPTS)/${factor.toFixed(4)}[b];[a][b]concat=n=2:v=1:a=0,fps=${FPS}[c]`
    : `[0:v]trim=start=0:end=${(m.end - m.start).toFixed(3)},setpts=PTS-STARTPTS,fps=${FPS}[c]`;
  const filter = `${vParts};[c]tpad=stop_mode=clone:stop_duration=${pad.toFixed(3)}${badge}[v];[1:a]aresample=48000,adelay=${Math.round(AUDIO_LEAD * 1000)}:all=1,apad,atrim=0:${total.toFixed(3)}[au]`;
  ffmpeg(
    [
      "-ss", m.start.toFixed(3), "-t", (m.end - m.start + 0.05).toFixed(3), "-i", rawMp4,
      "-i", m.a.mp3,
      "-filter_complex", filter, "-map", "[v]", "-map", "[au]",
      "-t", total.toFixed(3),
      "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", "-r", String(FPS),
      "-c:a", "aac", "-b:a", "160k", "-ac", "2", "-ar", "48000",
      file,
    ],
    `clip ${m.id}`,
  );
  const dur = probeDuration(file);
  return { ...m, file, dur, factor, cues: parseSrt(m.a.srt).map((c) => ({ ...c, text: caption(c.text) })) };
});

/* ------------------------------------------------------------ assemble outputs */
function assemble(list, name, { chaptersVtt = false } = {}) {
  const listFile = path.join(TMP, `${name}.concat.txt`);
  fs.writeFileSync(listFile, list.map((c) => `file '${c.file.replace(/\\/g, "/")}'`).join("\n"));
  const out = path.join(OUT, `${name}.mp4`);
  ffmpeg(["-f", "concat", "-safe", "0", "-i", listFile, "-c", "copy", "-movflags", "+faststart", out], `assemble ${name}`);
  let at = 0;
  const cues = [];
  const chapterCues = [];
  for (const c of list) {
    for (const q of c.cues) cues.push({ start: at + AUDIO_LEAD + q.start, end: Math.min(at + c.dur, at + AUDIO_LEAD + q.end), text: q.text });
    if (c.kind === "intro") chapterCues.push({ start: at, text: "Giới thiệu" });
    if (c.kind === "chapter") chapterCues.push({ start: at, text: chapters.find((x) => x.id === c.id)?.title_vi ?? c.id });
    if (c.kind === "outro") chapterCues.push({ start: at, text: "Tải về" });
    at += c.dur;
  }
  writeVtt(path.join(OUT, `${name}.vi.vtt`), cues);
  if (name === "tutorial") writeSrt(path.join(OUT, `${name}.vi.srt`), cues);
  if (chaptersVtt) writeVtt(path.join(OUT, `${name}.chapters.vtt`), chapterCues.map((c, i) => ({ ...c, end: chapterCues[i + 1]?.start ?? at })));
  const size = (fs.statSync(out).size / 1024 / 1024).toFixed(1);
  log(`✓ ${path.relative(SITE, out)} ${at.toFixed(1)}s ${size} MB`);
  return { out, duration: at, chapters: chapterCues };
}

const full = assemble(clips, "tutorial", { chaptersVtt: true });
const perChapter = {};
for (const ch of chapters) {
  const own = clips.filter((c) => (c.kind === "chapter" && c.id === ch.id) || (c.kind === "scene" && scenes.find((s) => s.id === c.id)?.chapter === ch.id));
  if (own.length > 1) perChapter[ch.id] = assemble(own, ch.id);
}

// Poster frame for the full video: the finished Mixer screen.
const doneClip = clips.find((c) => c.id === "mixer-done");
if (doneClip) ffmpeg(["-sseof", "-1.5", "-i", doneClip.file, "-frames:v", "1", "-q:v", "3", path.join(OUT, "tutorial-poster.jpg")], "poster");

fs.writeFileSync(
  path.join(OUT, "tutorial.json"),
  JSON.stringify({ at: new Date().toISOString(), duration: full.duration, chapters: full.chapters, perChapter: Object.fromEntries(Object.entries(perChapter).map(([k, v]) => [k, v.duration])), segments: clips.map((c) => ({ kind: c.kind, id: c.id, dur: +c.dur.toFixed(2), speedup: +c.factor.toFixed(2) })) }, null, 2),
);
if (!args.includes("--keep")) fs.rmSync(path.join(TMP, "frames"), { recursive: true, force: true });
log(`done in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
