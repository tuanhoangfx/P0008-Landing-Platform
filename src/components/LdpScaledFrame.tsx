import { useLayoutEffect, useRef, useState } from "react";

/** Desktop viewport the engine preview is laid out at, then scaled down to the box. */
const VIEWPORT_W = 1440;

type Props = {
  src: string;
  title: string;
  className?: string;
  /** Card thumbnails: no pointer events, no focus. */
  inert?: boolean;
};

/**
 * Live engine render of one section (`/preview/…`) shown at desktop width and scaled to fit the box —
 * the same HTML/CSS/JS that ships to production, never a screenshot.
 */
export function LdpScaledFrame({ src, title, className = "", inert = false }: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });

  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const measure = () => setBox({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scale = box.w > 0 ? box.w / VIEWPORT_W : 0;
  return (
    <div ref={boxRef} className={`ldp-scaled-frame ${className}`.trim()} data-inert={inert ? "" : undefined}>
      {scale > 0 ? (
        <iframe
          key={src}
          src={src}
          title={title}
          loading="lazy"
          tabIndex={inert ? -1 : undefined}
          style={{ width: VIEWPORT_W, height: Math.ceil(box.h / scale), transform: `scale(${scale})` }}
        />
      ) : null}
    </div>
  );
}
