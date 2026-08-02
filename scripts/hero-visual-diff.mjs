#!/usr/bin/env node
/**
 * Capture hero fold (420px mobile) of clone vs original for visual QA.
 * Requires P0003 Stealth (:6003/:6004) + local dev on :3014.
 *
 * Usage:
 *   node scripts/hero-visual-diff.mjs
 *   node scripts/hero-visual-diff.mjs --json
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { openStealthCdpSession, cdpScreenshotPngBase64 } from "../../scripts/lib/stealth-cdp-session.mjs";
import { stealthBrowser } from "../../scripts/lib/stealth-browser-client.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const toolRoot = path.resolve(__dirname, "..");
const outDir = path.join(toolRoot, ".runtime", "visual-diff");
const jsonOut = process.argv.includes("--json");

const TARGETS = [
  { name: "clone", url: "http://127.0.0.1:3014/ldp01" },
  { name: "original", url: "https://www.hanashop.com.vn/tocduoinguahanquoc" },
];

async function assignProfile() {
  const assign = spawnSync(process.execPath, [path.join(toolRoot, "../../scripts/assign-agent-stealth-profile.mjs"), "--json"], {
    encoding: "utf8",
    windowsHide: true,
  });
  try {
    return JSON.parse(assign.stdout || "{}").profile || "9990";
  } catch {
    return "9990";
  }
}

async function capture(profile, target) {
  await stealthBrowser.openUrl({
    profileId: profile,
    profileName: profile,
    targetUrl: target.url,
    closeWhenDone: false,
  }).catch(() => null);

  await new Promise((r) => setTimeout(r, 2000));

  const session = await openStealthCdpSession(profile, { matchUrl: target.url.includes("3014") ? "3014" : "hanashop" });
  await session.send("Emulation.setDeviceMetricsOverride", {
    width: 420,
    height: 900,
    deviceScaleFactor: 2,
    mobile: true,
  });
  await session.send("Page.navigate", { url: target.url });
  await new Promise((r) => setTimeout(r, 3500));
  const b64 = await cdpScreenshotPngBase64(session.send, { fullPage: false });
  await session.close();
  return b64;
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const profile = await assignProfile();
  const results = [];

  for (const target of TARGETS) {
    const out = path.join(outDir, `hero-${target.name}.png`);
    try {
      const b64 = await capture(profile, target);
      fs.writeFileSync(out, Buffer.from(b64, "base64"));
      results.push({ name: target.name, ok: true, path: out, bytes: fs.statSync(out).size });
    } catch (e) {
      results.push({ name: target.name, ok: false, error: String(e?.message || e) });
    }
  }

  const payload = { ok: results.every((r) => r.ok), profile, results, outDir };
  if (jsonOut) console.log(JSON.stringify(payload, null, 2));
  else {
    for (const r of results) {
      console.log(r.ok ? `OK ${r.path} (${r.bytes}b)` : `FAIL ${r.name}: ${r.error}`);
    }
  }
  process.exit(payload.ok ? 0 : 1);
}

main().catch((e) => {
  console.error(jsonOut ? JSON.stringify({ ok: false, error: String(e?.message || e) }) : e);
  process.exit(1);
});
