import type { LandingFeatureBlock } from "@/landing/types";

type Props = { blocks: LandingFeatureBlock[] };

export function FeatureBlocks({ blocks }: Props) {
  return (
    <section className="space-y-0">
      {blocks.map((block, i) => (
        <figure key={`${block.image}-${i}`} className="overflow-hidden">
          <img
            src={block.image}
            alt={block.alt ?? block.title ?? "Product feature"}
            className="ldp-section-image"
            loading="lazy"
            decoding="async"
          />
          {block.title || block.bullets?.length ? (
            <figcaption className="space-y-2 px-4 py-4">
              {block.title ? (
                <h2 className="text-center text-base font-bold text-hair-ink">{block.title}</h2>
              ) : null}
              {block.bullets?.length ? (
                <ul className="list-disc space-y-1 pl-5 text-sm text-hair-muted">
                  {block.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              ) : null}
            </figcaption>
          ) : null}
        </figure>
      ))}
    </section>
  );
}
