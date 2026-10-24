/**
 * In-page overlay for tutorial recording: a drawn cursor (headless has none), click
 * ripples, chapter title cards and a step label. Lives in a shadow root so the app's
 * own CSS cannot touch it; re-installed after every navigation via `ensureOverlay`.
 */

const OVERLAY_CSS = `
  :host { all: initial; }
  * { box-sizing: border-box; }
  .cur { position: fixed; left: 0; top: 0; width: 26px; height: 26px; transform: translate(var(--x, 50vw), var(--y, 60vh)); transition: transform var(--d, 700ms) cubic-bezier(.45,.05,.2,1); filter: drop-shadow(0 3px 6px rgba(0,0,0,.45)); }
  .cur svg { width: 26px; height: 26px; display: block; }
  .cur.down svg { transform: scale(.88); transform-origin: 3px 3px; transition: transform 90ms; }
  .ripple { position: fixed; width: 14px; height: 14px; margin: -7px 0 0 -7px; border-radius: 50%; border: 2px solid #a78bfa; background: rgba(167,139,250,.25); animation: rp 600ms ease-out forwards; }
  @keyframes rp { to { transform: scale(4.2); opacity: 0; } }
  .card { position: fixed; inset: 0; display: grid; place-content: center; text-align: center; gap: 18px; background: radial-gradient(1200px 700px at 30% 20%, rgba(139,92,246,.45), transparent 60%), radial-gradient(1000px 700px at 80% 80%, rgba(59,130,246,.35), transparent 60%), #07080f; color: #eceef7; font-family: "Segoe UI Variable Display", "Segoe UI", system-ui, sans-serif; opacity: 0; transition: opacity 600ms ease; }
  .card.on { opacity: 1; }
  .card .k { font: 600 22px/1 "Segoe UI Variable Text", "Segoe UI", sans-serif; letter-spacing: .22em; text-transform: uppercase; color: var(--c, #a78bfa); opacity: 0; transform: translateY(14px); transition: all 900ms cubic-bezier(.22,1,.36,1) 150ms; }
  .card h1 { margin: 0; font-size: 104px; font-weight: 700; letter-spacing: -.035em; line-height: 1; opacity: 0; transform: translateY(26px); transition: all 1000ms cubic-bezier(.22,1,.36,1) 260ms; }
  .card p { margin: 0 auto; max-width: 980px; font-size: 30px; line-height: 1.45; color: #b4b9cc; opacity: 0; transform: translateY(18px); transition: all 1000ms cubic-bezier(.22,1,.36,1) 420ms; }
  .card .bar { width: 120px; height: 4px; margin: 10px auto 0; border-radius: 4px; background: linear-gradient(90deg, #c4b5fd, #818cf8, #34d399); transform: scaleX(0); transition: transform 1200ms cubic-bezier(.22,1,.36,1) 500ms; }
  .card.on .k, .card.on h1, .card.on p { opacity: 1; transform: none; }
  .card.on .bar { transform: none; }
  .card .logo { width: 96px; height: 96px; margin: 0 auto 8px; border-radius: 24px; background: linear-gradient(135deg, #312e81, #1e1b4b); display: grid; place-items: center; box-shadow: 0 30px 80px -10px rgba(99,102,241,.8); opacity: 0; transform: scale(.8); transition: all 900ms cubic-bezier(.22,1,.36,1); }
  .card.on .logo { opacity: 1; transform: none; }
  .label { position: fixed; left: 32px; bottom: 32px; display: flex; align-items: center; gap: 14px; padding: 12px 20px 12px 14px; border-radius: 16px; background: rgba(10,12,24,.82); border: 1px solid rgba(255,255,255,.14); backdrop-filter: blur(12px); color: #eceef7; font: 600 20px/1.2 "Segoe UI Variable Text", "Segoe UI", sans-serif; box-shadow: 0 20px 50px -12px rgba(0,0,0,.7); opacity: 0; transform: translateY(16px); transition: all 600ms cubic-bezier(.22,1,.36,1); }
  .label.on { opacity: 1; transform: none; }
  .label b { display: grid; place-items: center; min-width: 38px; height: 38px; padding: 0 8px; border-radius: 10px; font-size: 16px; color: var(--c, #a78bfa); background: color-mix(in srgb, var(--c, #a78bfa) 18%, transparent); }
  .focus { position: fixed; border-radius: 12px; border: 3px solid var(--c, #a78bfa); box-shadow: 0 0 0 9999px rgba(4,5,12,.38), 0 0 30px var(--c, #a78bfa); opacity: 0; transition: all 600ms cubic-bezier(.22,1,.36,1); }
  .focus.on { opacity: 1; }
`;

const OVERLAY_HTML = `
<div class="focus"></div>
<div class="label"><b></b><span></span></div>
<div class="card"><div class="logo"><svg width="56" height="56" viewBox="0 0 64 64"><rect x="12" y="16" width="40" height="32" rx="6" fill="#818cf8"/><path d="M28 25v14l12-7z" fill="#fff"/></svg></div><div class="k"></div><h1></h1><p></p><div class="bar"></div></div>
<div class="cur"><svg viewBox="0 0 24 24"><path d="M3 2.5 20 12l-7.2 1.6L9.3 21z" fill="#fff" stroke="#111" stroke-width="1.4" stroke-linejoin="round"/></svg></div>`;

