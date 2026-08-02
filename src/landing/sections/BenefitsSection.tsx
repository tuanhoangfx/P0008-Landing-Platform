import type { LandingBenefit } from "@/landing/types";

type Props = { benefits: LandingBenefit[] };

export function BenefitsSection({ benefits }: Props) {
  return (
    <section className="space-y-0 bg-white">
      {benefits.map((b) => (
        <article key={b.title} className="overflow-hidden">
          <img src={b.image} alt={b.title} className="block w-full" loading="lazy" />
          <div className="space-y-1 px-4 py-4 text-center">
            <h3 className="text-base font-bold text-hair-ink">{b.title}</h3>
            <p className="text-sm text-hair-muted">{b.description}</p>
          </div>
        </article>
      ))}
    </section>
  );
}
