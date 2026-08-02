import { useState } from "react";
import type { LandingColorVariant } from "@/landing/types";

type Props = {
  title: string;
  subtitle?: string;
  variants: LandingColorVariant[];
};

export function ColorVariantsSection({ title, subtitle, variants }: Props) {
  const [active, setActive] = useState(0);
  const current = variants[active];

  return (
    <section className="bg-white px-4 py-5">
      <h2 className="text-center text-lg font-extrabold text-hair-ink">{title}</h2>
      {subtitle ? <p className="mt-1 text-center text-sm text-hair-muted">{subtitle}</p> : null}

      <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
        {variants.map((v, i) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setActive(i)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              i === active
                ? "bg-hair-primary text-white"
                : "bg-hair-surface text-hair-muted hover:bg-hair-highlight/50"
            }`}
          >
            {v.name}
          </button>
        ))}
      </div>

      <img
        src={current.image}
        alt={current.name}
        className="mt-3 w-full rounded-xl"
        loading="lazy"
      />
      <p className="mt-3 text-sm leading-relaxed text-hair-muted">{current.description}</p>
    </section>
  );
}
