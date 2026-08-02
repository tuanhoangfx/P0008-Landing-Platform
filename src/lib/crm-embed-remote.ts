/**
 * TOC CRM embed — separate P0005 deploy (own Supabase tenant), iframe like P0026.
 * @see docs/TOC-PORTAL-ARCHITECTURE.md
 */
import type { TocCrmScreen } from "./crm-screen";
import packageJson from "../../package.json";

const DEFAULT_ORIGIN = "http://127.0.0.1:3005";

const PATH_BY_SCREEN: Record<TocCrmScreen, string> = {
  orders: "/orders",
  customers: "/customers",
  products: "/products",
};

export function tocCrmEmbedRemoteEnabled(): boolean {
  return String(import.meta.env.VITE_TOC_CRM_EMBED_REMOTE ?? "1").trim() !== "0";
}

export function tocHostPortalVersion(): string {
  const fromEnv = String(import.meta.env.VITE_APP_VERSION ?? "").trim();
  return (fromEnv || packageJson.version).replace(/^v/i, "");
}

export function tocCrmOrigin(): string {
  const override = String(import.meta.env.VITE_TOC_CRM_ORIGIN ?? "").trim();
  return (override || DEFAULT_ORIGIN).replace(/\/+$/, "");
}

/** Prod iframe → TOC CRM instance (P0005 codebase, separate Supabase). */
export function tocCrmEmbedUrl(screen: TocCrmScreen): string {
  const base = `${tocCrmOrigin()}${PATH_BY_SCREEN[screen]}`;
  const url = new URL(base);
  url.searchParams.set("embed", "1");
  url.searchParams.set("hostCode", "P0014");
  url.searchParams.set("hostVersion", tocHostPortalVersion());
  return url.toString();
}
