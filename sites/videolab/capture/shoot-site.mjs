#!/usr/bin/env node
/**
 * Visual check of the built site in a P0003 agent-pool profile (headless): scrolls every page
 * to the bottom so scroll-triggered reveals fire, then saves full-page PNGs.
 *
 *   node scripts/shoot-site.mjs [--base http://127.0.0.1:4229] [--pages /,/guide/,...] [--out .probe/site]
 */
import fs from "node:fs";
import path from "node:path";
import { openStealthPlaywrightPage } from "../../../../scripts/lib/stealth-playwright-page.mjs";

const args = process.argv.slice(2);
const arg = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const base = arg("--base", "http://127.0.0.1:4229");
const pages = arg("--pages", "/,/guide/,/guide/mixer/,/download/").split(",");
const out = path.resolve(arg("--out", ".probe/site"));
const viewports = { desktop: { width: 1440, height: 900, dpr: 1, mobile: false }, mobile: { width: 390, height: 844, dpr: 2, mobile: true } };
fs.mkdirSync(out, { recursive: true });

const { page, close, profile } = await openStealthPlaywrightPage({ viewport: { width: 1440, height: 900 } });
console.log(`[shoot] profile=${profile}`);
const issues = [];
page.on("console", (m) => m.type() === "error" && issues.push(`console: ${m.text().slice(0, 200)}`));
page.on("pageerror", (e) => issues.push(`pageerror: ${e.message}`));
page.on("requestfailed", (r) => !r.url().includes("api.github.com") && issues.push(`failed: ${r.url()}`));
try {
  const cdp = await page.context().newCDPSession(page);
  for (const [vpName, vp] of Object.entries(viewports)) {
    await cdp.send("Emulation.setDeviceMetricsOverride", { width: vp.width, height: vp.height, deviceScaleFactor: vp.dpr, mobile: vp.mobile });
    for (const p of pages) {
      await page.goto(base + p, { waitUntil: "load", timeout: 45_000 });
      await page.waitForTimeout(1800);
      const h = await page.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0; y < h; y += Math.round(vp.height * 0.6)) {
        await page.evaluate((yy) => window.scrollTo(0, yy), y);
        await page.waitForTimeout(260);
      }
      await page.waitForTimeout(1200);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      if (overflow > 1) issues.push(`${vpName} ${p}: horizontal overflow ${overflow}px`);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(600);
      const file = path.join(out, `${vpName}${p.replace(/\//g, "_") || "_"}.png`);
      await page.screenshot({ path: file, fullPage: true });
      console.log(`[shoot] ${vpName} ${p} → ${file} (${h}px)`);
    }
  }
} finally {
  await close();
}
console.log(issues.length ? `[shoot] issues:\n  ${[...new Set(issues)].join("\n  ")}` : "[shoot] no console/network issues");
