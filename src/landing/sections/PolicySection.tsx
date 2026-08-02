import type { LandingPolicy } from "@/landing/types";

type Props = { policies: LandingPolicy[] };

export function PolicySection({ policies }: Props) {
  return (
    <section className="space-y-4 bg-hair-surface/50 px-4 py-6">
      <h2 className="text-center text-sm font-extrabold uppercase text-hair-ink">
        Chính sách bán hàng
      </h2>
      {policies.map((policy) => (
        <div key={policy.title}>
          <h3 className="text-sm font-bold text-hair-ink">{policy.title}</h3>
          <ul className="mt-1 list-disc pl-5 text-sm text-hair-muted">
            {policy.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
