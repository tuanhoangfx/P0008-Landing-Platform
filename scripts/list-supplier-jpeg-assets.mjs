#!/usr/bin/env node
/**
 * Flag jpeg_m_* (TikTok/supplier) assets — often contain baked-in Chinese text.
 * Use thiet-ke-chua-co-ten-* Vietnamese banners in config instead.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, "../public/products/ldp01");
const files = fs.readdirSync(dir).filter((f) => f.includes("jpeg_m_"));
console.log(JSON.stringify({ count: files.length, files }, null, 2));
