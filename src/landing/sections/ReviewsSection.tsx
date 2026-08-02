import type { LandingReview } from "@/landing/types";

type Props = {
  title: string;
  count: number;
  items: LandingReview[];
};

function TypingIndicator() {
  return (
    <div className="mb-4 flex items-center gap-2 rounded-xl bg-hair-surface/80 px-3 py-2.5 text-sm text-hair-muted">
      <span>Ai đó đang nhập bình luận...</span>
      <span className="inline-flex items-center" aria-hidden>
        <span className="ldp-typing-dot" />
        <span className="ldp-typing-dot" />
        <span className="ldp-typing-dot" />
      </span>
    </div>
  );
}

export function ReviewsSection({ title, count, items }: Props) {
  return (
    <section className="bg-white px-4 py-5">
      <h2 className="text-center text-base font-extrabold text-hair-ink">{count} Bình luận</h2>
      <h3 className="mt-1 text-center text-xs font-bold uppercase tracking-wide text-hair-muted">{title}</h3>

      <div className="mt-4">
        <TypingIndicator />
        <div className="space-y-4">
          {items.map((review, index) => (
            <article
              key={review.id}
              className="flex gap-3 border-b border-hair-surface pb-4 last:border-0"
              style={{ animationDelay: `${index * 120}ms` }}
            >
              {review.avatar ? (
                <img
                  src={review.avatar}
                  alt={review.author}
                  className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-hair-highlight"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-hair-surface text-sm font-bold text-hair-muted">
                  {review.author.charAt(0)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-relaxed text-hair-ink">{review.text}</p>
                {review.photos?.length ? (
                  <div className="ldp-review-photos mt-2 grid grid-cols-2 gap-1.5">
                    {review.photos.map((src) => (
                      <img
                        key={src}
                        src={src}
                        alt=""
                        className="ldp-review-photo w-full rounded-md border border-white shadow-sm"
                        loading="lazy"
                        decoding="async"
                      />
                    ))}
                  </div>
                ) : null}
                <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-hair-muted">
                  <span className="font-semibold text-hair-ink">{review.author}</span>
                  <span>·</span>
                  <span className="text-hair-primary">Thích {review.likes}</span>
                  <span>·</span>
                  <span>{review.timeAgo}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
