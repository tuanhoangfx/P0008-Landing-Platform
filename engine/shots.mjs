/** 1600w WebP variants of every 2x shot (pages reference `<shot>-1600.webp` via srcset). */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { FFMPEG } from "./recorder/media.mjs";

export function makeShotVariants(shotsDir) {
  if (!fs.existsSync(shotsDir)) return 0;
  if (!fs.existsSync(FFMPEG)) throw new Error(`ffmpeg not found at ${FFMPEG}`);
  const shots = fs.readdirSync(shotsDir).filter((f) => f.endsWith(".webp") && !f.endsWith("-1600.webp"));
  for (const f of shots) {
    const out = path.join(shotsDir, f.replace(/\.webp$/, "-1600.webp"));
    spawnSync(FFMPEG, ["-y", "-loglevel", "error", "-i", path.join(shotsDir, f), "-vf", "scale=1600:-2:flags=lanczos", "-c:v", "libwebp", "-quality", "82", out], { windowsHide: true });
  }
  return shots.length;
}
