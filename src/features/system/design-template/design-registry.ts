/** Design Template registry — empty until a review is explicitly requested (skill design-preview-5). */
export type ActiveDesignFeature = { id: string; title: string; subtitle: string; project: string };

const FEATURES: ActiveDesignFeature[] = [];

export const ACTIVE_DESIGN_COUNT = FEATURES.length;

export function listActiveDesignFeatures(): ActiveDesignFeature[] {
  return [...FEATURES];
}
