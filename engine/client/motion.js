import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./styles/main.css";
import { initSearch } from "./search.js";

gsap.registerPlugin(ScrollTrigger);

export const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const fine = matchMedia("(pointer: fine)").matches;
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

document.documentElement.classList.add("js");
const EN = document.documentElement.lang === "en";

/** Lenis drives the scroll; ScrollTrigger reads it through GSAP's ticker. */
function smoothScroll() {
  if (reduced) return null;
  const lenis = new Lenis({ duration: 1.1, easing: (t) => 1 - Math.pow(1 - t, 4), anchors: { offset: -80 } });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

function nav() {
  const el = document.querySelector("[data-nav]");
  if (!el) return;
  const bar = el.querySelector(".nav__progress span");
  // The bar stays pinned at all times (no hide-on-scroll); it only gains its glass backdrop.
  const onScroll = () => {
    const y = scrollY;
    el.classList.toggle("is-scrolled", y > 12);
    const max = document.documentElement.scrollHeight - innerHeight;
    bar?.style.setProperty("--p", max > 0 ? (y / max).toFixed(4) : 0);
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  const burger = el.querySelector("[data-burger]");
  burger?.addEventListener("click", () => {
    const open = el.classList.toggle("is-open");
    burger.setAttribute("aria-expanded", String(open));
  });
  $$(".nav__links a", el).forEach((a) => a.addEventListener("click", () => el.classList.remove("is-open")));
}

/** Wrap each word in a mask so the headline can rise word by word. */
function splitWords(el) {
  const walk = (node) => {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) return frag.append(part);
          const w = document.createElement("span");
          w.className = "w";
          const inner = document.createElement("span");
          inner.textContent = part;
          w.append(inner);
          frag.append(w);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === Node.ELEMENT_NODE) walk(child);
    }
  };
  walk(el);
  return $$(".w > span", el);
}

function heroIntro() {
  const title = document.querySelector("[data-split]");
  const items = $$("[data-hero-item]");
  if (reduced) return;
  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  if (title) {
    const words = splitWords(title);
    // Gradient text needs the clip on the word, not the <em> wrapper.
    $$("em .w > span", title).forEach((s) => s.classList.add("grad"));
    tl.from(words, { yPercent: 110, duration: 1.1, stagger: 0.06 }, 0.1);
  }
  tl.fromTo(items, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 1, stagger: 0.08 }, 0.35);
}

function reveals() {
  const els = $$("[data-reveal]");
  if (reduced) return els.forEach((e) => (e.style.opacity = 1));
  gsap.set(els, { opacity: 0, y: 28 });
  ScrollTrigger.batch(els, {
    start: "top 88%",
    once: true,
    onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 1, ease: "expo.out", stagger: 0.08, overwrite: true }),
  });
}

function counters() {
  $$("[data-count]").forEach((el) => {
    const to = Number(el.dataset.count);
    if (reduced || !to) return;
    const o = { v: 0 };
    ScrollTrigger.create({
      trigger: el,
      start: "top 92%",
      once: true,
      onEnter: () => gsap.to(o, { v: to, duration: 1.6, ease: "power3.out", onUpdate: () => (el.textContent = Math.round(o.v)) }),
    });
  });
}

/** Buttons drift a few px toward the cursor. */
function magnetic() {
  if (!fine || reduced) return;
  $$("[data-magnetic]").forEach((el) => {
    // Gentle and bounded: the old elastic pull dragged the button (and its glow) far off its slot.
    const xTo = gsap.quickTo(el, "x", { duration: 0.45, ease: "power3.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.45, ease: "power3.out" });
    const clamp = (v) => Math.max(-6, Math.min(6, v));
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      xTo(clamp((e.clientX - r.left - r.width / 2) * 0.1));
      yTo(clamp((e.clientY - r.top - r.height / 2) * 0.12));
      el.style.setProperty("--sx", `${e.clientX - r.left}px`);
    });
    el.addEventListener("pointerleave", () => (xTo(0), yTo(0)));
  });
}

/** Card spotlight follows the pointer via CSS vars. */
function spotlight() {
  if (!fine) return;
  $$("[data-spot]").forEach((el) =>
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    }),
  );
}

