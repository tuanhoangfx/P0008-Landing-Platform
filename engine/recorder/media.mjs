/**
 * Media helpers for the tutorial recorder: FFmpeg/ffprobe from the P0010 worker (the one
 * bundled copy — no system install), edge-tts narration, CDP screencast capture.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// The workspace keeps one FFmpeg: P0010's worker/bin (VIDEO_LAB_FFMPEG overrides).
const toolRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const ffBin = process.env.VIDEO_LAB_FFMPEG ? path.dirname(process.env.VIDEO_LAB_FFMPEG) : path.join(toolRoot, "P0010-Video-Lab/worker/bin");
export const FFMPEG = path.join(ffBin, "ffmpeg.exe");
export const FFPROBE = path.join(ffBin, "ffprobe.exe");

export function ffmpeg(args, label = "ffmpeg") {
  const r = spawnSync(FFMPEG, ["-y", "-hide_banner", "-loglevel", "error", ...args], { encoding: "utf8", windowsHide: true, maxBuffer: 1 << 26 });
  if (r.status !== 0) throw new Error(`${label} failed: ${(r.stderr || "").slice(-1500)}`);
}

export function probeDuration(file) {
  const r = spawnSync(FFPROBE, ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file], { encoding: "utf8", windowsHide: true });
  const d = Number(String(r.stdout).trim());
  if (!Number.isFinite(d)) throw new Error(`ffprobe: no duration for ${file}`);
  return d;
}

/**
 * Narrate one line with edge-tts (Python CLI). Cached by text+voice so re-recording a
 * chapter does not re-hit the TTS service. Returns { mp3, srt, duration }.
 */
export function tts(text, outDir, { voice = "vi-VN-HoaiMyNeural", rate = "+4%", key }) {
  fs.mkdirSync(outDir, { recursive: true });
  const id = key ?? Buffer.from(`${voice}|${rate}|${text}`).toString("base64url").slice(0, 40);
  const mp3 = path.join(outDir, `${id}.mp3`);
  const srt = path.join(outDir, `${id}.srt`);
  const stamp = path.join(outDir, `${id}.txt`);
  const fresh = fs.existsSync(mp3) && fs.existsSync(stamp) && fs.readFileSync(stamp, "utf8") === `${voice}|${rate}|${text}`;
  if (!fresh) {
    for (let attempt = 1; ; attempt++) {
      const r = spawnSync(
        "python",
        ["-m", "edge_tts", "--voice", voice, `--rate=${rate}`, "--text", text, "--write-media", mp3, "--write-subtitles", srt],
        { encoding: "utf8", windowsHide: true },
      );
      if (r.status === 0 && fs.statSync(mp3).size > 1000) break;
      if (attempt >= 3) throw new Error(`edge-tts failed (${voice}): ${(r.stderr || "").slice(-400)}`);
    }
    fs.writeFileSync(stamp, `${voice}|${rate}|${text}`);
  }
  return { mp3, srt, duration: probeDuration(mp3) };
}

/** Parse an edge-tts SRT into [{ start, end, text }] seconds. */
export function parseSrt(file) {
  if (!fs.existsSync(file)) return [];
  const t = (s) => {
    const [h, m, rest] = s.split(":");
    return Number(h) * 3600 + Number(m) * 60 + Number(rest.replace(",", "."));
  };
  return fs
    .readFileSync(file, "utf8")
    .split(/\r?\n\r?\n/)
    .map((block) => block.trim().split(/\r?\n/))
    .filter((l) => l.length >= 3 && l[1].includes("-->"))
    .map((l) => {
      const [a, b] = l[1].split("-->").map((x) => x.trim());
      return { start: t(a), end: t(b), text: l.slice(2).join(" ") };
    });
}

const vttTime = (s) => {
  const ms = Math.max(0, Math.round(s * 1000));
  const h = String(Math.floor(ms / 3600000)).padStart(2, "0");
  const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2, "0");
  const sec = String(Math.floor((ms % 60000) / 1000)).padStart(2, "0");
  return `${h}:${m}:${sec}.${String(ms % 1000).padStart(3, "0")}`;
};

export function writeVtt(file, cues) {
  fs.writeFileSync(file, `WEBVTT\n\n${cues.map((c, i) => `${i + 1}\n${vttTime(c.start)} --> ${vttTime(c.end)}\n${c.text}\n`).join("\n")}`);
}

export function writeSrt(file, cues) {
  const t = (s) => vttTime(s).replace(".", ",");
  fs.writeFileSync(file, cues.map((c, i) => `${i + 1}\n${t(c.start)} --> ${t(c.end)}\n${c.text}\n`).join("\n"));
}

/**
 * CDP screencast → JPEG frames with wall-clock timestamps. Chrome only emits a frame when
 * the screen changes, so `toVideo` rebuilds constant frame rate from those timestamps.
 */
export async function startScreencast(page, dir, { width, height, quality = 90 } = {}) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const cdp = await page.context().newCDPSession(page);
  const frames = [];
  let pending = Promise.resolve();
  cdp.on("Page.screencastFrame", ({ data, metadata, sessionId }) => {
    const file = path.join(dir, `f${String(frames.length).padStart(6, "0")}.jpg`);
    frames.push({ file, t: metadata.timestamp });
    pending = pending.then(() => fs.promises.writeFile(file, Buffer.from(data, "base64")));
    cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
  });
  await cdp.send("Page.startScreencast", { format: "jpeg", quality, maxWidth: width, maxHeight: height, everyNthFrame: 1 });
  const t0 = Date.now() / 1000;
  return {
    t0,
    /** Seconds since recording began (same clock as frame timestamps). */
    now: () => Date.now() / 1000 - t0,
    async stop() {
      const tEnd = Date.now() / 1000;
      await cdp.send("Page.stopScreencast").catch(() => {});
      await pending;
      await cdp.detach().catch(() => {});
      return { frames, t0, tEnd };
    },
  };
}

/** Frames + timestamps → CFR H.264 (no audio). Leading gap is filled by the first frame. */
export function framesToVideo({ frames, t0, tEnd }, out, { fps = 30, width = 1920, height = 1080 } = {}) {
  if (!frames.length) throw new Error("screencast produced no frames");
  const list = path.join(path.dirname(frames[0].file), "frames.txt");
  const lines = ["ffconcat version 1.0"];
  frames.forEach((f, i) => {
    const start = i === 0 ? t0 : f.t;
    const end = frames[i + 1]?.t ?? tEnd;
    lines.push(`file '${path.basename(f.file)}'`, `duration ${Math.max(0.001, end - start).toFixed(4)}`);
  });
  lines.push(`file '${path.basename(frames.at(-1).file)}'`);
  fs.writeFileSync(list, lines.join("\n"));
  ffmpeg(
    [
      "-f", "concat", "-safe", "0", "-i", list,
      "-vf", `scale=${width}:${height}:flags=lanczos,format=yuv420p,fps=${fps}`,
      "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-movflags", "+faststart", out,
    ],
    "frames→video",
  );
  return out;
}
