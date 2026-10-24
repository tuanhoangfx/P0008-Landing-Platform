/**
 * Build-time HTML for the site (runs in Node from vite.config.js, never in the browser).
 * Pages hold `<!--@block arg-->` markers; `renderBlock` swaps each for static markup so
 * every page ships its real content and JS only adds motion.
 */
import fs from "node:fs";
import path from "node:path";

const SHOT_W = 1920;
const SHOT_H = 1080;
let siteRootForShots = "";
/** site.config.json of the site being rendered (name, copy, releases …). */
let SITE = {};
const siteName = () => SITE.name ?? "App";
/** Product-specific sentence from site.config.json `copy.<lang>.<key>`, VI as fallback. */
const siteCopy = (key, lang) => SITE.copy?.[lang]?.[key] ?? SITE.copy?.vi?.[key] ?? "";

/** Pixel size of a WebP (VP8X / VP8 / VP8L headers) — element shots are not 16:9. */
function webpSize(file) {
  try {
    const b = fs.readFileSync(file);
    const kind = b.toString("ascii", 12, 16);
    if (kind === "VP8X") return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
    if (kind === "VP8 ") return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
    if (kind === "VP8L") {
      const bits = b.readUInt32LE(21);
      return { w: (bits & 0x3fff) + 1, h: ((bits >> 14) & 0x3fff) + 1 };
    }
  } catch {}
  return null;
}

