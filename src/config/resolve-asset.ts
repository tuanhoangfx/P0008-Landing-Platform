import assetMap from "./001-asset-map.json";

const map = assetMap as Record<string, string>;

/** Resolve mirrored local asset or pass through absolute URL. */
export function resolveLandingAsset(url: string): string {
  return map[url] ?? url;
}

/** Deep-map all image URLs in config objects to local /products paths. */
export function mapConfigAssets<T>(value: T): T {
  if (typeof value === "string") {
    return (map[value] ?? value) as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => mapConfigAssets(item)) as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = mapConfigAssets(v);
    }
    return out as T;
  }
  return value;
}
