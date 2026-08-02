import { useState, type FormEvent } from "react";
import type { HairLandingConfig } from "@/landing/types";
import { formatVnd } from "@/landing/types";
import { submitLandingOrder } from "@/lib/submit-landing-order";

type Props = {
  config: HairLandingConfig;
};

type FormState = Record<string, string>;

function buildInitialState(config: HairLandingConfig): FormState {
  const state: FormState = {};
  for (const field of config.order.fields) {
    state[field.id] = field.type === "select" && field.options?.[0] ? field.options[0].value : "";
  }
  return state;
}

export function OrderFormSection({ config }: Props) {
  const { order, pricing } = config;
  const [form, setForm] = useState<FormState>(() => buildInitialState(config));
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedTier = pricing.find((t) => t.id === form[order.tierFieldId ?? "tier"]);
  const total =
    selectedTier &&
    selectedTier.price + (selectedTier.shipping === "free" ? 0 : selectedTier.shipping);

  function updateField(id: string, value: string) {
    setForm((prev) => ({ ...prev, [id]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    for (const field of order.fields) {
      if (field.required && !form[field.id]?.trim()) {
        setError(`Vui lòng nhập ${field.label.toLowerCase()}.`);
        return;
      }
    }

    const result = await submitLandingOrder({
      productSlug: config.slug,
      name: form.name ?? "",
      phone: form.phone ?? "",
      address: form.address ?? "",
      tier: form[order.tierFieldId ?? "tier"] ?? "",
      color: form[order.colorFieldId ?? "color"] ?? "",
      note: form.note,
      total: total ?? undefined,
    });

    if (!result.ok) {
      try {
        const key = `p0014-orders-${config.slug}`;
        const existing = JSON.parse(localStorage.getItem(key) ?? "[]") as unknown[];
        existing.push({ ...form, total, submittedAt: new Date().toISOString(), apiError: result.error });
        localStorage.setItem(key, JSON.stringify(existing));
      } catch {
        /* optional */
      }
      setError(result.error);
      return;
    }

    setSubmitted(true);
  }

  if (submitted) {
    return (
      <section id="order-form" className="mx-4 scroll-mt-16 rounded-xl bg-green-50 p-6 text-center">
        <p className="text-lg font-bold text-green-700">✓ {order.successMessage}</p>
      </section>
    );
  }

  return (
    <section id="order-form" className="mx-4 scroll-mt-16 rounded-xl border border-hair-surface bg-white p-4 shadow-sm">
      <h2 className="mb-4 text-center text-base font-extrabold text-hair-accent">{order.title}</h2>

      <div className="mb-4 space-y-2">
        {pricing.map((tier) => (
          <div
            key={tier.id}
            className={`rounded-lg border px-3 py-2 text-sm ${
              form[order.tierFieldId ?? "tier"] === tier.id
                ? "border-hair-primary bg-hair-highlight/30 font-semibold"
                : "border-hair-surface"
            }`}
          >
            {tier.label}: {formatVnd(tier.price)}
            {tier.shippingNote ? ` + ${tier.shippingNote}` : ""}
          </div>
        ))}
      </div>

      <form className="space-y-3" onSubmit={handleSubmit}>
        {order.fields.map((field) => (
          <label key={field.id} className="block">
            <span className="mb-1 block text-xs font-semibold text-hair-ink">
              {field.label}
              {field.required ? <span className="text-hair-accent"> *</span> : null}
            </span>
            {field.type === "textarea" ? (
              <textarea
                className="w-full rounded-lg border border-hair-surface px-3 py-2 text-sm outline-none focus:border-hair-primary"
                rows={3}
                placeholder={field.placeholder}
                value={form[field.id] ?? ""}
                onChange={(e) => updateField(field.id, e.target.value)}
              />
            ) : field.type === "select" ? (
              <select
                className="w-full rounded-lg border border-hair-surface px-3 py-2 text-sm outline-none focus:border-hair-primary"
                value={form[field.id] ?? ""}
                onChange={(e) => updateField(field.id, e.target.value)}
              >
                {field.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={field.type ?? "text"}
                className="w-full rounded-lg border border-hair-surface px-3 py-2 text-sm outline-none focus:border-hair-primary"
                placeholder={field.placeholder}
                value={form[field.id] ?? ""}
                onChange={(e) => updateField(field.id, e.target.value)}
              />
            )}
          </label>
        ))}

        {total != null ? (
          <p className="text-center text-sm font-bold text-hair-primary">
            Tổng thanh toán (COD): {formatVnd(total)}
          </p>
        ) : null}

        {error ? <p className="text-center text-sm text-hair-accent">{error}</p> : null}

        <button
          type="submit"
          className="ldp-order-submit w-full rounded-xl py-4 text-sm font-extrabold uppercase text-white shadow-cta"
        >
          {order.submitLabel}
        </button>
      </form>
    </section>
  );
}
