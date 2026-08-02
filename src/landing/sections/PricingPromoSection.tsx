import type { LandingPricingPromo } from "@/landing/types";
import { PricingPromoTickets } from "@/landing/sections/PricingPromoTickets";

type Props = {
  promo?: LandingPricingPromo;
  image?: string;
};

export function PricingPromoSection({ promo, image }: Props) {
  if (promo) {
    return <PricingPromoTickets promo={promo} />;
  }

  if (!image) return null;

  return (
    <section className="ldp-pricing-section" aria-label="Khuyến mãi">
      <img src={image} alt="Khuyến mãi" className="ldp-pricing-fallback mx-auto block w-full max-w-[420px]" />
    </section>
  );
}
