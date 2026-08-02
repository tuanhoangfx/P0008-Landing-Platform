import type { LandingBeforeAfter } from "@/landing/types";

type Props = { items: LandingBeforeAfter[] };

export function BeforeAfterSection({ items }: Props) {
  return (
    <section className="space-y-6 bg-white py-4">
      {items.map((item, i) => (
        <div key={i} className="space-y-3 px-3">
          {item.title ? (
            <h2 className="text-center text-sm font-bold leading-snug text-hair-ink">{item.title}</h2>
          ) : null}
          <div className="grid grid-cols-2 gap-2">
            <figure className="overflow-hidden rounded-xl shadow-md">
              <img src={item.before.image} alt={item.before.label} className="ldp-section-image" loading="lazy" />
              <figcaption className="ldp-before-label py-2 text-center text-xs font-bold text-white">
                {item.before.label}
              </figcaption>
            </figure>
            <figure className="overflow-hidden rounded-xl shadow-md ring-2 ring-hair-primary/30">
              <img src={item.after.image} alt={item.after.label} className="ldp-section-image" loading="lazy" />
              <figcaption className="ldp-after-label py-2 text-center text-xs font-bold text-white">
                {item.after.label}
              </figcaption>
            </figure>
          </div>
        </div>
      ))}
    </section>
  );
}
