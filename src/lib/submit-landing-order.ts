export type LandingOrderPayload = {
  productSlug: string;
  name: string;
  phone: string;
  address: string;
  tier: string;
  color: string;
  note?: string;
  total?: number;
};

export type LandingOrderResult =
  | { ok: true; orderId?: string }
  | { ok: false; error: string };

export async function submitLandingOrder(payload: LandingOrderPayload): Promise<LandingOrderResult> {
  try {
    const res = await fetch("/api/landing-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as { ok?: boolean; orderId?: string; error?: string };
    if (!res.ok || !data.ok) {
      return { ok: false, error: data.error ?? `HTTP ${res.status}` };
    }
    return { ok: true, orderId: data.orderId };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Network error";
    return { ok: false, error: message };
  }
}
