#!/usr/bin/env node
/**
 * Generate neutral, copyright-free demo media for the Video Lab guide screenshots.
 *
 *   node site/scripts/make-demo-media.mjs [--force] [--mirror D:\VideoLabDemo] [--no-mirror]
 *
 * Output (gitignored):  site/.demo/{Intro,Main,Outro,Images}/… + script.vi.txt + manifest.json
 * Mirror (default D:\VideoLabDemo, else C:\VideoLabDemo): same tree, so the app only ever shows
 * neutral paths (no user profile folder) in tables / tooltips.
 *
 * All clips share ONE encode recipe (1080x1920 · 30 fps · H.264 High · AAC 48k stereo) so the
 * Mixer Prefight sees a single fingerprint cluster and mixes with stream copy.
 * Idempotent: existing files are skipped unless --force.
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.resolve(__dirname, "..");
const APP = path.resolve(SITE, "..");
const FFMPEG = process.env.VIDEO_LAB_FFMPEG || path.join(APP, "worker", "bin", "ffmpeg.exe");
const OUT = path.join(SITE, ".demo");

const args = process.argv.slice(2);
const FORCE = args.includes("--force");
const NO_MIRROR = args.includes("--no-mirror");
const argVal = (k) => (args.includes(k) ? args[args.indexOf(k) + 1] : undefined);

export function defaultMirrorRoot() {
  if (process.env.VIDEO_LAB_DEMO_ROOT) return process.env.VIDEO_LAB_DEMO_ROOT;
  return fs.existsSync("D:\\") ? "D:\\VideoLabDemo" : "C:\\VideoLabDemo";
}
const MIRROR = NO_MIRROR ? null : argVal("--mirror") || defaultMirrorRoot();

// Bold Segoe UI ships with every Windows 10/11; fall back to Arial Bold.
const FONT_CANDIDATES = ["C:/Windows/Fonts/segoeuib.ttf", "C:/Windows/Fonts/arialbd.ttf"];
const FONT_BOLD = FONT_CANDIDATES.find((f) => fs.existsSync(f));
const FONT_REG = ["C:/Windows/Fonts/segoeui.ttf", "C:/Windows/Fonts/arial.ttf"].find((f) => fs.existsSync(f));
if (!FONT_BOLD || !FONT_REG) throw new Error("No usable Windows font found (segoeuib/arialbd)");
/** Filtergraph-escape a Windows font path: C:/x → 'C\:/x' */
const ff = (p) => `'${p.replace(/\\/g, "/").replace(/:/g, "\\:")}'`;

const W = 1080;
const H = 1920;
const FPS = 30;

/** Shared encode recipe — identical SPS/PPS across every clip (one Prefight cluster). */
const ENC = [
  "-c:v", "libx264", "-preset", "veryfast", "-profile:v", "high", "-level", "4.1",
  "-pix_fmt", "yuv420p", "-r", String(FPS), "-g", String(FPS * 2), "-keyint_min", String(FPS * 2),
  "-sc_threshold", "0", "-bf", "2", "-crf", "20",
  "-c:a", "aac", "-b:a", "128k", "-ar", "48000", "-ac", "2",
  "-map_metadata", "-1", "-fflags", "+bitexact", "-flags:v", "+bitexact", "-flags:a", "+bitexact",
  "-movflags", "+faststart",
];

/** name, label, sub, colors, seconds, chord (Hz), dir */
const CLIPS = [
  { dir: "Intro", file: "intro-a.mp4", label: "INTRO A", sub: "Video Lab · demo", c: ["0x0f172a", "0x4f46e5", "0x06b6d4"], d: 4, hz: [261.6, 329.6, 392.0] },
  { dir: "Intro", file: "intro-b.mp4", label: "INTRO B", sub: "Video Lab · demo", c: ["0x1e1b4b", "0xdb2777", "0xf59e0b"], d: 3, hz: [293.7, 370.0, 440.0] },
  { dir: "Main", file: "main-01.mp4", label: "MAIN 01", sub: "Sunrise", c: ["0xf97316", "0xfacc15", "0xfb7185"], d: 5, hz: [220.0, 277.2, 329.6] },
  { dir: "Main", file: "main-02.mp4", label: "MAIN 02", sub: "Ocean", c: ["0x0ea5e9", "0x14b8a6", "0x1e3a8a"], d: 6, hz: [246.9, 311.1, 370.0] },
  { dir: "Main", file: "main-03.mp4", label: "MAIN 03", sub: "Forest", c: ["0x166534", "0x22c55e", "0xa3e635"], d: 4, hz: [196.0, 246.9, 293.7] },
  { dir: "Main", file: "main-04.mp4", label: "MAIN 04", sub: "City night", c: ["0x312e81", "0x7c3aed", "0xec4899"], d: 7, hz: [174.6, 220.0, 261.6] },
  { dir: "Main", file: "main-05.mp4", label: "MAIN 05", sub: "Desert", c: ["0xb45309", "0xf59e0b", "0xfde68a"], d: 8, hz: [233.1, 293.7, 349.2] },
  { dir: "Main", file: "main-06.mp4", label: "MAIN 06", sub: "Aurora", c: ["0x064e3b", "0x10b981", "0x8b5cf6"], d: 5, hz: [207.7, 261.6, 311.1] },
  { dir: "Outro", file: "outro-a.mp4", label: "OUTRO A", sub: "Thanks for watching", c: ["0x111827", "0x6366f1", "0x22d3ee"], d: 3, hz: [261.6, 329.6, 392.0] },
  { dir: "Outro", file: "outro-b.mp4", label: "OUTRO B", sub: "See you next time", c: ["0x18181b", "0xf43f5e", "0xa855f7"], d: 3, hz: [220.0, 261.6, 329.6] },
];

