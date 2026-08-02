import type { LandingSpecItem } from "@/landing/types";

type Props = { specs: LandingSpecItem[] };

export function ProductSpecs({ specs }: Props) {
  return (
    <section className="mx-4 mt-4 rounded-xl bg-hair-surface/70 p-4">
      <ul className="space-y-2 text-sm leading-relaxed text-hair-ink">
        {specs.map((item) => (
          <li key={item.label}>
            <span className="font-bold">{item.label}: </span>
            <span>{item.value}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
