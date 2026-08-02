import type { LandingHero } from "@/landing/types";

type Props = { hero: LandingHero };

export function HeroSection({ hero }: Props) {
  return (
    <section className="overflow-hidden bg-white">
      <img
        src={hero.bannerImage}
        alt={hero.title}
        className="ldp-section-image ldp-animate-fade-in-down"
        loading="eager"
        decoding="async"
      />
      <div className="space-y-2 px-4 py-5 text-center">
        <h1 className="ldp-animate-bounce-in text-[22px] font-extrabold leading-tight text-hair-ink">
          {hero.title}
          <br />
          <span className="ldp-shimmer-text">{hero.subtitle}</span>
        </h1>
        {hero.tagline ? (
          <p className="text-sm font-semibold italic text-hair-muted">{hero.tagline}</p>
        ) : null}
      </div>
    </section>
  );
}
