import type { LandingVideo } from "@/landing/types";

type Props = { video: LandingVideo };

export function VideoSection({ video }: Props) {
  return (
    <section className="bg-white px-4 py-5">
      <h2 className="text-center text-base font-extrabold text-hair-ink">{video.title}</h2>
      {video.subtitle ? (
        <p className="mt-2 text-center text-sm text-hair-muted">{video.subtitle}</p>
      ) : null}
      <div className="mt-4 overflow-hidden rounded-xl bg-black/5">
        {video.embedUrl ? (
          <iframe
            src={video.embedUrl}
            title={video.title}
            className="aspect-video w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : video.gifFallback ? (
          <img src={video.gifFallback} alt={video.title} className="w-full" loading="lazy" />
        ) : (
          <img src={video.poster} alt={video.title} className="w-full" loading="lazy" />
        )}
      </div>
    </section>
  );
}