function faq() {
  $$(".faq__item").forEach((d) => {
    const body = d.querySelector(".faq__a");
    d.querySelector("summary").addEventListener("click", (e) => {
      if (reduced) return;
      e.preventDefault();
      if (d.open) {
        gsap.to(body, { height: 0, duration: 0.45, ease: "expo.out", onComplete: () => { d.open = false; body.style.height = ""; ScrollTrigger.refresh(); } });
      } else {
        d.open = true;
        gsap.fromTo(body, { height: 0 }, { height: "auto", duration: 0.6, ease: "expo.out", onComplete: () => ScrollTrigger.refresh() });
      }
    });
  });
  // #faq-3 (search palette) opens that answer and brings it into view.
  const openFromHash = () => {
    const d = location.hash.startsWith("#faq-") && document.getElementById(location.hash.slice(1));
    if (!d || !d.classList.contains("faq__item")) return;
    d.open = true;
    ScrollTrigger.refresh();
    setTimeout(() => d.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" }), 60);
  };
  addEventListener("hashchange", openFromHash);
  addEventListener("load", openFromHash);
}

function players() {
  $$("[data-player]").forEach((fig) => {
    const v = fig.querySelector("video");
    const btn = fig.querySelector(".player__play");
    btn?.addEventListener("click", () => v.play());
    v.addEventListener("play", () => fig.classList.add("is-playing"));
    v.addEventListener("pause", () => fig.classList.remove("is-playing"));
  });
}

/**
 * Guided tour: one active step drives the screenshot, highlight box, text panel and the
 * tab strip. Wide screens pin the section and map scroll progress onto steps (tabs scroll
 * to that step's position); narrow screens just switch on tap / arrows.
 */
function tours(lenis) {
  const wide = matchMedia("(min-width: 1001px) and (min-height: 620px)");
  $$("[data-tour]").forEach((tour) => {
    const tabs = $$(".tour__tab", tour);
    const shots = $$(".tour__shot", tour);
    const panels = $$(".tour__panel", tour);
    const hl = tour.querySelector(".tour__hl");
    const strip = tour.querySelector(".tour__strip");
    const bar = tour.querySelector(".tour__progress i");
    const idx = tour.querySelector("[data-tour-index]");
    const prev = tour.querySelector("[data-tour-prev]");
    const next = tour.querySelector("[data-tour-next]");
    const n = tabs.length;
    let cur = -1;
    let pin = null;

    const activate = (i) => {
      i = Math.max(0, Math.min(n - 1, i));
      if (i === cur) return;
      cur = i;
      const tab = tabs[i];
      const id = tab.dataset.step;
      tabs.forEach((t, k) => {
        t.classList.toggle("is-on", k === i);
        t.classList.toggle("is-done", k < i);
        t.setAttribute("aria-selected", String(k === i));
      });
      shots.forEach((img) => img.classList.toggle("is-on", img.dataset.for === id));
      panels.forEach((p) => {
        const on = p.dataset.for === id;
        p.classList.toggle("is-on", on);
        p.toggleAttribute("aria-hidden", !on);
      });
      if (idx) idx.textContent = String(i + 1).padStart(2, "0");
      if (prev) prev.disabled = i === 0;
      if (next) next.disabled = i === n - 1;
      bar?.style.setProperty("--p", (n > 1 ? i / (n - 1) : 1).toFixed(3));
      // Keep the active tab centred without moving the page.
      strip?.scrollTo({ left: tab.offsetLeft - strip.clientWidth / 2 + tab.offsetWidth / 2, behavior: reduced ? "auto" : "smooth" });
      if (hl) {
        const box = tab.dataset.hl?.split(",").map(Number);
        hl.style.setProperty("--hl", getComputedStyle(tab).getPropertyValue("--c"));
        if (box?.length === 4) {
          const [x, y, w, h] = box;
          Object.assign(hl.style, { left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%` });
          hl.classList.add("is-on");
        } else hl.classList.remove("is-on");
      }
    };

    const go = (i) => {
      i = Math.max(0, Math.min(n - 1, i));
      if (pin) {
        const y = pin.start + (pin.end - pin.start) * (n > 1 ? (i + 0.5) / n : 0);
        if (lenis) lenis.scrollTo(y, { duration: 0.9 });
        else scrollTo({ top: y, behavior: reduced ? "auto" : "smooth" });
      }
      activate(i);
    };

    const setup = () => {
      pin?.kill(true);
      pin = null;
      tour.classList.toggle("is-pinned", wide.matches && !reduced && n > 1);
      if (tour.classList.contains("is-pinned")) {
        pin = ScrollTrigger.create({
          trigger: tour,
          start: () => `top top+=${(parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-h")) || 64) + 12}`,
          end: () => `+=${Math.round(innerHeight * 0.42 * n)}`,
          pin: true,
          pinSpacing: true,
          anticipatePin: 1,
          onUpdate: (self) => activate(Math.min(n - 1, Math.floor(self.progress * n))),
        });
      }
      ScrollTrigger.refresh();
    };

    tabs.forEach((t, i) => t.addEventListener("click", () => go(i)));
    prev?.addEventListener("click", () => go(cur - 1));
    next?.addEventListener("click", () => go(cur + 1));
    tour.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") (e.preventDefault(), go(cur + 1));
      if (e.key === "ArrowLeft") (e.preventDefault(), go(cur - 1));
    });
    activate(0);
    setup();
    wide.addEventListener("change", setup);

    // #buoc-<step id> (search palette, shared links) opens that step in this tour.
    const fromHash = (instant = false) => {
      const id = location.hash.startsWith("#buoc-") ? decodeURIComponent(location.hash.slice(6)) : "";
      const i = tabs.findIndex((t) => t.dataset.step === id);
      if (i < 0) return;
      ScrollTrigger.refresh();
      const y = pin ? pin.start + (pin.end - pin.start) * ((i + 0.5) / n) : tour.getBoundingClientRect().top + scrollY - 80;
      // On page load jump without easing: a smooth scroll racing the load-time refresh lands short.
      if (lenis) lenis.scrollTo(y, instant ? { immediate: true, force: true } : { duration: 0.9 });
      else scrollTo({ top: y, behavior: instant || reduced ? "auto" : "smooth" });
      activate(i);
    };
    addEventListener("hashchange", () => fromHash(false));
    // after fonts/images settle, so the pin's start/end are final
    addEventListener("load", () => setTimeout(() => fromHash(true), 250));
  });
}

/**
 * Duotone glyphs for <section data-rail-icon="…">: `b` is the soft filled layer, `l` the line
 * layer. Each icon owns a gradient pair (g1 → g2) used for its tile, strokes and glow.
 */
const RAIL_ICONS = {
  home: {
    g: ["#c084fc", "#6366f1"],
    b: '<path d="M4 10.5 12 4l8 6.5V20H4Z"/>',
    l: '<path d="m3 10.5 9-7.5 9 7.5"/><path d="M5 9v11h14V9"/><path d="M10 20v-5.5h4V20"/>',
  },
  flow: {
    g: ["#34d399", "#06b6d4"],
    b: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
    l: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/><path d="M10 6.5h3.5A3.5 3.5 0 0 1 17 10v4"/><path d="m15 12 2 2 2-2"/>',
  },
  sparkles: {
    g: ["#fbbf24", "#f472b6"],
    b: '<path d="m10 3 1.8 5.2L17 10l-5.2 1.8L10 17l-1.8-5.2L3 10l5.2-1.8Z"/>',
    l: '<path d="m10 3 1.8 5.2L17 10l-5.2 1.8L10 17l-1.8-5.2L3 10l5.2-1.8Z"/><path d="M18.5 14.5v5M16 17h5"/><path d="M18 3.5v3M16.5 5h3"/>',
  },
  book: {
    g: ["#60a5fa", "#22d3ee"],
    b: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H12v16H6.5A2.5 2.5 0 0 0 4 21.5Z"/>',
    l: '<path d="M12 6v14"/><path d="M4 19.5v-14A2.5 2.5 0 0 1 6.5 3H12v16H6.5A2.5 2.5 0 0 0 4 21.5"/><path d="M12 3h5.5A2.5 2.5 0 0 1 20 5.5v14h-5.5A2.5 2.5 0 0 0 12 22"/>',
  },
  play: {
    g: ["#fb7185", "#f97316"],
    b: '<rect x="2.5" y="4.5" width="19" height="15" rx="4"/>',
    l: '<rect x="2.5" y="4.5" width="19" height="15" rx="4"/><path d="m10 9 5 3-5 3Z" fill="currentColor"/>',
  },
  help: {
    g: ["#38bdf8", "#a78bfa"],
    b: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H11l-5 4v-4h0.5A2.5 2.5 0 0 1 4 13.5Z"/>',
    l: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H11l-5 4v-4h.5A2.5 2.5 0 0 1 4 13.5Z"/><path d="M10 7.8a2 2 0 1 1 2.6 1.9c-.4.2-.6.5-.6.9v.4"/><path d="M12 12.8v.01"/>',
  },
  download: {
    g: ["#818cf8", "#e879f9"],
    b: '<path d="M4 15h16v3.5A2.5 2.5 0 0 1 17.5 21h-11A2.5 2.5 0 0 1 4 18.5Z"/>',
    l: '<path d="M12 3v11"/><path d="m7.5 9.5 4.5 4.5 4.5-4.5"/><path d="M4 15v3.5A2.5 2.5 0 0 0 6.5 21h11a2.5 2.5 0 0 0 2.5-2.5V15"/>',
  },
  layers: {
    g: ["#a78bfa", "#38bdf8"],
    b: '<path d="m12 3 9 5-9 5-9-5Z"/>',
    l: '<path d="m12 3 9 5-9 5-9-5Z"/><path d="m3 12.5 9 5 9-5"/><path d="m3 17 9 5 9-5"/>',
  },
  list: {
    g: ["#2dd4bf", "#818cf8"],
    b: '<rect x="3" y="3" width="18" height="18" rx="4"/>',
    l: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M8 8.5h8M8 12h8M8 15.5h5"/>',
  },
};

const railColors = (name) => {
  const [g1, g2] = (RAIL_ICONS[name] ?? RAIL_ICONS.list).g;
  return `--g1:${g1};--g2:${g2}`;
};

function railIcon(name, id) {
  const ic = RAIL_ICONS[name] ?? RAIL_ICONS.list;
  const gid = `rg-${id}`;
  return `<span class="rail__ico"><svg viewBox="0 0 24 24" aria-hidden="true">
    <defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${ic.g[0]}"/><stop offset="1" stop-color="${ic.g[1]}"/></linearGradient></defs>
    <g class="rail__b" fill="url(#${gid})">${ic.b}</g>
    <g class="rail__l" fill="none" stroke="url(#${gid})" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${ic.l}</g>
  </svg></span>`;
}

/**
 * Section index pinned to the left edge on wide screens, built from
 * <section data-rail="Label" data-rail-icon="…">. Always visible; the active section is lit.
 */
function sectionRail(lenis) {
  const sections = $$("section[data-rail]").filter((s) => !s.hidden);
  if (sections.length < 3) return;
  const nav = document.createElement("nav");
  nav.className = "rail";
  nav.setAttribute("aria-label", EN ? "On this page" : "Mục lục trang");
  nav.innerHTML = sections
    .map(
      (s) =>
        `<a href="#${s.id}" data-rail-for="${s.id}" title="${s.dataset.rail}" style="${railColors(s.dataset.railIcon)}">${railIcon(s.dataset.railIcon, s.id)}<span>${s.dataset.rail}</span></a>`,
    )
    .join("");
  document.body.append(nav);
  const links = $$("a", nav);
  links.forEach((a) =>
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const target = document.getElementById(a.dataset.railFor);
      if (lenis) lenis.scrollTo(target, { offset: -70, duration: 1.1 });
      else target.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
    }),
  );
  sections.forEach((s) =>
    ScrollTrigger.create({
      trigger: s,
      start: "top 45%",
      end: "bottom 45%",
      onToggle: (self) => self.isActive && links.forEach((a) => a.classList.toggle("is-on", a.dataset.railFor === s.id)),
    }),
  );
  links[0].classList.add("is-on");
  document.documentElement.classList.add("has-rail");
}

