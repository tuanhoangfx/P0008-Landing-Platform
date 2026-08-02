#!/usr/bin/env node
/** List LadiCDN image URLs from saved hanashop HTML vs config. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const toolRoot = path.resolve(__dirname, "..");
const htmlPath =
  process.argv[2] ||
  path.resolve(toolRoot, "../../.cursor/scratch/hanashop-landing.html");
const configPath = path.join(toolRoot, "src/config/products/toc-duoi-ngua-han-quoc.ts");

const html = fs.readFileSync(htmlPath, "utf8");
const config = fs.readFileSync(configPath, "utf8");

const fromHtml = [
  ...new Set(
    (html.match(/https:\/\/w\.ladicdn\.com\/[^"'\s)]+/g) || []).filter((u) =>
      /\.(jpg|jpeg|png|gif|webp)/i.test(u),
    ),
  ),
];

const inConfig = [
  ...new Set(config.match(/https:\/\/w\.ladicdn\.com\/[^"'\s)]+/g) || []),
];

const missing = fromHtml.filter((u) => !inConfig.includes(u));
const extra = inConfig.filter((u) => !fromHtml.includes(u));

console.log(JSON.stringify({ htmlTotal: fromHtml.length, configTotal: inConfig.length, missing, extra }, null, 2));
