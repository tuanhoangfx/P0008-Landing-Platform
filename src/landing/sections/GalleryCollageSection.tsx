import type { LandingGalleryItem } from "@/landing/types";

type Props = {
  items: LandingGalleryItem[];
};

const LEFT: LandingGalleryItem["slot"][] = ["a", "c"];
const RIGHT: LandingGalleryItem["slot"][] = ["b", "d"];

function GalleryCell({ item, delay }: { item: LandingGalleryItem; delay: string }) {
  return (
    <figure
      className={`ldp-gallery-cell ldp-gallery-${item.slot} ldp-gallery-enter`}
      style={{ animationDelay: delay }}
    >
      <img
        src={item.image}
        alt={item.alt ?? "Model wearing hair clip"}
        className="ldp-gallery-img"
        loading="lazy"
        decoding="async"
      />
    </figure>
  );
}

/** LadiPage masonry — 232:173 columns, natural image aspect (no crop) */
export function GalleryCollageSection({ items }: Props) {
  const bySlot = Object.fromEntries(items.map((item) => [item.slot, item])) as Partial<
    Record<LandingGalleryItem["slot"], LandingGalleryItem>
  >;

  const delays: Record<LandingGalleryItem["slot"], string> = {
    a: "0.05s",
    b: "0.12s",
    c: "0.2s",
    d: "0.28s",
  };

  return (
    <section className="ldp-gallery-wrap" aria-label="Hình ảnh sản phẩm">
      <div className="ldp-gallery-masonry">
        <div className="ldp-gallery-col ldp-gallery-col-left">
          {LEFT.map((slot) => {
            const item = bySlot[slot];
            return item ? <GalleryCell key={slot} item={item} delay={delays[slot]} /> : null;
          })}
        </div>
        <div className="ldp-gallery-col ldp-gallery-col-right">
          {RIGHT.map((slot) => {
            const item = bySlot[slot];
            return item ? <GalleryCell key={slot} item={item} delay={delays[slot]} /> : null;
          })}
        </div>
      </div>
    </section>
  );
}