const IMAGES = [
  { file: "scene-01.png", label: "01", title: "Lên ý tưởng", c: ["0x1e3a8a", "0x6366f1", "0x22d3ee"] },
  { file: "scene-02.png", label: "02", title: "Viết kịch bản", c: ["0x7c2d12", "0xf97316", "0xfacc15"] },
  { file: "scene-03.png", label: "03", title: "Chọn giọng đọc", c: ["0x14532d", "0x22c55e", "0x99f6e4"] },
  { file: "scene-04.png", label: "04", title: "Dựng cảnh", c: ["0x4c1d95", "0xa855f7", "0xf472b6"] },
  { file: "scene-05.png", label: "05", title: "Ghép video", c: ["0x0c4a6e", "0x0ea5e9", "0xa5f3fc"] },
  { file: "scene-06.png", label: "06", title: "Xuất bản", c: ["0x881337", "0xf43f5e", "0xfda4af"] },
];

export const SCRIPT_VI = [
  "Bạn có một ý tưởng hay nhưng ngại dựng video? Video Lab giúp bạn làm nhanh hơn.",
  "Đầu tiên, viết kịch bản ngắn gọn, mỗi câu tương ứng một cảnh.",
  "Tiếp theo, chọn giọng đọc tiếng Việt tự nhiên và chỉnh tốc độ cho vừa nhịp.",
  "Kéo ảnh vào dòng thời gian, mỗi ảnh là một cảnh với hiệu ứng chuyển mượt mà.",
  "Sau đó ghép intro, nội dung chính và outro thành hàng loạt video chỉ với một nút bấm.",
  "Cuối cùng, xuất video dọc chuẩn để đăng lên mạng xã hội. Chúc bạn sáng tạo vui vẻ!",
].join("\n");

function run(argv, label) {
  const r = spawnSync(FFMPEG, ["-hide_banner", "-loglevel", "error", "-y", ...argv], {
    encoding: "utf8",
    windowsHide: true,
    maxBuffer: 16 * 1024 * 1024,
  });
  if (r.status !== 0) throw new Error(`ffmpeg failed (${label}): ${r.stderr || r.error}`);
}

function gradientSrc(colors, seconds, seed) {
  const cs = colors.map((c, i) => `c${i}=${c}`).join(":");
  return `gradients=s=${W}x${H}:${cs}:nb_colors=${colors.length}:speed=0.015:seed=${seed}:r=${FPS}:d=${seconds}`;
}

function textFile(tmpDir, name, text) {
  const p = path.join(tmpDir, name);
  fs.writeFileSync(p, text, "utf8");
  return p;
}

function makeClip(clip, idx, tmpDir, dest) {
  const labelTxt = textFile(tmpDir, `${clip.file}.label.txt`, clip.label);
  const subTxt = textFile(tmpDir, `${clip.file}.sub.txt`, clip.sub);
  const vf = [
    // soft vignette band behind the label
    `drawbox=x=0:y=ih/2-260:w=iw:h=520:color=black@0.22:t=fill`,
    `drawtext=fontfile=${ff(FONT_BOLD)}:textfile=${ff(labelTxt)}:fontsize=168:fontcolor=white:` +
      `shadowcolor=black@0.45:shadowx=0:shadowy=8:x=(w-tw)/2:y=(h/2)-th+10`,
    `drawtext=fontfile=${ff(FONT_REG)}:textfile=${ff(subTxt)}:fontsize=64:fontcolor=white@0.88:` +
      `x=(w-tw)/2:y=(h/2)+70`,
    // progress bar along the bottom so motion is visible in previews
    `drawbox=x=0:y=ih-36:w=iw*t/${clip.d}:h=36:color=white@0.55:t=fill`,
    `fade=t=in:st=0:d=0.4`,
  ].join(",");
  const [a, b, c] = clip.hz;
  const aexpr = `0.08*sin(2*PI*${a}*t)+0.06*sin(2*PI*${b}*t)+0.05*sin(2*PI*${c}*t)`;
  run(
    [
      "-f", "lavfi", "-i", gradientSrc(clip.c, clip.d, 11 + idx),
      "-f", "lavfi", "-i", `aevalsrc='${aexpr}|${aexpr}':s=48000:d=${clip.d}`,
      "-vf", vf,
      "-af", `afade=t=in:st=0:d=0.3,afade=t=out:st=${clip.d - 0.4}:d=0.4`,
      "-t", String(clip.d),
      ...ENC,
      dest,
    ],
    clip.file,
  );
}

