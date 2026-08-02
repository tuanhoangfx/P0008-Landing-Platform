import { useEffect, useState, type ReactNode } from "react";

const SESSION_KEY = "p0014-toc-crm-auth";

export function useTocCrmAuth() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(SESSION_KEY) === "1");

  function login(pin: string): boolean {
    const expected = String(import.meta.env.VITE_TOC_CRM_GATE_PIN ?? "").trim();
    if (!expected) {
      sessionStorage.setItem(SESSION_KEY, "1");
      setAuthed(true);
      return true;
    }
    if (pin.trim() === expected) {
      sessionStorage.setItem(SESSION_KEY, "1");
      setAuthed(true);
      return true;
    }
    return false;
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    setAuthed(false);
  }

  return { authed, login, logout, gateEnabled: Boolean(import.meta.env.VITE_TOC_CRM_GATE_PIN?.trim()) };
}

export function TocCrmAuthGate({ children }: { children: ReactNode }) {
  const { authed, login, gateEnabled } = useTocCrmAuth();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!gateEnabled) sessionStorage.setItem(SESSION_KEY, "1");
  }, [gateEnabled]);

  if (authed || !gateEnabled) return <>{children}</>;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#0b1020] p-6 text-white">
      <form
        className="w-full max-w-sm space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur"
        onSubmit={(e) => {
          e.preventDefault();
          if (!login(pin)) {
            setError("Mã PIN không đúng.");
            return;
          }
          setError(null);
        }}
      >
        <h1 className="text-lg font-bold">TOC CRM</h1>
        <p className="text-sm text-white/60">Nhập PIN nội bộ để truy cập quản trị.</p>
        <input
          type="password"
          className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-orange-400"
          placeholder="PIN"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          autoFocus
        />
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <button
          type="submit"
          className="ldp-cta ldp-animate-pulse w-full rounded-xl py-3 text-sm font-bold uppercase"
        >
          Vào CRM
        </button>
      </form>
    </div>
  );
}
