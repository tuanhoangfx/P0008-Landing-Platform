# Hair Landing SSOT (P0014)

## Purpose

Reusable landing page system for hair product COD funnels. One config file per product; shared section components.

## Section map

| Section ID | Component | Config key |
|------------|-----------|------------|
| hero | `HeroSection` | `hero` |
| urgency | `UrgencyBanner` | `urgency` |
| stats | `StatsBar` | `stats` |
| specs | `ProductSpecs` | `specs` |
| features | `FeatureBlocks` | `featureBlocks` |
| style | `StyleSection` | `styleSection` |
| beforeAfter | `BeforeAfterSection` | `beforeAfter` |
| benefits | `BenefitsSection` | `benefits` |
| colors | `ColorVariantsSection` | `colors` |
| video | `VideoSection` | `video` |
| order | `OrderFormSection` | `order` + `pricing` |
| reviews | `ReviewsSection` | `reviews` |
| policies | `PolicySection` | `policies` |
| promo | `PromoFloater` | `promo` |

## Design tokens

Default theme in `src/landing/types.ts` → `DEFAULT_LANDING_THEME`:

- Primary CTA: `#f36e36`
- Urgency accent: `#e01a1a`
- Gold highlight: `#ef9300`
- Mobile viewport: `max-w-[420px]` (LadiPage-style)

Override per product via `config.theme`.

## Images

Reference clone uses CDN URLs from source LadiPage. For production:

1. Download assets to `public/products/{slug}/`
2. Update config paths to `/products/{slug}/...`

## Order pipeline (future)

- Current: `localStorage` key `p0014-orders-{slug}`
- Target: POST → P0005 CRM orders API or Supabase edge function

## Clone workflow

1. Fetch reference HTML (LadiPage / Shopify / custom)
2. Extract copy + image URLs
3. Map to `HairLandingConfig`
4. Register slug → deploy Vercel with path or subdomain
