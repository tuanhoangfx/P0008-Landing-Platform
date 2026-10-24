/**
 * Ctrl/⌘K palette over the build-time index (<script id="search-index">, render.mjs).
 * Accent-insensitive Vietnamese matching, ↑↓ / Enter / Esc, grouped results.
 */
const EN = typeof document !== "undefined" && document.documentElement.lang === "en";
const KIND = {
  page: { label: EN ? "Pages" : "Trang", g: ["#c084fc", "#6366f1"], d: '<path d="m3 10.5 9-7.5 9 7.5"/><path d="M5 9v11h14V9"/>' },
  chapter: { label: EN ? "Chapters" : "Chương", g: ["#a78bfa", "#38bdf8"], d: '<path d="m12 3 9 5-9 5-9-5Z"/><path d="m3 13 9 5 9-5"/>' },
  step: { label: EN ? "Guide steps" : "Bước hướng dẫn", g: ["#60a5fa", "#22d3ee"], d: '<path d="M4 19.5v-14A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5"/><path d="M9 8h7M9 12h5"/>' },
  feature: { label: EN ? "Features" : "Tính năng", g: ["#fbbf24", "#f472b6"], d: '<path d="m10 3 1.8 5.2L17 10l-5.2 1.8L10 17l-1.8-5.2L3 10l5.2-1.8Z"/>' },
  faq: { label: EN ? "FAQ" : "Hỏi đáp", g: ["#38bdf8", "#a78bfa"], d: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.3 2.4c-.5.2-.8.6-.8 1.1V13M12 16.5v.01"/>' },
};
const ORDER = ["page", "chapter", "step", "feature", "faq"];

/** Lowercase, strip Vietnamese diacritics (đ → d) so "giong doc" finds "giọng đọc". */
export const fold = (s) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();

const escHtml = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

/** Wrap folded-query hits in <mark>, mapping positions back onto the original text. */
function highlight(text, tokens) {
  if (!tokens.length) return escHtml(text);
  const folded = fold(text);
  const hits = new Array(text.length).fill(false);
  for (const t of tokens) {
    let i = folded.indexOf(t);
    while (i >= 0) {
      for (let k = i; k < i + t.length; k++) hits[k] = true;
      i = folded.indexOf(t, i + t.length);
    }
  }
  let out = "";
  let open = false;
  for (let i = 0; i < text.length; i++) {
    if (hits[i] && !open) (out += "<mark>"), (open = true);
    if (!hits[i] && open) (out += "</mark>"), (open = false);
    out += escHtml(text[i]);
  }
  return open ? out + "</mark>" : out;
}

function snippet(text, tokens, len = 110) {
  if (!text) return "";
  const at = tokens.length ? Math.max(0, fold(text).indexOf(tokens[0]) - 30) : 0;
  const cut = text.slice(at, at + len);
  return `${at > 0 ? "…" : ""}${cut}${at + len < text.length ? "…" : ""}`;
}

function score(item, tokens) {
  const title = fold(item.t);
  const body = fold(`${item.s} ${item.g ?? ""}`);
  let sc = 0;
  for (const t of tokens) {
    if (title.startsWith(t)) sc += 6;
    else if (title.includes(t)) sc += 4;
    else if (body.includes(t)) sc += 1;
    else return 0;
  }
  return sc + (item.k === "step" ? 0.5 : 0);
}

const icon = (k) => {
  const m = KIND[k];
  return `<span class="cmdk__ico" style="--g1:${m.g[0]};--g2:${m.g[1]}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${m.d}</svg></span>`;
};

export function initSearch({ lenis } = {}) {
  const data = document.getElementById("search-index");
  if (!data) return;
  const items = JSON.parse(data.textContent);
  const mac = /Mac|iPhone|iPad/.test(navigator.platform);
  document.querySelectorAll("[data-search-kbd]").forEach((k) => (k.textContent = mac ? "⌘K" : "Ctrl K"));

  const root = document.createElement("div");
  root.className = "cmdk";
  root.hidden = true;
  root.innerHTML = `<div class="cmdk__scrim" data-close></div>
  <div class="cmdk__panel" role="dialog" aria-modal="true" aria-label="${EN ? "Search" : "Tìm nhanh"}">
    <label class="cmdk__bar">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
      <input type="search" placeholder="${EN ? "Search steps, features, questions…" : "Tìm bước, tính năng, câu hỏi… (không cần dấu)"}" autocomplete="off" spellcheck="false" aria-controls="cmdk-list">
      <kbd data-close>Esc</kbd>
    </label>
    <div class="cmdk__list" id="cmdk-list" role="listbox"></div>
    <footer class="cmdk__foot"><span><kbd>↑</kbd><kbd>↓</kbd> ${EN ? "move" : "chọn"}</span><span><kbd>Enter</kbd> ${EN ? "open" : "mở"}</span><span><kbd>Esc</kbd> ${EN ? "close" : "đóng"}</span><span class="cmdk__count"></span></footer>
  </div>`;
  document.body.append(root);
  const input = root.querySelector("input");
  const list = root.querySelector(".cmdk__list");
  const count = root.querySelector(".cmdk__count");
  let results = [];
  let cur = 0;
  let lastFocus = null;

  const render = () => {
    const tokens = fold(input.value).split(/\s+/).filter(Boolean);
    const ranked = tokens.length
      ? items
          .map((it) => ({ it, sc: score(it, tokens) }))
          .filter((r) => r.sc > 0)
          .sort((a, b) => b.sc - a.sc)
          .slice(0, 40)
      : items.filter((it) => it.k === "page" || it.k === "chapter").map((it) => ({ it, sc: 0 }));
    // Groups follow their best hit (so the top result is pre-selected); ties keep ORDER.
    const best = new Map();
    for (const r of ranked) best.set(r.it.k, Math.max(best.get(r.it.k) ?? 0, r.sc));
    const groups = ORDER.filter((k) => best.has(k)).sort((a, b) => best.get(b) - best.get(a) || ORDER.indexOf(a) - ORDER.indexOf(b));
    results = groups.flatMap((k) => ranked.filter((r) => r.it.k === k).map((r) => r.it));
    cur = Math.min(cur, Math.max(0, results.length - 1));
    if (!results.length) {
      list.innerHTML = EN
        ? `<p class="cmdk__empty">Nothing found for “${escHtml(input.value)}”. Try a shorter word, e.g. “mixer”, “voice”, “encode”.</p>`
        : `<p class="cmdk__empty">Không tìm thấy “${escHtml(input.value)}”. Thử từ khoá ngắn hơn, ví dụ “mixer”, “giọng”, “encode”.</p>`;
      count.textContent = "";
      return;
    }
    let html = "";
    let group = "";
    results.forEach((r, i) => {
      if (r.k !== group) {
        group = r.k;
        html += `<div class="cmdk__group">${KIND[r.k].label}</div>`;
      }
      html += `<a class="cmdk__item${i === cur ? " is-on" : ""}" href="${escHtml(r.h)}" role="option" aria-selected="${i === cur}" data-i="${i}"${r.c ? ` style="--c:${r.c}"` : ""}>
        ${icon(r.k)}
        <span class="cmdk__txt"><b>${highlight(r.t, tokens)}</b>${r.g ? `<small class="cmdk__tag">${escHtml(r.g)}</small>` : ""}<span>${highlight(snippet(r.s, tokens), tokens)}</span></span>
        <i class="cmdk__go" aria-hidden="true">↵</i>
      </a>`;
    });
    list.innerHTML = html;
    count.textContent = tokens.length ? `${results.length} ${EN ? "results" : "kết quả"}` : EN ? "Suggestions" : "Gợi ý";
  };

  const select = (i) => {
    cur = Math.max(0, Math.min(results.length - 1, i));
    list.querySelectorAll(".cmdk__item").forEach((a) => {
      const on = Number(a.dataset.i) === cur;
      a.classList.toggle("is-on", on);
      a.setAttribute("aria-selected", String(on));
      if (on) a.scrollIntoView({ block: "nearest" });
    });
  };

  const open = () => {
    if (!root.hidden) return;
    lastFocus = document.activeElement;
    root.hidden = false;
    document.documentElement.classList.add("cmdk-open");
    lenis?.stop();
    input.value = "";
    cur = 0;
    render();
    requestAnimationFrame(() => {
      root.classList.add("is-in");
      input.focus();
    });
  };
  const close = () => {
    if (root.hidden) return;
    root.classList.remove("is-in");
    document.documentElement.classList.remove("cmdk-open");
    lenis?.start();
    setTimeout(() => (root.hidden = true), 180);
    lastFocus?.focus?.();
  };
  const go = (r) => {
    if (!r) return;
    close();
    const url = new URL(r.h, location.href);
    // Same page: let the hash handlers (tour step, FAQ, anchors) react without a reload.
    if (url.pathname === location.pathname) {
      if (url.hash === location.hash) dispatchEvent(new HashChangeEvent("hashchange"));
      else location.hash = url.hash;
    } else location.href = url.href;
  };

  input.addEventListener("input", () => ((cur = 0), render()));
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") (e.preventDefault(), select(cur + 1));
    else if (e.key === "ArrowUp") (e.preventDefault(), select(cur - 1));
    else if (e.key === "Enter") (e.preventDefault(), go(results[cur]));
  });
  list.addEventListener("click", (e) => {
    const a = e.target.closest(".cmdk__item");
    if (!a) return;
    e.preventDefault();
    go(results[Number(a.dataset.i)]);
  });
  list.addEventListener("mousemove", (e) => {
    const a = e.target.closest(".cmdk__item");
    if (a && Number(a.dataset.i) !== cur) select(Number(a.dataset.i));
  });
  root.addEventListener("click", (e) => e.target.closest("[data-close]") && close());
  addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") (e.preventDefault(), root.hidden ? open() : close());
    else if (e.key === "/" && root.hidden && !/input|textarea|select/i.test(document.activeElement?.tagName ?? "")) (e.preventDefault(), open());
    else if (e.key === "Escape" && !root.hidden) close();
  });
  document.querySelectorAll("[data-search-open]").forEach((b) => b.addEventListener("click", open));
}
