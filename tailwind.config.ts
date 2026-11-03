import { realpathSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Config } from "tailwindcss";

const rawRootDir =
  typeof __dirname !== "undefined" ? __dirname : path.dirname(fileURLToPath(import.meta.url));
const rootDir = (realpathSync.native ?? realpathSync)(rawRootDir);
const rel = (p: string) => path.resolve(rootDir, p).replace(/\\/g, "/");

/** Admin app (src/) + hub-ui sources. Never sites/ or templates/ — those are engine-rendered. */
export default {
  content: [rel("./index.html"), rel("./src/**/*.{ts,tsx}"), rel("../../packages/hub-ui/src/**/*.{ts,tsx}")],
  darkMode: "class",
  theme: { extend: {} },
  plugins: [],
} satisfies Config;
