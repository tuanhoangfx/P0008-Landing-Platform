import type { HairLandingConfig } from "@/landing/types";
import { mapConfigAssets } from "./resolve-asset";
import { mieHairCodV1 } from "./templates/mie-hair-cod-v1";

export type LandingPageStatus = "draft" | "published";

export type LandingPageRecord = {
  pathCode: string;
  templateId: string;
  title: string;
  brandId: string;
  status: LandingPageStatus;
};

/** SSOT registry — add pages here until Supabase plane ships. */
export const LANDING_PAGES: LandingPageRecord[] = [
  {
    pathCode: "001",
    templateId: "mie-hair-cod-v1",
    title: "Mie Hair — Kẹp đuôi ngựa nơ HQ",
    brandId: "mie-hair",
    status: "published",
  },
];

export const TEMPLATE_REGISTRY: Record<string, HairLandingConfig> = {
  "mie-hair-cod-v1": mieHairCodV1,
};

export function resolvePageRecord(pathCode?: string | null): LandingPageRecord | null {
  if (!pathCode) return null;
  return LANDING_PAGES.find((p) => p.pathCode === pathCode) ?? null;
}

export function resolvePageConfig(pathCode?: string | null): HairLandingConfig {
  const page = resolvePageRecord(pathCode);
  const templateId = page?.templateId ?? "mie-hair-cod-v1";
  const base = TEMPLATE_REGISTRY[templateId] ?? mieHairCodV1;
  return mapConfigAssets({
    ...base,
    slug: page?.pathCode ?? base.slug,
    meta: {
      ...base.meta,
      title: page?.title ?? base.meta.title,
    },
  });
}
