import type { LandingStats } from "@/landing/types";

type Props = { stats: LandingStats };

function StatCell({ value, label, stars }: { value: string; label: string; stars?: boolean }) {
  return (
    <div className="flex flex-1 flex-col items-center border-r border-hair-surface/80 px-2 py-4 last:border-r-0">
      {stars ? (
        <div className="flex items-center gap-0.5 text-sm ldp-star" aria-hidden>
          {"★★★★★".split("").map((s, i) => (
            <span key={i}>{s}</span>
          ))}
        </div>
      ) : null}
      <span className="text-xl font-extrabold text-hair-ink">{value}</span>
      <span className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-hair-muted">{label}</span>
    </div>
  );
}

export function StatsBar({ stats }: Props) {
  return (
    <section className="ldp-stat-card mx-4 flex overflow-hidden rounded-2xl border border-hair-surface">
      <StatCell value={stats.rating.toFixed(1)} label={stats.ratingLabel} stars />
      <StatCell value={stats.sold.toLocaleString("vi-VN")} label={stats.soldLabel} />
      <StatCell value={stats.views.toLocaleString("vi-VN")} label={stats.viewsLabel} />
    </section>
  );
}
