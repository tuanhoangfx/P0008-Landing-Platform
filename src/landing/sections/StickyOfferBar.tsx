import type { LandingCta, LandingStickyOffer } from "@/landing/types";
import { useScrollToOrder } from "@/landing/hooks/useScrollToOrder";

type Props = {
  offer: LandingStickyOffer;
  cta: LandingCta;
};

function IconInfo() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <circle cx="12" cy="12" r="10" fill="#ffffff" />
      <path fill="#aa1f1f" d="M11 10h2v7h-2zm0-3h2v2h-2z" />
    </svg>
  );
}

function IconCart() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden fill="currentColor">
      <path d="M7 18a2 2 0 100 4 2 2 0 000-4zm10 0a2 2 0 100 4 2 2 0 000-4zM7.2 16h9.7c.8 0 1.5-.5 1.8-1.2l2.4-6.5A1 1 0 0020.1 7H6.3L5.8 4.8A1 1 0 004.8 4H2v2h1.8l2.5 9.8c.1.4.5.7 1 .7z" />
    </svg>
  );
}

/** LadiPage SECTION8 — burgundy sticky bar */
export function StickyOfferBar({ offer, cta }: Props) {
  const scrollToOrder = useScrollToOrder(cta.scrollTarget);

  return (
    <div className="ldp-sticky-offer ldp-sticky-enter fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-landing">
      <div className="flex h-[54px] items-center justify-between px-3 sm:px-4">
        <div className="flex items-center gap-2.5">
          <span className="ldp-sticky-icon flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#aa1f1f] shadow-sm">
            <IconInfo />
          </span>
          <span className="text-[13px] font-extrabold uppercase tracking-wide text-white">
            ƯU ĐÃI <span className="ldp-price-glow-inline">{offer.discountLabel}</span>
          </span>
        </div>
        <button
          type="button"
          onClick={scrollToOrder}
          className="ldp-sticky-cta group flex items-center gap-2 rounded-full bg-white/12 px-3 py-2 text-[13px] font-extrabold text-white transition hover:bg-white/20 active:scale-95"
        >
          <span className="transition group-hover:scale-110">
            <IconCart />
          </span>
          {offer.ctaLabel}
        </button>
      </div>
    </div>
  );
}
