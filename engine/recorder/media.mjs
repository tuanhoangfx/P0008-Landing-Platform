/**
 * Media helpers for the tutorial recorder: FFmpeg/ffprobe from the P0010 worker (the one
 * bundled copy — no system install), edge-tts narration, CDP screencast capture.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// The workspace keeps one FFmpeg: P0006's worker/bin (VIDEO_LAB_FFMPEG overrides).
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const toolRoot = path.resolve(__dirname, "../../..");
const ffBin = process.env.VIDEO_LAB_FFMPEG ? path.dirname(process.env.VIDEO_LAB_FFMPEG) : path.join(toolRoot, "P0006-Video-Lab/worker/bin");
export const FFMPEG = path.join(ffBin, "ffmpeg.exe");
export const FFPROBE = path.join(ffBin, "ffprobe.exe");
export const DEFAULT_BGM_P0001 = path.join(__dirname, "assets", "bgm-p0001.mp3");

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

const ELEVENLABS_POOL_PATH = path.join(toolRoot, "P0006-Video-Lab/data/studio_elevenlabs_pool.json");
let cachedElevenLabsKeys = null;
let elevenLabsKeyCursor = 0;

function getElevenLabsPoolKeys() {
  if (cachedElevenLabsKeys && cachedElevenLabsKeys.length > 0) return cachedElevenLabsKeys;
  if (process.env.ELEVENLABS_API_KEY) {
    cachedElevenLabsKeys = [process.env.ELEVENLABS_API_KEY.trim()];
    return cachedElevenLabsKeys;
  }
  if (!fs.existsSync(ELEVENLABS_POOL_PATH)) {
    throw new Error(`ElevenLabs pool file not found at ${ELEVENLABS_POOL_PATH}`);
  }
  const raw = JSON.parse(fs.readFileSync(ELEVENLABS_POOL_PATH, "utf8"));
  const entries = Array.isArray(raw?.entries) ? raw.entries : [];
  cachedElevenLabsKeys = entries
    .filter(
      (e) =>
        e &&
        e.xi_api_key &&
        e.status === "active" &&
        !e.disabled &&
        String(e.tier || "free").toLowerCase() === "free" &&
        e.allow_ecosystem_pool !== false &&
        Number(e.remaining_chars ?? 1000) > 250,
    )
    .sort((a, b) => Number(b.remaining_chars ?? 0) - Number(a.remaining_chars ?? 0))
    .map((e) => String(e.xi_api_key).trim());
  if (!cachedElevenLabsKeys.length) {
    throw new Error("No active xi_api_key found in studio_elevenlabs_pool.json");
  }
  return cachedElevenLabsKeys;
}

/**
 * Narrate one line with ElevenLabs Multilingual/Flash v2.5 using the P0006/P0020 key pool.
 * Cached by text + voiceId + settings so re-recording does not re-hit the API.
 * Returns { mp3, srt, duration }.
 */
