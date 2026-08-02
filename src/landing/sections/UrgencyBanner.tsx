import type { LandingUrgency } from "@/landing/types";
import { useUrgencyCounter } from "@/landing/hooks/useUrgencyCounter";

type Props = { urgency: LandingUrgency };

export function UrgencyBanner({ urgency }: Props) {
  const count = useUrgencyCounter(urgency.stockCount);

  if (!urgency.enabled) return null;

  return (
    <section className="ldp-urgency-bg px-4 py-5 text-center">
      <p className="text-sm font-bold uppercase tracking-wide text-hair-accent">{urgency.headline}</p>
      <p className="text-xs font-medium text-hair-muted">{urgency.subheadline}</p>
      <p className="ldp-animate-flash ldp-animate-bounce-in mt-2 text-6xl font-black tabular-nums text-hair-accent">
        {count}
      </p>
      {urgency.stockLabel ? (
        <p className="ldp-animate-pulse mt-2 text-base font-extrabold text-hair-gold">{urgency.stockLabel}</p>
      ) : null}
    </section>
  );
}
