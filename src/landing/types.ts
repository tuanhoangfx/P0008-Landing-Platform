/** SSOT types for hair product landing pages (P0014). */

export type LandingTheme = {
  primary: string;
  accent: string;
  gold: string;
  highlight: string;
};

export type LandingCta = {
  label: string;
  scrollTarget?: string;
};

export type LandingHero = {
  /** @deprecated Use intro layout — optional legacy full-width banner below fold */
  bannerImage?: string;
  title: string;
  subtitle: string;
  tagline?: string;
  /** Pale blue gradient hero (LadiPage SECTION14) */
  introBackground?: [string, string];
  /** Animated pricing tickets GIF — fallback; prefer pricingPromo CSS */
  pricingBanner?: string;
  /** CSS ticket row (recommended — no crop) */
  pricingPromo?: LandingPricingPromo;
  /** 4-up model gallery collage */
  gallery?: LandingGalleryItem[];
};

export type LandingPricingPromo = {
  discountPct: string;
  centerPrice: string;
  originalPrice: string;
  shipNote: string;
};

export type LandingGalleryItem = {
  image: string;
  alt?: string;
  /** Column layout: a/c = left, b/d = right (LadiPage masonry) */
  slot: "a" | "b" | "c" | "d";
};

export type LandingStickyOffer = {
  discountLabel: string;
  ctaLabel: string;
};

export type LandingUrgency = {
  enabled: boolean;
  headline: string;
  subheadline: string;
  stockCount: number;
  stockLabel: string;
  ctaHint?: string;
};

export type LandingStats = {
  rating: number;
  ratingLabel: string;
  sold: number;
  soldLabel: string;
  views: number;
  viewsLabel: string;
};

export type LandingSpecItem = {
  label: string;
  value: string;
};

export type LandingFeatureBlock = {
  image: string;
  title?: string;
  bullets?: string[];
  alt?: string;
};

export type LandingBeforeAfter = {
  title?: string;
  before: { image: string; label: string };
  after: { image: string; label: string };
};

export type LandingBenefit = {
  image: string;
  title: string;
  description: string;
};

export type LandingColorVariant = {
  id: string;
  name: string;
  image: string;
  description: string;
};

export type LandingVideo = {
  title: string;
  subtitle?: string;
  poster: string;
  embedUrl?: string;
  gifFallback?: string;
};

export type LandingPricingTier = {
  id: string;
  label: string;
  price: number;
  shipping: number | "free";
  shippingNote?: string;
};

export type LandingOrderField = {
  id: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  type?: "text" | "tel" | "textarea" | "select";
  options?: { value: string; label: string }[];
};

export type LandingReview = {
  id: string;
  author: string;
  avatar?: string;
  text: string;
  likes: number;
  timeAgo: string;
  /** Customer product photos (LadiPage review gallery) */
  photos?: string[];
};

export type LandingFooter = {
  badgeImage?: string;
  platformIcon?: string;
};

export type LandingPolicy = {
  title: string;
  items: string[];
};

export type LandingPromo = {
  discountLabel: string;
  ctaLabel: string;
};

export type HairLandingConfig = {
  slug: string;
  meta: {
    title: string;
    description: string;
    keywords?: string[];
  };
  theme?: Partial<LandingTheme>;
  cta: LandingCta;
  hero: LandingHero;
  urgency?: LandingUrgency;
  stats: LandingStats;
  specs: LandingSpecItem[];
  featureBlocks: LandingFeatureBlock[];
  styleSection?: {
    title: string;
    image: string;
    bullets: string[];
  };
  beforeAfter?: LandingBeforeAfter[];
  benefits?: LandingBenefit[];
  colors?: {
    title: string;
    subtitle?: string;
    variants: LandingColorVariant[];
  };
  video?: LandingVideo;
  pricing: LandingPricingTier[];
  order: {
    title: string;
    fields: LandingOrderField[];
    colorFieldId?: string;
    tierFieldId?: string;
    submitLabel: string;
    successMessage: string;
  };
  reviews?: {
    title: string;
    count: number;
    items: LandingReview[];
  };
  policies?: LandingPolicy[];
  promo?: LandingPromo;
  stickyOffer?: LandingStickyOffer;
  footer?: LandingFooter;
};

export type HairLandingSectionId =
  | "hero"
  | "urgency"
  | "stats"
  | "specs"
  | "features"
  | "style"
  | "beforeAfter"
  | "benefits"
  | "colors"
  | "video"
  | "order"
  | "reviews"
  | "policies"
  | "promo"
  | "stickyOffer"
  | "pricingBanner"
  | "gallery";

export const DEFAULT_LANDING_THEME: LandingTheme = {
  primary: "#f36e36",
  accent: "#e01a1a",
  gold: "#ef9300",
  highlight: "#fde298",
};

export function resolveTheme(partial?: Partial<LandingTheme>): LandingTheme {
  return { ...DEFAULT_LANDING_THEME, ...partial };
}

export function formatVnd(amount: number): string {
  return `${amount.toLocaleString("vi-VN")}đ`;
}