/** Runs in the page (serialised by page.evaluate) — must not close over module scope. */
function installOverlay([css, html]) {
  if (window.__vl && document.getElementById("__vl-overlay")) return true;
  const host = document.createElement("div");
  host.id = "__vl-overlay";
  host.style.cssText = "position:fixed;inset:0;z-index:2147483647;pointer-events:none";
  const root = host.attachShadow({ mode: "open" });
  root.innerHTML = `<style>${css}</style>${html}`;
  (document.body || document.documentElement).append(host);
  const $ = (s) => root.querySelector(s);
  const cur = $(".cur");
  let pos = window.__vlPos || { x: innerWidth * 0.55, y: innerHeight * 0.62 };
  cur.style.setProperty("--d", "0ms");
  cur.style.setProperty("--x", pos.x + "px");
  cur.style.setProperty("--y", pos.y + "px");
  window.__vl = {
    move(x, y, ms) {
      const dist = Math.hypot(x - pos.x, y - pos.y);
      const d = ms ?? Math.round(Math.min(1100, Math.max(380, dist * 0.9)));
      cur.style.setProperty("--d", d + "ms");
      cur.style.setProperty("--x", x + "px");
      cur.style.setProperty("--y", y + "px");
      pos = { x, y };
      window.__vlPos = pos;
      return d;
    },
    click() {
      cur.classList.add("down");
      setTimeout(() => cur.classList.remove("down"), 140);
      const r = document.createElement("div");
      r.className = "ripple";
      r.style.left = pos.x + 2 + "px";
      r.style.top = pos.y + 2 + "px";
      root.append(r);
      setTimeout(() => r.remove(), 700);
    },
    card(on, { kicker = "", title = "", sub = "", color = "#a78bfa" } = {}) {
      const c = $(".card");
      c.style.setProperty("--c", color);
      if (on) {
        c.querySelector(".k").textContent = kicker;
        c.querySelector("h1").textContent = title;
        c.querySelector("p").textContent = sub;
      }
      c.classList.toggle("on", on);
    },
    label(on, { n = "", text = "", color = "#a78bfa" } = {}) {
      const l = $(".label");
      l.style.setProperty("--c", color);
      if (on) {
        l.querySelector("b").textContent = n;
        l.querySelector("span").textContent = text;
      }
      l.classList.toggle("on", on);
    },
    focus(rect, color = "#a78bfa") {
      const f = $(".focus");
      f.style.setProperty("--c", color);
      if (!rect) return f.classList.remove("on");
      const pad = 8;
      Object.assign(f.style, {
        left: rect.x - pad + "px",
        top: rect.y - pad + "px",
        width: rect.width + pad * 2 + "px",
        height: rect.height + pad * 2 + "px",
      });
      f.classList.add("on");
    },
  };
  return true;
}

export async function ensureOverlay(page) {
  await page.evaluate(installOverlay, [OVERLAY_CSS, OVERLAY_HTML]);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Resolve a selector string or Playwright locator to its on-screen centre. */
async function centreOf(page, target) {
  const loc = typeof target === "string" ? page.locator(target).first() : target;
  await loc.scrollIntoViewIfNeeded({ timeout: 10_000 }).catch(() => {});
  const box = await loc.boundingBox();
  if (!box) throw new Error(`overlay: no box for ${typeof target === "string" ? target : "locator"}`);
  return { loc, box, x: box.x + Math.min(box.width / 2, 60), y: box.y + box.height / 2 };
}

/**
 * Recording-mode ctx helpers handed to demo-flow scenes: every click glides the cursor to
 * the target first, typing happens at a readable speed.
 */
export function recordingCtx(page, base = {}) {
  const ctx = {
    ...base,
    page,
    recording: true,
    pace: (ms) => sleep(ms),
    async moveTo(target) {
      await ensureOverlay(page);
      const { x, y } = await centreOf(page, target);
      const d = await page.evaluate(([px, py]) => window.__vl.move(px, py), [x, y]);
      await sleep(d + 120);
    },
    async click(target, opts = {}) {
      await ensureOverlay(page);
      const { loc, x, y } = await centreOf(page, target);
      const d = await page.evaluate(([px, py]) => window.__vl.move(px, py), [x, y]);
      await sleep(d + 160);
      await page.evaluate(() => window.__vl.click());
      const { after = 450, ...clickOpts } = opts;
      await loc.click(clickOpts);
      await sleep(after);
      await ensureOverlay(page);
    },
    async type(target, text, { delay = 38 } = {}) {
      await ctx.click(target, { after: 200 });
      const loc = typeof target === "string" ? page.locator(target).first() : target;
      await loc.pressSequentially(text, { delay });
      await sleep(300);
    },
    async focus(target, color) {
      await ensureOverlay(page);
      if (!target) return page.evaluate(() => window.__vl.focus(null));
      const { box } = await centreOf(page, target);
      await page.evaluate(([b, c]) => window.__vl.focus(b, c), [box, color]);
    },
    async card(on, opts) {
      await ensureOverlay(page);
      await page.evaluate(([o, p]) => window.__vl.card(o, p), [on, opts ?? {}]);
    },
    async label(on, opts) {
      await ensureOverlay(page);
      await page.evaluate(([o, p]) => window.__vl.label(o, p), [on, opts ?? {}]);
    },
  };
  return ctx;
}
