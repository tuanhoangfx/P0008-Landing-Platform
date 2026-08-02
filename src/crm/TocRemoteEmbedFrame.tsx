import { useMemo, useState } from "react";
import { tocCrmEmbedUrl } from "@/lib/crm-embed-remote";
import { crmScreenLabel, type TocCrmScreen } from "@/lib/crm-screen";

type Props = { screen: TocCrmScreen };

export function TocRemoteEmbedFrame({ screen }: Props) {
  const [reloadNonce, setReloadNonce] = useState(0);
  const baseSrc = useMemo(() => tocCrmEmbedUrl(screen), [screen]);
  const title = crmScreenLabel(screen);

  const src = useMemo(() => {
    if (!reloadNonce) return baseSrc;
    const join = baseSrc.includes("?") ? "&" : "?";
    return `${baseSrc}${join}_r=${reloadNonce}`;
  }, [baseSrc, reloadNonce]);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-[#0b1020]">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 text-xs text-white/70">
        <span>TOC CRM · {title}</span>
        <button
          type="button"
          className="rounded px-2 py-1 hover:bg-white/10"
          onClick={() => setReloadNonce((n) => n + 1)}
        >
          Reload
        </button>
      </div>
      <iframe
        title={title}
        src={src}
        className="min-h-0 flex-1 border-0 bg-[#0b1020]"
        allow="clipboard-read; clipboard-write"
      />
    </div>
  );
}