function makeImage(img, idx, tmpDir, dest) {
  const labelTxt = textFile(tmpDir, `${img.file}.label.txt`, img.label);
  const titleTxt = textFile(tmpDir, `${img.file}.title.txt`, img.title);
  const sceneTxt = textFile(tmpDir, `${img.file}.scene.txt`, `Cảnh ${img.label}`);
  // Key content sits in the vertical middle so wide library thumbnails (object-cover) still read.
  const vf = [
    `drawtext=fontfile=${ff(FONT_BOLD)}:textfile=${ff(labelTxt)}:fontsize=520:fontcolor=white@0.16:x=(w-tw)/2:y=h*0.12`,
    `drawbox=x=0:y=ih/2-150:w=iw:h=300:color=black@0.28:t=fill`,
    `drawtext=fontfile=${ff(FONT_BOLD)}:textfile=${ff(titleTxt)}:fontsize=120:fontcolor=white:` +
      `shadowcolor=black@0.4:shadowx=0:shadowy=6:x=(w-tw)/2:y=(h-th)/2`,
    `drawtext=fontfile=${ff(FONT_REG)}:textfile=${ff(sceneTxt)}:fontsize=60:fontcolor=white@0.85:x=(w-tw)/2:y=h*0.72`,
  ].join(",");
  run(
    ["-f", "lavfi", "-i", gradientSrc(img.c, 1, 101 + idx), "-vf", vf, "-frames:v", "1", "-update", "1", dest],
    img.file,
  );
}

function copyTree(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    if (ent.name.startsWith(".")) continue;
    const s = path.join(src, ent.name);
    const d = path.join(dst, ent.name);
    if (ent.isDirectory()) copyTree(s, d);
    else if (FORCE || !fs.existsSync(d) || fs.statSync(d).size !== fs.statSync(s).size) fs.copyFileSync(s, d);
  }
}

export function demoManifest(root = MIRROR || OUT) {
  const j = (...p) => path.join(root, ...p);
  return {
    root,
    intro: CLIPS.filter((c) => c.dir === "Intro").map((c) => j("Intro", c.file)),
    main: CLIPS.filter((c) => c.dir === "Main").map((c) => j("Main", c.file)),
    outro: CLIPS.filter((c) => c.dir === "Outro").map((c) => j("Outro", c.file)),
    images: IMAGES.map((i) => j("Images", i.file)),
    script: j("script.vi.txt"),
    output: j("Output"),
  };
}

function main() {
  if (!fs.existsSync(FFMPEG)) throw new Error(`FFmpeg not found: ${FFMPEG}`);
  const tmpDir = path.join(OUT, ".tmp");
  for (const d of ["Intro", "Main", "Outro", "Images"]) fs.mkdirSync(path.join(OUT, d), { recursive: true });
  fs.mkdirSync(tmpDir, { recursive: true });
  let made = 0;
  let skipped = 0;
  const t0 = Date.now();
  CLIPS.forEach((clip, i) => {
    const dest = path.join(OUT, clip.dir, clip.file);
    if (!FORCE && fs.existsSync(dest) && fs.statSync(dest).size > 0) return void skipped++;
    makeClip(clip, i, tmpDir, dest);
    made++;
    console.log(`[demo] clip ${clip.dir}/${clip.file} (${clip.d}s)`);
  });
  IMAGES.forEach((img, i) => {
    const dest = path.join(OUT, "Images", img.file);
    if (!FORCE && fs.existsSync(dest) && fs.statSync(dest).size > 0) return void skipped++;
    makeImage(img, i, tmpDir, dest);
    made++;
    console.log(`[demo] image Images/${img.file}`);
  });
  fs.writeFileSync(path.join(OUT, "script.vi.txt"), SCRIPT_VI + "\n", "utf8");
  fs.rmSync(tmpDir, { recursive: true, force: true });
  if (MIRROR) {
    copyTree(OUT, MIRROR);
    fs.mkdirSync(path.join(MIRROR, "Output"), { recursive: true });
  }
  const manifest = demoManifest(MIRROR || OUT);
  fs.writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  console.log(
    `[demo] done made=${made} skipped=${skipped} in ${((Date.now() - t0) / 1000).toFixed(1)}s → ${OUT}` +
      (MIRROR ? ` (mirror ${MIRROR})` : ""),
  );
  return manifest;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
export { main as makeDemoMedia };
