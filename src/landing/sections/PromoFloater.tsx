import type { LandingPromo, LandingCta } from "@/landing/types";
import { useScrollToOrder } from "@/landing/hooks/useScrollToOrder";

type Props = {
  promo: LandingPromo;
  cta: LandingCta;
};

export function PromoFloater({ promo, cta }: Props) {
  const scrollToOrder = useScrollToOrder(cta.scrollTarget);

  return (
    <button
      type="button"
      onClick={scrollToOrder}
      className="ldp-promo-disc ldp-promo-float fixed bottom-[5.5rem] right-3 z-40 flex h-[4.5rem] w-[4.5rem] flex-col items-center justify-center rounded-full text-white shadow-lg transition hover:scale-105 active:scale-95"
      aria-label={promo.ctaLabel}
    >
      <span className="text-[10px] font-bold leading-none tracking-wide">ƯU ĐÃI</span>
      <span className="text-xl font-black leading-none">{promo.discountLabel}</span>
      <span className="text-[10px] font-semibold leading-tight">{promo.ctaLabel}</span>
    </button>
  );
}
