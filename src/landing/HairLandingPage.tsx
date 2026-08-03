import { useEffect, type CSSProperties } from "react";
import "../index.css";
import "./landing-effects.css";
import type { HairLandingConfig } from "@/landing/types";
import { resolveTheme } from "@/landing/types";
import { RevealBlock } from "@/landing/components/RevealBlock";
import { HeroIntroSection } from "@/landing/sections/HeroIntroSection";
import { PricingPromoSection } from "@/landing/sections/PricingPromoSection";
import { GalleryCollageSection } from "@/landing/sections/GalleryCollageSection";
import { CtaButton } from "@/landing/sections/CtaButton";
import { UrgencyBanner } from "@/landing/sections/UrgencyBanner";
import { StatsBar } from "@/landing/sections/StatsBar";
import { ProductSpecs } from "@/landing/sections/ProductSpecs";
import { FeatureBlocks } from "@/landing/sections/FeatureBlocks";
import { StyleSection } from "@/landing/sections/StyleSection";
import { BeforeAfterSection } from "@/landing/sections/BeforeAfterSection";
import { BenefitsSection } from "@/landing/sections/BenefitsSection";
import { ColorVariantsSection } from "@/landing/sections/ColorVariantsSection";
import { VideoSection } from "@/landing/sections/VideoSection";
import { OrderFormSection } from "@/landing/sections/OrderFormSection";
import { ReviewsSection } from "@/landing/sections/ReviewsSection";
import { PolicySection } from "@/landing/sections/PolicySection";
import { LandingFooterSection } from "@/landing/sections/LandingFooterSection";
import { PromoFloater } from "@/landing/sections/PromoFloater";
import { StickyOfferBar } from "@/landing/sections/StickyOfferBar";

type Props = {
  config: HairLandingConfig;
};

export function HairLandingPage({ config }: Props) {
  const theme = resolveTheme(config.theme);
  const useStickyOffer = Boolean(config.stickyOffer);

  useEffect(() => {
    document.title = config.meta.title;
    document.body.classList.add("ldp-body");
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", config.meta.description);
    else {
      const meta = document.createElement("meta");
      meta.name = "description";
      meta.content = config.meta.description;
      document.head.appendChild(meta);
    }
    return () => document.body.classList.remove("ldp-body");
  }, [config.meta]);

  return (
    <div
      className={`ldp-page relative mx-auto min-h-screen max-w-landing bg-white ${useStickyOffer ? "pb-14" : "pb-24"}`}
      style={
        {
          "--hair-primary": theme.primary,
          "--hair-accent": theme.accent,
        } as CSSProperties
      }
    >
      <HeroIntroSection hero={config.hero} />

      {config.hero.pricingPromo || config.hero.pricingBanner ? (
        <PricingPromoSection
          promo={config.hero.pricingPromo}
          image={config.hero.pricingBanner}
        />
      ) : null}

      {config.hero.gallery?.length ? (
        <GalleryCollageSection items={config.hero.gallery} />
      ) : null}

      <RevealBlock className="px-4 py-4">
        <CtaButton cta={config.cta} />
      </RevealBlock>

      {config.urgency ? <UrgencyBanner urgency={config.urgency} /> : null}

      <RevealBlock className="py-4">
        <StatsBar stats={config.stats} />
      </RevealBlock>

      <RevealBlock delayMs={80}>
        <ProductSpecs specs={config.specs} />
      </RevealBlock>

      <RevealBlock delayMs={120} className="px-4 py-4">
        <CtaButton cta={config.cta} />
      </RevealBlock>

      <RevealBlock>
        <FeatureBlocks blocks={config.featureBlocks} />
      </RevealBlock>

      {config.styleSection ? (
        <RevealBlock delayMs={100}>
          <StyleSection
            title={config.styleSection.title}
            image={config.styleSection.image}
            bullets={config.styleSection.bullets}
          />
        </RevealBlock>
      ) : null}

      {config.beforeAfter?.length ? (
        <RevealBlock delayMs={120}>
          <BeforeAfterSection items={config.beforeAfter} />
        </RevealBlock>
      ) : null}

      {config.benefits?.length ? (
        <RevealBlock>
          <BenefitsSection benefits={config.benefits} />
        </RevealBlock>
      ) : null}

      <RevealBlock className="px-4 py-4">
        <CtaButton cta={config.cta} />
      </RevealBlock>

      {config.colors ? (
        <RevealBlock delayMs={80}>
          <ColorVariantsSection
            title={config.colors.title}
            subtitle={config.colors.subtitle}
            variants={config.colors.variants}
          />
        </RevealBlock>
      ) : null}

      {config.video ? (
        <RevealBlock>
          <VideoSection video={config.video} />
        </RevealBlock>
      ) : null}

      <RevealBlock className="px-4 py-4">
        <p className="mb-3 text-center text-sm font-semibold text-hair-muted">
          Nâng tầm khí chất, tạm biệt mái tóc thưa mỏng, thần thái ngút ngàn
        </p>
        <CtaButton cta={config.cta} />
      </RevealBlock>

      <RevealBlock delayMs={100}>
        <OrderFormSection config={config} />
      </RevealBlock>

      {config.reviews ? (
        <RevealBlock>
          <ReviewsSection
            title={config.reviews.title}
            count={config.reviews.count}
            items={config.reviews.items}
          />
        </RevealBlock>
      ) : null}

      {config.policies?.length ? (
        <RevealBlock>
          <PolicySection policies={config.policies} />
        </RevealBlock>
      ) : null}

      {config.footer ? (
        <RevealBlock delayMs={60}>
          <LandingFooterSection
            badgeImage={config.footer.badgeImage}
            platformIcon={config.footer.platformIcon}
          />
        </RevealBlock>
      ) : null}

      {!useStickyOffer && config.promo ? (
        <PromoFloater promo={config.promo} cta={config.cta} />
      ) : null}

      {useStickyOffer && config.stickyOffer ? (
        <StickyOfferBar offer={config.stickyOffer} cta={config.cta} />
      ) : (
        <CtaButton cta={config.cta} variant="sticky-bottom" />
      )}
    </div>
  );
}
