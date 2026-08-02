type Props = {
  title: string;
  image: string;
  bullets: string[];
};

export function StyleSection({ title, image, bullets }: Props) {
  return (
    <section className="bg-white">
      <img src={image} alt={title} className="block w-full" loading="lazy" />
      <div className="space-y-3 px-4 py-5">
        <h2 className="text-center text-lg font-extrabold text-hair-ink">{title}</h2>
        <ul className="space-y-2 text-sm leading-relaxed text-hair-muted">
          {bullets.map((b) => (
            <li key={b} className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-hair-primary" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