/**
 * Flag + language dropdown in the top bar. Picking a language stores it as an explicit choice,
 * which the <head> boot script (render.mjs langHead) honours on every later visit.
 */
function langMenu() {
  $$("[data-lang]").forEach((root) => {
    const btn = root.querySelector("[data-lang-btn]");
    const menu = root.querySelector(".lang__menu");
    const items = $$("a", menu);
    const set = (open) => {
      menu.hidden = !open;
      btn.setAttribute("aria-expanded", String(open));
      root.classList.toggle("is-open", open);
      if (open) (items.find((a) => a.getAttribute("aria-selected") === "true") ?? items[0])?.focus();
    };
    btn.addEventListener("click", (e) => (e.stopPropagation(), set(menu.hidden)));
    document.addEventListener("click", (e) => !root.contains(e.target) && set(false));
    root.addEventListener("keydown", (e) => {
      if (e.key === "Escape") (set(false), btn.focus());
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (menu.hidden) return set(true);
        const i = items.indexOf(document.activeElement);
        items[(i + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length]?.focus();
      }
    });
    items.forEach((a) =>
      a.addEventListener("click", () => {
        try {
          localStorage.setItem("site:lang", a.dataset.langPick);
        } catch {
          /* private mode: the link still switches this page */
        }
        // keep the reader's place: same section / step anchor on the other language
        if (location.hash) a.href = a.href.split("#")[0] + location.hash;
      }),
    );
  });
}