/** ?v= fingerprint (size+mtime) — the edge caches /shots and /video for a day by URL. */
function bust(rel) {
  try {
    const st = fs.statSync(path.join(siteRootForShots, "public", rel.replace(/^\//, "")));
    return `?v=${Math.abs(st.size ^ Math.round(st.mtimeMs)).toString(36)}`;
  } catch {
    return "";
  }
}

export function createContent(siteRoot) {
  siteRootForShots = siteRoot;
  const read = (rel, fallback) => {
    const p = path.join(siteRoot, rel);
    if (!fs.existsSync(p)) return fallback;
    return JSON.parse(fs.readFileSync(p, "utf8"));
  };
  const chapters = read("content/chapters.json", []).sort((a, b) => a.order - b.order);
  const steps = read("content/steps.json", []).sort(
    (a, b) => chapterOrder(chapters, a.chapter) - chapterOrder(chapters, b.chapter) || a.order - b.order,
  );
  const features = read("content/features.json", []);
  const faq = read("content/faq.json", []);
  const hasPublic = (rel) => fs.existsSync(path.join(siteRoot, "public", rel));
  const site = read("site.config.json", {});
  SITE = site;
  const landing = read("content/landing.json", {});
  return { site, landing, chapters, steps, features, faq, hasPublic };
}

function chapterOrder(chapters, id) {
  return chapters.find((c) => c.id === id)?.order ?? 99;
}

export const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/** Inline-only markup in copy: `code` → <code>, **bold** → <strong>. */
const prose = (s) =>
  esc(s)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");

const pad = (n) => String(n).padStart(2, "0");

function shotImg(shot, alt, cls, { eager = false } = {}) {
  if (!shot) return "";
  const src = `/${shot.replace(/^\//, "")}`;
  const size = webpSize(path.join(siteRootForShots, "public", src));
  const ratio = size ? size.w / size.h : SHOT_W / SHOT_H;
  // Element shots (dialogs) are letterboxed inside the 16:9 screen instead of cropped.
  if (Math.abs(ratio - SHOT_W / SHOT_H) > 0.04) cls = `${cls} is-contain`.trim();
  const w = size ? Math.round(size.w / 2) : SHOT_W;
  const h = size ? Math.round(size.h / 2) : SHOT_H;
  const small = src.replace(/\.webp$/, "-1600.webp");
  const v = bust(src);
  return `<img class="${cls}" src="${small}${v}" srcset="${small}${v} 1600w, ${src}${v} ${size?.w ?? SHOT_W * 2}w" sizes="(min-width: 1100px) 62vw, 100vw" width="${w}" height="${h}" alt="${esc(alt)}" decoding="async" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'}>`;
}

function hlAttr(h) {
  if (!h) return "";
  return ` data-hl="${[h.x, h.y, h.w, h.h].map((v) => Number(v).toFixed(2)).join(",")}"`;
}

/** Window chrome around a screenshot; `inner` is the screen content. */
export function frame(inner, { title = siteName(), cls = "" } = {}) {
  return `<div class="frame ${cls}">
  <div class="frame__bar" aria-hidden="true">
    <span class="frame__logo"></span><span class="frame__title">${esc(title)}</span>
    <span class="frame__ctl"><i></i><i></i><i></i></span>
  </div>
  <div class="frame__screen">${inner}</div>
</div>`;
}

/* ------------------------------------------------------------------ i18n */

export const LANGS = ["vi", "en"];

/** UI copy that is not content (content lives in content/*.json as *_vi / *_en). */
const UI = {
  vi: {
    skip: "Bỏ qua điều hướng",
    home: (n) => `${n} — trang chủ`,
    navMain: "Chính",
    nav: { features: "Tính năng", guide: "Hướng dẫn", video: "Video", faq: "Hỏi đáp" },
    search: "Tìm nhanh",
    download: "Tải về",
    menu: "Mở menu",
    lang: "Ngôn ngữ",
    empty: "Ảnh hướng dẫn đang được cập nhật.",
    prev: "Bước trước",
    next: "Bước tiếp",
    steps: "Các bước",
    stepsN: (n) => `${n} bước`,
    soon: "Sắp có",
    chapterNav: "Chương",
    prevChapter: "← Chương trước",
    nextChapter: "Chương tiếp →",
    done: "Xong rồi →",
    getIt: (n) => `Tải ${n}`,
    play: "Phát video",
    videoTitle: "Video hướng dẫn",
    subs: "Tiếng Việt",
    subsLabel: { vi: "Tiếng Việt", en: "Tiếng Anh" },
    version: "Phiên bản",
    footNav: "Chân trang",
    releases: "Các bản phát hành",
    idx: {
      home: ["Trang chủ", (n) => `Giới thiệu ${n}`],
      guide: ["Hướng dẫn", (n) => `${n} bước có ảnh thật`],
      video: ["Video hướng dẫn", "Xem toàn bộ trong vài phút"],
      download: ["Tải về"],
      features: ["Tính năng", (n) => `Những gì ${n} tự lo`],
      faq: ["Hỏi đáp", "Câu hỏi thường gặp"],
      step: "Bước",
    },
  },
  en: {
    skip: "Skip to content",
    home: (n) => `${n} — home`,
    navMain: "Main",
    nav: { features: "Features", guide: "Guide", video: "Video", faq: "FAQ" },
    search: "Search",
    download: "Download",
    menu: "Open menu",
    lang: "Language",
    empty: "Guide screenshots are on their way.",
    prev: "Previous step",
    next: "Next step",
    steps: "Steps",
    stepsN: (n) => `${n} step${n === 1 ? "" : "s"}`,
    soon: "Coming soon",
    chapterNav: "Chapters",
    prevChapter: "← Previous chapter",
    nextChapter: "Next chapter →",
    done: "All done →",
    getIt: (n) => `Download ${n}`,
    play: "Play video",
    videoTitle: "Video tutorial",
    subs: "Vietnamese",
    subsLabel: { vi: "Vietnamese", en: "English" },
    version: "Version",
    footNav: "Footer",
    releases: "All releases",
    idx: {
      home: ["Home", (n) => `${n} overview`],
      guide: ["Guide", (n) => `${n} steps with real screenshots`],
      video: ["Video tutorial", "The whole tour in a few minutes"],
      download: ["Download"],
      features: ["Features", (n) => `What ${n} takes care of`],
      faq: ["FAQ", "Frequently asked questions"],
      step: "Step",
    },
  },
};

const langOf = (page) => (page?.lang === "en" ? "en" : "vi");
/** Localised field: `title` → title_en / title_vi / title. */
const tr = (obj, key, lang) => obj?.[`${key}_${lang}`] ?? obj?.[`${key}_vi`] ?? obj?.[key] ?? "";
/** Root-relative link in the page's language (withBase adds /intro/ afterwards). */
const lp = (lang, p) => (lang === "en" ? `/en${p}` : p);

/** Flags are drawn, not emoji — Windows renders flag emoji as two letters. */
const FLAGS = {
  vi: '<svg class="flag" viewBox="0 0 30 20" aria-hidden="true"><rect width="30" height="20" fill="#da251d"/><path fill="#ffcd00" d="m15 4.2 1.35 4.15h4.37l-3.54 2.57 1.35 4.15L15 12.5l-3.53 2.57 1.35-4.15-3.54-2.57h4.37Z"/></svg>',
  en: '<svg class="flag" viewBox="0 0 60 40" aria-hidden="true"><clipPath id="uk-c"><path d="M0 0h60v40H0Z"/></clipPath><clipPath id="uk-t"><path d="M30 20h30v20Zv20H0Zh-30V0Zv-20h30Z"/></clipPath><g clip-path="url(#uk-c)"><path d="M0 0v40h60V0Z" fill="#012169"/><path d="m0 0 60 40m0-40L0 40" stroke="#fff" stroke-width="8"/><path d="m0 0 60 40m0-40L0 40" clip-path="url(#uk-t)" stroke="#c8102e" stroke-width="5"/><path d="M30 0v40M0 20h60" stroke="#fff" stroke-width="12"/><path d="M30 0v40M0 20h60" stroke="#c8102e" stroke-width="7"/></g></svg>',
};
const LANG_NAMES = { vi: "Tiếng Việt", en: "English" };

/* ------------------------------------------------------------------ blocks */

/**
 * Guided tour: the app screen fills the section, the active step's text sits under it and
 * every step is a tab in one horizontal strip. On wide screens motion.js pins the section
 * and maps vertical scroll onto the steps; tabs jump straight to a step.
 */
function story(steps, chapters, { id = "", all = steps, lang = "vi" } = {}) {
  const t = UI[lang];
  if (!steps.length) return `<p class="empty">${t.empty}</p>`;
  const meta = steps.map((s) => {
    const chapter = chapters.find((c) => c.id === s.chapter);
    // The strip carries the step number; the chip only names the chapter.
    return { s, chapter, color: esc(chapter?.color ?? "#818cf8"), chip: esc(tr(chapter, "title", lang) || s.chapter), title: tr(s, "title", lang), body: tr(s, "body", lang) };
  });
  const shots = meta
    .map(({ s, title }, i) => shotImg(s.shot, title, `tour__shot${i === 0 ? " is-on" : ""}`, { eager: i === 0 }).replace("<img ", `<img data-for="${esc(s.id)}" `))
    .join("\n");
  const panels = meta
    .map(
      ({ s, color, chip, title, body }, i) => `<article class="tour__panel${i === 0 ? " is-on" : ""}" data-for="${esc(s.id)}" style="--c:${color}"${i === 0 ? "" : ' aria-hidden="true"'}>
      <span class="chip">${chip}</span>
      <div><h3>${esc(title)}</h3><p>${prose(body)}</p></div>
    </article>`,
    )
    .join("\n");
  const tabs = meta
    .map(
      ({ s, color, chip, title }, i) => `<li><button class="tour__tab${i === 0 ? " is-on" : ""}" type="button" role="tab" aria-selected="${i === 0}" data-step="${esc(s.id)}"${hlAttr(s.highlight)} style="--c:${color}">
        <span class="tour__n">${pad(i + 1)}</span><span class="tour__t"><small>${chip}</small>${esc(title)}</span>
      </button></li>`,
    )
    .join("\n");
  return `<div class="tour" data-tour${id ? ` id="${esc(id)}"` : ""}>
  <div class="tour__stage">${frame(`${shots}<div class="tour__hl"></div>`, { title: siteName() })}</div>
  <div class="tour__bar">
    <div class="tour__text" aria-live="polite">${panels}</div>
    <div class="tour__nav">
      <button class="tour__btn" type="button" data-tour-prev aria-label="${t.prev}">←</button>
      <span class="tour__count"><b data-tour-index>01</b> / ${pad(steps.length)}</span>
      <button class="tour__btn" type="button" data-tour-next aria-label="${t.next}">→</button>
    </div>
  </div>
  <div class="tour__rail"><ol class="tour__strip" role="tablist" aria-label="${t.steps}">${tabs}</ol><span class="tour__progress" aria-hidden="true"><i></i></span></div>
</div>`;
}

const ICONS = {
  layers: '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 13 9 5 9-5"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/>',
  zap: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/>',
  "git-merge": '<circle cx="6" cy="5" r="2"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="12" r="2"/><path d="M6 7v10M6 9c0 3 4 3 10 3"/>',
  pin: '<path d="M9 3h6l-1 6 3 3H7l3-3-1-6Z"/><path d="M12 12v9"/>',
  monitor: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
  cpu: '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  film: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4"/>',
  shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/>',
  shuffle: '<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>',
  gauge: '<path d="M12 14 16 9"/><path d="M3.5 18a10 10 0 1 1 17 0"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
  timeline: '<path d="M3 12h18"/><circle cx="7" cy="12" r="2"/><circle cx="14" cy="12" r="2"/><path d="M7 5v3M14 16v3M19 5v3"/>',
};
const ICON_ROTATION = Object.keys(ICONS);

export function icon(name, i = 0) {
  const body = ICONS[name] ?? ICONS[ICON_ROTATION[i % ICON_ROTATION.length]];
  return `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}

/** Indices of 2-column cards so a 3-column grid has no hole: rows go [w,1] [1,1,1] [1,w] … */
function bentoWide(n) {
  const wide = new Set();
  let i = 0;
  let row = 0;
  while (i < n) {
    const left = n - i;
    const pattern = row % 3 === 0 ? ["w", 1] : row % 3 === 1 ? [1, 1, 1] : [1, "w"];
    if (left === 2) { wide.add(i); break; }
    if (left <= 3 && pattern.length === 2 && left === 3) { i += 3; break; }
    pattern.forEach((p, k) => p === "w" && wide.add(i + k));
    i += pattern.length;
    row += 1;
  }
  return wide;
}

function features(list, lang) {
  const wide = bentoWide(list.length);
  return `<div class="bento">${list
    .map(
      (f, i) => `<article class="bento__card${wide.has(i) ? " bento__card--wide" : ""}" data-reveal data-spot>
      <span class="bento__ico">${icon(f.icon, i)}</span>
      <h3>${esc(tr(f, "title", lang))}</h3>
      <p>${prose(tr(f, "body", lang) || f.desc_vi || "")}</p>
      ${f.chapter ? `<span class="chip chip--ghost">${esc(f.chapter)}</span>` : ""}
    </article>`,
    )
    .join("\n")}</div>`;
}

function faqList(list, lang) {
  return `<div class="faq">${list
    .map(
      (f, i) => `<details class="faq__item" id="faq-${i + 1}" data-reveal>
      <summary><span>${esc(tr(f, "q", lang))}</span><i aria-hidden="true"></i></summary>
      <div class="faq__a"><p>${prose(tr(f, "a", lang))}</p></div>
    </details>`,
    )
    .join("\n")}</div>`;
}

function chapterCards(chapters, steps, lang) {
  const t = UI[lang];
  return `<div class="chapters">${chapters
    .map((c, i) => {
      const n = steps.filter((s) => s.chapter === c.id).length;
      const cover = steps.find((s) => s.chapter === c.id);
      return `<a class="chapter" href="${lp(lang, `/guide/${c.id}/`)}" style="--c:${c.color}" data-reveal data-spot>
        <span class="chapter__n">${pad(i)}</span>
        <span class="chapter__kicker">${esc(tr(c, "kicker", lang))}</span>
        <h3>${esc(tr(c, "title", lang))}</h3>
        <p>${esc(tr(c, "summary", lang))}</p>
        <span class="chapter__meta">${n ? t.stepsN(n) : t.soon} <b aria-hidden="true">→</b></span>
        ${cover ? `<span class="chapter__cover">${shotImg(cover.shot, tr(c, "title", lang), "")}</span>` : ""}
      </a>`;
    })
    .join("\n")}</div>`;
}

function videoBlock(ctx, name, { poster, title, lang }) {
  if (!ctx.hasPublic(`video/${name}.mp4`)) return "";
  const t = UI[lang];
  // One subtitle track per `<name>.<lang>.vtt` present. The page language's track is the default
  // when it exists; otherwise none is (an EN page with only VI subs keeps them, labelled as such).
  const vtt = LANGS.filter((l) => ctx.hasPublic(`video/${name}.${l}.vtt`))
    .map((l) => `<track kind="subtitles" srclang="${l}" label="${t.subsLabel[l]}" src="/video/${name}.${l}.vtt${bust(`video/${name}.${l}.vtt`)}"${l === lang ? " default" : ""}>`)
    .join("");
  const chaptersVtt = ctx.hasPublic(`video/${name}.chapters.vtt`)
    ? `<track kind="chapters" srclang="vi" src="/video/${name}.chapters.vtt${bust(`video/${name}.chapters.vtt`)}">`
    : "";
  const ownPoster = ctx.hasPublic(`video/${name}-poster.jpg`) ? `/video/${name}-poster.jpg${bust(`video/${name}-poster.jpg`)}` : null;
  const posterSrc = ownPoster ?? (poster ? `/${poster.replace(/^\//, "").replace(/\.webp$/, "-1600.webp")}` : "");
  const posterAttr = posterSrc ? ` poster="${posterSrc}"` : "";
  return `<figure class="player" data-player data-reveal>
    ${frame(`<video controls preload="metadata" playsinline${posterAttr} src="/video/${name}.mp4${bust(`video/${name}.mp4`)}">${vtt}${chaptersVtt}</video>
    <button class="player__play" type="button" aria-label="${t.play}"><span></span></button>`, { title })}
  </figure>`;
}

function langSwitch(page) {
  const lang = langOf(page);
  const alt = (l) => (l === "en" ? `/en${page?.path ?? "/"}` : page?.path ?? "/");
  return `<div class="lang" data-lang>
      <button class="lang__btn" type="button" aria-haspopup="listbox" aria-expanded="false" aria-label="${UI[lang].lang}: ${LANG_NAMES[lang]}" data-lang-btn>${FLAGS[lang]}<span>${lang.toUpperCase()}</span><svg class="lang__chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button>
      <ul class="lang__menu" role="listbox" aria-label="${UI[lang].lang}" hidden>${LANGS.map(
        (l) => `<li><a href="${alt(l)}" hreflang="${l}" lang="${l}" role="option" aria-selected="${l === lang}" data-lang-pick="${l}">${FLAGS[l]}<span>${LANG_NAMES[l]}</span>${l === lang ? '<svg class="lang__ok" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg>' : ""}</a></li>`,
      ).join("")}</ul>
    </div>`;
}

function siteHeader(active, page) {
  const lang = langOf(page);
  const t = UI[lang];
  const nav = [
    ["features", "/#features"],
    ["guide", "/guide/"],
    ["video", "/#video"],
    ["faq", "/#faq"],
  ];
  return `<a class="skip" href="#main">${t.skip}</a>
<header class="nav" data-nav>
  <div class="nav__in">
    <a class="brand" href="${lp(lang, "/")}" aria-label="${t.home(siteName())}"><img src="/favicon.svg" width="28" height="28" alt=""><span>${esc(siteName())}</span></a>
    <nav class="nav__links" aria-label="${t.navMain}">${nav
      .map(([id, href]) => `<a href="${lp(lang, href)}"${active === id ? ' aria-current="page"' : ""}>${t.nav[id]}</a>`)
      .join("")}</nav>
    <button class="nav__search" type="button" data-search-open aria-label="${t.search} (Ctrl K)">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
      <span>${t.search}</span><kbd data-search-kbd>Ctrl K</kbd>
    </button>
    ${langSwitch(page)}
    <a class="btn btn--sm btn--primary" href="${lp(lang, "/download/")}" data-magnetic>${t.download}</a>
    <button class="nav__burger" type="button" aria-label="${t.menu}" aria-expanded="false" data-burger><i></i><i></i></button>
  </div>
  <div class="nav__progress" aria-hidden="true"><span></span></div>
</header>`;
}

/** Build-time index for the Ctrl/⌘K palette (search.js). */
function searchIndex(ctx, page) {
  const lang = langOf(page);
  const ix = UI[lang].idx;
  const base = page?.base ?? "/";
  const at = (p) => base + lp(lang, p).replace(/^\//, "");
  const plain = (s) => String(s ?? "").replace(/\*\*|`/g, "");
  const items = [
    { k: "page", t: ix.home[0], s: ix.home[1](siteName()), h: at("/") },
    { k: "page", t: ix.guide[0], s: ix.guide[1](ctx.steps.length), h: at("/guide/") },
    { k: "page", t: ix.video[0], s: ix.video[1], h: at("/#video") },
    { k: "page", t: ix.download[0], s: siteCopy("downloadNote", lang), h: at("/download/") },
    { k: "page", t: ix.features[0], s: ix.features[1](siteName()), h: at("/#features") },
    { k: "page", t: ix.faq[0], s: ix.faq[1], h: at("/#faq") },
    ...ctx.chapters.map((c) => ({ k: "chapter", t: tr(c, "title", lang), s: tr(c, "summary", lang), h: at(`/guide/${c.id}/`), c: c.color })),
    ...ctx.steps.map((st) => {
      const c = ctx.chapters.find((x) => x.id === st.chapter);
      // Same number the chapter page shows (position inside the chapter).
      const n = ctx.steps.filter((x) => x.chapter === st.chapter).indexOf(st) + 1;
      return { k: "step", t: tr(st, "title", lang), s: plain(tr(st, "body", lang)), h: at(`/guide/${st.chapter}/#buoc-${st.id}`), c: c?.color, g: `${tr(c, "title", lang) || st.chapter} · ${ix.step} ${pad(n)}` };
    }),
    ...ctx.features.map((ft) => ({ k: "feature", t: tr(ft, "title", lang), s: plain(tr(ft, "body", lang)), h: at("/#features") })),
    ...ctx.faq.map((q, i) => ({ k: "faq", t: tr(q, "q", lang), s: plain(tr(q, "a", lang)), h: at(`/#faq-${i + 1}`) })),
  ];
  return `<script type="application/json" id="search-index">${JSON.stringify(items).replace(/</g, "\\u003c")}</script>\n`;
}

function siteFooter(page, ctx) {
  const lang = langOf(page);
  const t = UI[lang];
  return `${searchIndex(ctx, page)}<footer class="foot">
  <div class="foot__in">
    <div class="foot__brand"><img src="/favicon.svg" width="24" height="24" alt=""><span>${esc(siteName())}</span><small>${t.version} {{appVersion}}</small></div>
    <nav aria-label="${t.footNav}">
      <a href="${lp(lang, "/guide/")}">${t.nav.guide}</a><a href="${lp(lang, "/download/")}">${t.download}</a><a href="{{releasesPage}}" rel="noopener">${t.releases}</a><a href="${lp(lang, "/#faq")}">${t.nav.faq}</a>
    </nav>
    ${siteCopy("footNote", lang) ? `<p class="foot__note">${esc(siteCopy("footNote", lang))}</p>` : ""}
  </div>
</footer>`;
}

/**
 * <head> piece for every page: hreflang alternates + the language boot script. The script runs
 * before first paint: an explicit choice (dropdown) always wins; otherwise, on the very first
 * visit only, Cloudflare's same-origin /cdn-cgi/trace (edge answer, ~200 bytes, no backend)
 * says the visitor's country — VN → vi, elsewhere → en. Crawlers are never redirected.
 */
function langHead(page) {
  const origin = page?.vars?.siteOrigin ?? "";
  const base = page?.base ?? "/";
  const path = page?.path ?? "/";
  const href = (l) => `${origin}${base.slice(0, -1)}${l === "en" ? `/en${path}` : path}`;
  const alternates = [
    ...LANGS.map((l) => `<link rel="alternate" hreflang="${l}" href="${href(l)}">`),
    `<link rel="alternate" hreflang="x-default" href="${href("vi")}">`,
  ].join("\n  ");
  const boot = `(function(){var B=${JSON.stringify(base)},K="site:lang",A=K+":auto",p=location.pathname,en=p.indexOf(B+"en/")===0||p===B+"en",cur=en?"en":"vi";
if(/bot|crawl|spider|slurp|lighthouse|headless/i.test(navigator.userAgent))return;
function go(l){if(l===cur)return false;var rest=en?p.slice((B+"en").length)||"/":p.slice(B.length-1);location.replace((l==="en"?B+"en":B.slice(0,-1))+rest+location.search+location.hash);return true}
var s=null,a=null;try{s=localStorage.getItem(K);a=localStorage.getItem(A)}catch(e){}
if(s){go(s);return}if(a)return;
var d=document.documentElement,done=false;d.classList.add("lang-pending");
function fin(l){if(done)return;done=true;try{localStorage.setItem(A,l)}catch(e){}if(!go(l))d.classList.remove("lang-pending")}
setTimeout(function(){fin(/^vi/i.test(navigator.language||"")?"vi":cur)},900);
fetch("/cdn-cgi/trace",{cache:"no-store"}).then(function(r){return r.text()}).then(function(t){var m=/loc=([A-Z]{2})/.exec(t);fin(m?(m[1]==="VN"?"vi":"en"):cur)}).catch(function(){fin(cur)})})();`;
  const repo = SITE.releases?.repo ? `
  <meta name="site:release-repo" content="${esc(SITE.releases.repo)}">` : "";
  return `${alternates}${repo}
  <style>html.lang-pending body{visibility:hidden}</style>
  <script>${boot}</script>`;
}

/* ------------------------------------------------------------------ landing copy */

/** landing.json value for the page language (dotted path), falling back to the first language. */
function landingText(ctx, lang, dotted) {
  const pick = (root) => dotted.split(".").reduce((o, k) => (o == null ? o : o[k]), root);
  const langs = ctx.site?.langs ?? ["vi"];
  const v = pick(ctx.landing?.[lang]) ?? pick(ctx.landing?.[langs[0]]);
  return typeof v === "string" ? v.replaceAll("{n}", String(ctx.steps.length)) : v;
}

function statsBlock(ctx, lang) {
  const list = landingText(ctx, lang, "stats") ?? [];
  if (!list.length) return "";
  return `<ul class="wrap stats">${list
    .map((s) => {
      const value = s.text
        ? esc(s.text)
        : `${esc(s.prefix ?? "")}<span data-count="${Number(s.count)}">${Number(s.count)}</span>${esc(s.suffix ?? "")}`;
      return `<li data-reveal><b>${value}</b><span>${esc(s.label)}</span></li>`;
    })
    .join("")}</ul>`;
}

/** Three-node flow (Studio → Mixer → Encode for Video Lab); nodes link to their guide chapter. */
function pipelineBlock(ctx, lang) {
  const nodes = ctx.landing?.pipeline ?? [];
  if (!nodes.length) return "";
  const copy = landingText(ctx, lang, "pipelineNodes") ?? [];
  const stops = nodes.map((n, i) => `<stop offset="${nodes.length > 1 ? (i / (nodes.length - 1)).toFixed(2) : 0}" stop-color="${esc(n.color)}"/>`).join("");
  return `<div class="flow" data-flow style="--flow-n:${nodes.length}">
        <svg class="flow__wire" viewBox="0 0 1000 120" preserveAspectRatio="none" aria-hidden="true">
          <defs><linearGradient id="wire" x1="0" x2="1">${stops}</linearGradient></defs>
          <path class="flow__track" d="M40 60 C 200 60, 220 60, 360 60 S 520 60, 640 60 S 820 60, 960 60"/>
          <path class="flow__path" d="M40 60 C 200 60, 220 60, 360 60 S 520 60, 640 60 S 820 60, 960 60"/>
        </svg>${nodes
          .map((n, i) => {
            const chapter = ctx.chapters.find((c) => c.id === n.chapter);
            const text = copy[i] ?? {};
            return `
        <a class="flow__node" href="${lp(lang, `/guide/${n.chapter}/`)}" style="--c:${esc(n.color)}" data-flow-node>
          <span class="flow__badge">${pad(i + 1)}</span>
          <h3>${esc(text.title ?? tr(chapter, "title", lang) ?? n.chapter)}</h3>
          <p>${prose(text.body ?? "")}</p>
          <span class="flow__out">${esc(text.out ?? "")}</span>
        </a>`;
          })
          .join("")}
      </div>`;
}

function installBlock(ctx, lang) {
  const list = landingText(ctx, lang, "downloadPage.install") ?? [];
  if (!list.length) return "";
  return `<ol class="install" data-reveal>${list.map((s) => `<li><b>${prose(s.title)}</b><span>${prose(s.body)}</span></li>`).join("")}</ol>`;
}

function reqsBlock(ctx, lang) {
  const list = landingText(ctx, lang, "downloadPage.reqs") ?? [];
  if (!list.length) return "";
  return `<div class="reqs" data-reveal>${list.map((r) => `<div><small>${esc(r.label)}</small><b>${esc(r.value)}</b></div>`).join("")}</div>`;
}

/** Marker dispatcher: `<!--@name arg-->`. Unknown markers fail the build loudly. */
export function renderBlock(ctx, name, arg, page) {
  const { chapters, steps } = ctx;
  const lang = langOf(page);
  const t = UI[lang];
  switch (name) {
    case "features":
      return features(ctx.features, lang);
    case "faq":
      return faqList(ctx.faq, lang);
    case "chapters":
      return chapterCards(chapters, steps, lang);
    case "story": {
      if (arg === "highlights" && ctx.landing?.highlights?.length) arg = `pick:${ctx.landing.highlights.join(",")}`;
      if (arg?.startsWith("pick:")) {
        // Landing: a hand-picked tour (step ids), numbered as in the full guide.
        const pick = arg.slice(5).split(",").map((id) => steps.find((s) => s.id === id)).filter(Boolean);
        return story(pick, chapters, { id: "story-highlights", all: steps, lang });
      }
      const list = arg ? steps.filter((s) => s.chapter === arg) : steps;
      return story(list, chapters, { lang });
    }
    case "hero-shot": {
      const want = arg || ctx.landing?.heroShot;
      const s = steps.find((x) => x.id === want || x.shot?.endsWith(`/${want}.webp`)) ?? steps[0];
      return frame(shotImg(s?.shot, siteCopy("heroAlt", lang) || siteName(), "hero__img", { eager: true }), { title: siteName(), cls: "frame--hero" });
    }
    case "video": {
      const [file, posterId] = String(arg || "tutorial").split(/\s+/);
      const poster = steps.find((s) => s.id === posterId)?.shot ?? steps[0]?.shot;
      return videoBlock(ctx, file, { poster, title: t.videoTitle, lang });
    }
    case "chapter-nav":
      return `<nav class="toc" aria-label="${t.chapterNav}">${chapters
        .map(
          (c, i) =>
            `<a href="${lp(lang, `/guide/${c.id}/`)}" style="--c:${c.color}"${page?.chapter === c.id ? ' aria-current="page"' : ""}><span>${pad(i)}</span>${esc(tr(c, "title", lang))}</a>`,
        )
        .join("")}</nav>`;
    case "chapter-pager": {
      const i = chapters.findIndex((c) => c.id === page?.chapter);
      const prev = chapters[i - 1];
      const next = chapters[i + 1];
      return `<nav class="pager">${prev ? `<a href="${lp(lang, `/guide/${prev.id}/`)}" rel="prev"><small>${t.prevChapter}</small>${esc(tr(prev, "title", lang))}</a>` : "<span></span>"}${
        next
          ? `<a href="${lp(lang, `/guide/${next.id}/`)}" rel="next"><small>${t.nextChapter}</small>${esc(tr(next, "title", lang))}</a>`
          : `<a href="${lp(lang, "/download/")}"><small>${t.done}</small>${t.getIt(siteName())}</a>`
      }</nav>`;
    }
    case "step-count":
      return String(steps.length || "");
    case "header":
      return siteHeader(arg, page);
    case "footer":
      return siteFooter(page, ctx);
    case "lang-head":
      return langHead(page);
    case "stats":
      return statsBlock(ctx, lang);
    case "pipeline":
      return pipelineBlock(ctx, lang);
    case "install":
      return installBlock(ctx, lang);
    case "reqs":
      return reqsBlock(ctx, lang);
    default:
      throw new Error(`[site] unknown block <!--@${name}--> in ${page?.file ?? "?"}`);
  }
}

/**
 * The site lives under a path (`/intro/`, root belongs to the admin app). Pages and blocks are
 * written root-relative; this prefixes every internal href/src/srcset/poster once, at the end.
 * `/@engine/…` module entries are left for Vite, which applies `base` itself.
 */
export function withBase(html, base) {
  if (!base || base === "/") return html;
  const fix = (u) => (u.startsWith("/") && !u.startsWith("//") && !u.startsWith("/@engine/") && !u.startsWith(base) ? base + u.slice(1) : u);
  return html
    .replace(/(\s(?:href|src|poster)=")([^"]*)"/g, (_, attr, u) => `${attr}${fix(u)}"`)
    .replace(/(\ssrcset=")([^"]*)"/g, (_, attr, list) => `${attr}${list.split(",").map((part) => part.replace(/^(\s*)(\S+)/, (m, sp, u) => sp + fix(u))).join(",")}"`);
}

/** Replace `{{key}}` tokens and `<!--@block arg-->` markers in one HTML string. */
export function renderPage(html, ctx, page) {
  // Blocks first, so tokens inside block markup (footer version, links) resolve too.
  const out = html
    .replace(/<!--@([\w-]+)(?:\s+([^>]*?))?\s*-->/g, (_, name, arg) => renderBlock(ctx, name, arg?.trim(), page))
    .replace(/\{\{([\w.]+)\}\}/g, (m, k) => {
      if (k.startsWith("c.")) {
        const v = landingText(ctx, langOf(page), k.slice(2));
        if (typeof v !== "string") throw new Error(`[site] ${page.file}: landing.json has no text for {{${k}}}`);
        return esc(v);
      }
      return k in page.vars ? esc(page.vars[k]) : m;
    });
  return withBase(out, page.base);
}

/* ------------------------------------------------------------------ sections */

export const sectionsRoot = (siteRoot) => path.resolve(siteRoot, "../../sections");

/**
 * Inline `<!--@section name-->` markers with sections/<name>/section.html. Runs when pages are
 * materialised (before chapter ids are substituted), so section markup may use every page token
 * and block. Unknown sections fail the build.
 */
export function expandSections(html, sectionsDir, seen = []) {
  return html.replace(/^([ \t]*)<!--@section ([\w-]+)-->[ \t]*$/gm, (_, indent, name) => {
    if (seen.includes(name)) throw new Error(`[site] section cycle: ${[...seen, name].join(" → ")}`);
    const file = path.join(sectionsDir, name, "section.html");
    if (!fs.existsSync(file)) throw new Error(`[site] unknown section "${name}" (sections/${name}/section.html)`);
    const body = expandSections(fs.readFileSync(file, "utf8").trimEnd(), sectionsDir, [...seen, name]);
    return body.replace(/^(?=.)/gm, indent);
  });
}

/** Section names a page file uses, in order (catalog + gate read this; it is the only list). */
export const sectionsOf = (html) => [...html.matchAll(/<!--@section ([\w-]+)-->/g)].map((m) => m[1]);
