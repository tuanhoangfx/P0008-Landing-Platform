/**
 * catalog.json — written by engine/catalog.mjs at build time (derived from templates/, sections/,
 * sites/ on disk; nothing hand-listed). The admin is read-only: it never writes back.
 */
import { useEffect, useState } from "react";

export type CatalogPage = { rel: string; sections: string[] };

export type CatalogTemplate = {
  id: string;
  title: string;
  description: string;
  origin: string | null;
  pages: CatalogPage[];
  sectionCount: number;
  sites: string[];
  sourcePath: string;
};

export type CatalogSection = {
  name: string;
  title: string;
  description: string;
  group: string;
  chapter: boolean;
  usedIn: string[];
  blocks: string[];
  tokens: string[];
  tokenRoots: string[];
  previewUrl: string;
  sourcePath: string;
};

export type CatalogSite = {
  id: string;
  name: string;
  product: string | null;
  registryKey: string | null;
  template: string;
  origin: string;
  base: string;
  url: string;
  domain: string;
  langs: string[];
  langUrls: { lang: string; url: string }[];
  steps: number;
  chapters: number;
  features: number;
  faq: number;
  lead: string;
  ogImage: string;
  devPort: number | null;
  releasesRepo: string | null;
  configPath: string;
};

export type Catalog = {
  schema: 1;
  generatedAt: string;
  platformVersion: string;
  origin: string;
  previewBase: string;
  sample: { siteId: string; siteName: string; chapter: string };
  counts: { templates: number; sections: number; sites: number };
  templates: CatalogTemplate[];
  sections: CatalogSection[];
  sites: CatalogSite[];
};

export type CatalogState =
  | { status: "loading"; catalog: null; error: null }
  | { status: "ready"; catalog: Catalog; error: null }
  | { status: "error"; catalog: null; error: string };

let cache: Promise<Catalog> | null = null;

export function loadCatalog(): Promise<Catalog> {
  cache ??= fetch(`/catalog.json?v=${encodeURIComponent(import.meta.env.VITE_APP_BUILT_AT ?? "")}`, {
    cache: "no-cache",
  }).then(async (res) => {
    if (!res.ok) throw new Error(`catalog.json ${res.status} — build it with node engine/catalog.mjs`);
    const json = (await res.json()) as Catalog;
    if (json.schema !== 1) throw new Error(`catalog.json schema ${String(json.schema)} not supported`);
    return json;
  });
  cache.catch(() => {
    cache = null;
  });
  return cache;
}

export function useCatalog(): CatalogState {
  const [state, setState] = useState<CatalogState>({ status: "loading", catalog: null, error: null });
  useEffect(() => {
    let alive = true;
    loadCatalog().then(
      (catalog) => alive && setState({ status: "ready", catalog, error: null }),
      (err: unknown) =>
        alive && setState({ status: "error", catalog: null, error: err instanceof Error ? err.message : String(err) }),
    );
    return () => {
      alive = false;
    };
  }, []);
  return state;
}

/** Absolute URL for opening a preview / page in a new tab from any host (dev or prod). */
export function absoluteUrl(url: string): string {
  return new URL(url, window.location.origin).toString();
}