/** Refresh every download button/label with the newest GitHub release. */
const RELEASE_CACHE = "site:release";
/** owner/repo of the GitHub Releases feed, from <meta name="site:release-repo"> (render.mjs langHead). */
const RELEASE_REPO = document.querySelector('meta[name="site:release-repo"]')?.content ?? "";
const RELEASE_TTL_MS = 30 * 60 * 1000;

/** GitHub allows 60 unauthenticated calls/hour per IP — one per browser per half hour is plenty. */
async function latestRelease() {
  try {
    const hit = JSON.parse(localStorage.getItem(RELEASE_CACHE) || "null");
    if (hit && Date.now() - hit.at < RELEASE_TTL_MS) return hit.rel;
  } catch {
    /* storage blocked — just fetch */
  }
  if (!RELEASE_REPO) return null;
  const res = await fetch(`https://api.github.com/repos/${RELEASE_REPO}/releases/latest`, {
    headers: { accept: "application/vnd.github+json" },
  });
  if (!res.ok) return null;
  const j = await res.json();
  const exe = (j.assets || []).find((a) => /Setup.*\.exe$/i.test(a.name));
  if (!exe) return null;
  const rel = { tag: j.tag_name, url: exe.browser_download_url, size: `${Math.round(exe.size / 1024 / 1024)} MB` };
  try {
    localStorage.setItem(RELEASE_CACHE, JSON.stringify({ at: Date.now(), rel }));
  } catch {
    /* ignore */
  }
  return rel;
}

export async function refreshRelease() {
  try {
    const rel = await latestRelease();
    if (!rel) return null;
    $$("[data-release-tag]").forEach((el) => (el.textContent = el.closest(".pill") ? `${EN ? "New" : "Bản mới"} ${rel.tag}` : rel.tag));
    $$("[data-release-size]").forEach((el) => (el.textContent = rel.size));
    $$("[data-release-meta]").forEach((el) => (el.textContent = el.closest(".cta") ? `${rel.tag} · ${rel.size}` : rel.size));
    $$("[data-dl-link]").forEach((a) => (a.href = rel.url));
    return rel;
  } catch {
    return null;
  }
}

export function boot({ extra } = {}) {
  const lenis = smoothScroll();
  nav();
  heroIntro();
  reveals();
  counters();
  magnetic();
  spotlight();
  faq();
  players();
  tours(lenis);
  sectionRail(lenis);
  initSearch({ lenis });
  langMenu();
  extra?.({ gsap, ScrollTrigger, lenis, reduced });
  refreshRelease();
  // Images above the fold change layout height once decoded.
  addEventListener("load", () => ScrollTrigger.refresh());
}

export { gsap, ScrollTrigger };
