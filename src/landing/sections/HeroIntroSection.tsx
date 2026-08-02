import type { LandingHero } from "@/landing/types";

type Props = { hero: LandingHero };

export function HeroIntroSection({ hero }: Props) {
  const [from, to] = hero.introBackground ?? ["#f1fcff", "#d0f1ff"];

  return (
    <section
      className="px-3 pb-2 pt-4 text-center"
      style={{ background: `linear-gradient(180deg, ${from}, ${to})` }}
    >
      <h1
        className="ldp-animate-fade-in-down font-display text-[26px] font-extrabold leading-snug"
        style={{ color: "#0644a2" }}
      >
        {hero.title}
        <br />
        {hero.subtitle}
      </h1>
      {hero.tagline ? (
        <p className="ldp-animate-fade-in-down mt-2 font-tagline text-lg font-bold italic text-black" style={{ animationDelay: "0.15s" }}>
          {hero.tagline}
        </p>
      ) : null}
    </section>
  );
}
