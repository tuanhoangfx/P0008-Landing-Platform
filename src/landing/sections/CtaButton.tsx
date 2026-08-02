import type { LandingCta } from "@/landing/types";
import { useScrollToOrder } from "@/landing/hooks/useScrollToOrder";

type Props = {
  cta: LandingCta;
  variant?: "sticky-top" | "sticky-bottom" | "inline";
};

const btnClass =
  "ldp-cta ldp-cta-glow inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 text-base font-extrabold uppercase tracking-wide text-white transition-transform duration-200";

function IconBag() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden fill="currentColor">
      <path d="M7 18a2 2 0 100 4 2 2 0 000-4zm10 0a2 2 0 100 4 2 2 0 000-4zM7.2 16h9.7c.8 0 1.5-.5 1.8-1.2l2.4-6.5A1 1 0 0020.1 7H6.3L5.8 4.8A1 1 0 004.8 4H2v2h1.8l2.5 9.8c.1.4.5.7 1 .7z" />
    </svg>
  );
}

function CtaContent({ label }: { label: string }) {
  return (
    <>
      <IconBag />
      <span>{label}</span>
    </>
  );
}

export function CtaButton({ cta, variant = "inline" }: Props) {
  const scrollToOrder = useScrollToOrder(cta.scrollTarget);

  if (variant === "sticky-top") {
    return (
      <div className="sticky top-0 z-40 border-b border-black/5 bg-white/95 px-3 py-2 backdrop-blur-md ldp-animate-fade-in-down">
        <button type="button" className={btnClass} onClick={scrollToOrder}>
          <CtaContent label={cta.label} />
        </button>
      </div>
    );
  }

  if (variant === "sticky-bottom") {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-landing border-t border-black/5 bg-white/95 px-3 py-2 shadow-sticky backdrop-blur-md">
        <button type="button" className={btnClass} onClick={scrollToOrder}>
          <CtaContent label={cta.label} />
        </button>
      </div>
    );
  }

  return (
    <button type="button" className={btnClass} onClick={scrollToOrder}>
      <CtaContent label={cta.label} />
    </button>
  );
}
