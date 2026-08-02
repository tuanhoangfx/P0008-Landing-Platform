type Props = {
  badgeImage?: string;
  platformIcon?: string;
};

/** LadiPage footer — trust badge + platform mark */
export function LandingFooterSection({ badgeImage, platformIcon }: Props) {
  if (!badgeImage && !platformIcon) return null;

  return (
    <footer className="ldp-footer bg-white px-4 pb-6 pt-2">
      {badgeImage ? (
        <img
          src={badgeImage}
          alt="Trust badge"
          className="ldp-footer-badge mx-auto block w-full max-w-[360px]"
          loading="lazy"
          decoding="async"
        />
      ) : null}
      {platformIcon ? (
        <div className="mt-3 flex justify-center opacity-70">
          <img src={platformIcon} alt="" className="h-8 w-auto" loading="lazy" aria-hidden />
        </div>
      ) : null}
    </footer>
  );
}
