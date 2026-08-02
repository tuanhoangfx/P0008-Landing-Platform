import type { LandingPricingPromo } from "@/landing/types";

type Props = {
  promo: LandingPricingPromo;
};

/** CSS replica of LadiPage 3-ticket pricing row — full fidelity, no GIF crop */
export function PricingPromoTickets({ promo }: Props) {
  return (
    <section className="ldp-pricing-section" aria-label="Khuyến mãi">
      <div className="ldp-tickets-row">
        <article className="ldp-ticket ldp-ticket-side ldp-ticket-left ldp-enter-left">
          <p className="ldp-ticket-kicker">GIẢM GIÁ</p>
          <p className="ldp-ticket-hero ldp-price-glow">{promo.discountPct}</p>
          <p className="ldp-ticket-foot">MỌI ĐƠN HÀNG</p>
        </article>

        <article className="ldp-ticket ldp-ticket-center ldp-enter-pop">
          <div className="ldp-ticket-bow ldp-bow-float" aria-hidden>
            <span className="text-3xl leading-none">🎀</span>
          </div>
          <p className="ldp-ticket-kicker-center">1 KẸP GIÁ CHỈ CÒN</p>
          <p className="ldp-ticket-price ldp-price-glow">{promo.centerPrice}</p>
          <p className="ldp-ticket-ship">{promo.shipNote}</p>
        </article>

        <article className="ldp-ticket ldp-ticket-side ldp-ticket-right ldp-enter-right">
          <p className="ldp-ticket-kicker">GIÁ GỐC</p>
          <p className="ldp-ticket-strike">{promo.originalPrice}</p>
          <p className="ldp-ticket-foot ldp-ticket-foot-accent">DUY NHẤT HÔM NAY</p>
        </article>
      </div>
    </section>
  );
}