export async function ttsElevenLabs(
  text,
  outDir,
  {
    voiceId = "21m00Tcm4TlvDq8ikWAM",
    modelId = "eleven_flash_v2_5",
    languageCode = "vi",
    stability = 0.48,
    similarityBoost = 0.82,
    style = 0.35,
    speed = 1.15,
    tempo = 1.18,
    key,
  } = {},
) {
  fs.mkdirSync(outDir, { recursive: true });
  const cleanVoiceId = String(voiceId).replace(/^elevenlabs:/i, "").trim();
  const sig = `11labs|${cleanVoiceId}|${modelId}|${languageCode}|${stability}|${similarityBoost}|${style}|${speed}|${tempo}|${text}`;
  const id = key ?? Buffer.from(sig).toString("base64url").slice(0, 40);
  const mp3 = path.join(outDir, `${id}.mp3`);
  const srt = path.join(outDir, `${id}.srt`);
  const stamp = path.join(outDir, `${id}.txt`);
  const fresh =
    fs.existsSync(mp3) &&
    fs.statSync(mp3).size > 1000 &&
    fs.existsSync(stamp) &&
    fs.readFileSync(stamp, "utf8") === sig;

  if (!fresh) {
    const keys = getElevenLabsPoolKeys();
    let lastErr = null;
    let success = false;
    const rawMp3 = `${mp3}.raw.mp3`;
    for (let attempt = 0; attempt < Math.min(12, keys.length); attempt++) {
      const apiKey = keys[(elevenLabsKeyCursor + attempt) % keys.length];
      try {
        const res = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(cleanVoiceId)}?output_format=mp3_44100_128`,
          {
            method: "POST",
            headers: {
              "xi-api-key": apiKey,
              "Content-Type": "application/json",
              Accept: "audio/mpeg",
            },
            body: JSON.stringify({
              text,
              model_id: modelId,
              ...(languageCode ? { language_code: languageCode } : {}),
              voice_settings: {
                stability,
                similarity_boost: similarityBoost,
                style,
                speed,
                use_speaker_boost: true,
              },
            }),
          },
        );
        if (!res.ok) {
          const errText = await res.text().catch(() => "");
          lastErr = new Error(`ElevenLabs HTTP ${res.status}: ${errText.slice(0, 240)}`);
          continue;
        }
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length < 1000) {
          lastErr = new Error(`ElevenLabs audio payload too small (${buf.length}B)`);
          continue;
        }
        fs.writeFileSync(rawMp3, buf);
        const af = [
          "silenceremove=start_periods=1:start_silence=0.04:start_threshold=-40dB:stop_periods=-1:stop_silence=0.22:stop_threshold=-40dB",
          ...(tempo && Math.abs(tempo - 1) > 0.01 ? [`atempo=${Number(tempo).toFixed(3)}`] : []),
        ].join(",");
        ffmpeg(["-i", rawMp3, "-af", af, "-c:a", "libmp3lame", "-b:a", "160k", mp3], "11labs-post");
        fs.rmSync(rawMp3, { force: true });
        fs.writeFileSync(stamp, sig);
        elevenLabsKeyCursor = (elevenLabsKeyCursor + attempt) % keys.length;
        success = true;
        break;
      } catch (err) {
        lastErr = err;
      }
    }
    if (!success) {
      throw lastErr || new Error(`ElevenLabs TTS failed for voice ${cleanVoiceId}`);
    }
  }
  const duration = probeDuration(mp3);
  writeSrt(srt, [{ start: 0, end: duration, text }]);
  return { mp3, srt, duration };
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

/**
 * Generates a crisp dual-transient UI mouse click sound effect WAV (`ui-click-sfx.wav`)
 * using FFmpeg lavfi aevalsrc (high-attack 2.15kHz + 3.85kHz woody click + micro-snap at 26ms).
 */
export function ensureUiClickSfx(workDir) {
  fs.mkdirSync(workDir, { recursive: true });
  const clickWavPath = path.join(workDir, "ui-click-sfx.wav");
  if (fs.existsSync(clickWavPath) && fs.statSync(clickWavPath).size > 200) return clickWavPath;
  const expr =
    "0.58*exp(-t*190)*sin(2*PI*2150*t)+0.35*exp(-t*280)*sin(2*PI*3850*t)+0.28*gte(t,0.026)*exp(-(t-0.026)*230)*sin(2*PI*2900*(t-0.026))";
  ffmpeg(
    [
      "-f", "lavfi", "-i", `aevalsrc='${expr}':s=48000:d=0.085`,
      "-af", "highpass=f=300,lowpass=f=9500,aformat=sample_rates=48000:channel_layouts=stereo",
      "-ar", "48000", "-ac", "2", "-c:a", "pcm_s16le",
      clickWavPath,
    ],
    "ui-click-sfx",
  );
  return clickWavPath;
}

/**
 * Mixes a narrated video (`videoWithVoicePath`) with tactile UI click sound effects (`clickOffsetsSec`)
 * and P0001 background music (`bgmAudioPath`) using sidechain ducking (`sidechaincompress`)
 * so music swells during visual transitions and ducks cleanly under speech.
 */
export function mixVideoWithBgmAndClicks({
  videoWithVoicePath,
  outMp4Path,
  bgmAudioPath = DEFAULT_BGM_P0001,
  clickOffsetsSec = [],
  totalDurationSec,
  bgmVolume = 0.25,
  workDir = path.dirname(outMp4Path),
}) {
  const dur = totalDurationSec ?? probeDuration(videoWithVoicePath);
  const fadeOutStart = Math.max(0.8, dur - 2.0);
  const hasBgm = bgmAudioPath && fs.existsSync(bgmAudioPath);
  const clickWav = clickOffsetsSec.length ? ensureUiClickSfx(workDir) : null;

  if (!hasBgm && !clickWav) {
    if (videoWithVoicePath !== outMp4Path) fs.copyFileSync(videoWithVoicePath, outMp4Path);
    return outMp4Path;
  }

  const inputs = ["-i", videoWithVoicePath];
  let nextIdx = 1;
  let bgmIdx = -1;
  if (hasBgm) {
    inputs.push("-stream_loop", "-1", "-i", bgmAudioPath);
    bgmIdx = nextIdx++;
  }

  const clickLabels = [];
  const clickFilters = [];
  if (clickWav) {
    clickOffsetsSec.forEach((sec, idx) => {
      const ms = Math.max(10, Math.round(sec * 1000));
      inputs.push("-i", clickWav);
      const inIdx = nextIdx++;
      const lbl = `[clk${idx}]`;
      clickFilters.push(`[${inIdx}:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=0.65,adelay=${ms}|${ms}${lbl}`);
      clickLabels.push(lbl);
    });
  }

  const filterParts = [];
  // Master voice track (highpass + presence + gentle compressor)
  filterParts.push(
    `[0:a]aformat=sample_rates=48000:channel_layouts=stereo,highpass=f=85,equalizer=f=3100:width_type=o:width=1.4:g=2.4,acompressor=threshold=-18dB:ratio=2.4:attack=8:release=120:makeup=2dB,volume=1.15[vo_clean]`,
  );

  let voicePlusClicks = "[vo_clean]";
  if (clickLabels.length) {
    filterParts.push(...clickFilters);
    filterParts.push(
      `[vo_clean]${clickLabels.join("")}amix=inputs=${1 + clickLabels.length}:duration=first:dropout_transition=0:normalize=0[vo_sfx]`,
    );
    voicePlusClicks = "[vo_sfx]";
  }

  if (hasBgm) {
    filterParts.push(`${voicePlusClicks}asplit=2[vo_main][vo_sc]`);
    filterParts.push(
      `[${bgmIdx}:a]aformat=sample_rates=48000:channel_layouts=stereo,afade=t=in:st=0:d=1.0,afade=t=out:st=${fadeOutStart.toFixed(2)}:d=1.8,volume=${bgmVolume.toFixed(3)}[bgm_raw]`,
    );
    filterParts.push(
      `[bgm_raw][vo_sc]sidechaincompress=threshold=0.022:ratio=4.5:attack=30:release=400:makeup=1[bgm_ducked]`,
    );
    filterParts.push(
      `[vo_main][bgm_ducked]amix=inputs=2:duration=first:dropout_transition=0:normalize=0,alimiter=limit=0.96[aout]`,
    );
  } else {
    filterParts.push(`${voicePlusClicks}alimiter=limit=0.96[aout]`);
  }

  const tmpOut = videoWithVoicePath === outMp4Path ? `${outMp4Path}.bgm-tmp.mp4` : outMp4Path;
  ffmpeg(
    [
      ...inputs,
      "-filter_complex", filterParts.join(";"),
      "-map", "0:v",
      "-map", "[aout]",
      "-t", dur.toFixed(3),
      "-c:v", "copy",
      "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
      "-movflags", "+faststart",
      tmpOut,
    ],
    "mixVideoWithBgmAndClicks",
  );
  if (tmpOut !== outMp4Path) fs.renameSync(tmpOut, outMp4Path);
  return outMp4Path;
}

