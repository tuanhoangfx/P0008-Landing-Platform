/**
 * Public landing order intake → TOC CRM Supabase (separate tenant).
 * Env: TOC_SUPABASE_URL, TOC_SUPABASE_SERVICE_ROLE, TOC_CRM_USER_ID
 */
import { createClient } from "@supabase/supabase-js";

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function requiredEnv(name) {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

export default async function handler(req) {
  if (req.method !== "POST") {
    return json(405, { ok: false, error: "Method not allowed" });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return json(400, { ok: false, error: "Invalid JSON" });
  }

  const name = String(body.name ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  const address = String(body.address ?? "").trim();
  const tier = String(body.tier ?? "").trim();
  const color = String(body.color ?? "").trim();
  const productSlug = String(body.productSlug ?? "001").trim();
  const note = String(body.note ?? "").trim();
  const total = Number(body.total);

  if (!name || !phone || !address) {
    return json(400, { ok: false, error: "Missing required fields" });
  }

  try {
    const url = requiredEnv("TOC_SUPABASE_URL");
    const key = requiredEnv("TOC_SUPABASE_SERVICE_ROLE");
    const userId = requiredEnv("TOC_CRM_USER_ID");
    const supabase = createClient(url, key, { auth: { persistSession: false } });

    const displayName = `${name} · ${phone}`;
    const { data: customer, error: customerError } = await supabase
      .from("order_desk_customers")
      .insert({
        user_id: userId,
        display_name: displayName,
        phone,
        notes: address,
        metadata: { source: "p0008-landing", product_slug: productSlug, path_code: productSlug },
      })
      .select("id")
      .single();

    if (customerError) {
      return json(500, { ok: false, error: customerError.message });
    }

    const productLabel = "Kẹp tóc giả đuôi ngựa đính nơ HQ";
    const orderNotes = [
      `Landing: ${productSlug}`,
      `Tier: ${tier}`,
      `Color: ${color}`,
      note ? `Note: ${note}` : null,
      `Address: ${address}`,
    ]
      .filter(Boolean)
      .join("\n");

    const { data: order, error: orderError } = await supabase
      .from("order_desk_orders")
      .insert({
        user_id: userId,
        customer_id: customer.id,
        product_name: productLabel,
        title: productLabel,
        amount_cents: Number.isFinite(total) ? Math.round(total) : null,
        currency: "VND",
        qty: tier === "2-clip" ? 2 : 1,
        notes: orderNotes,
        sheet_status: "⏳ Pending",
        metadata: {
          source: "p0008-landing",
          landing_path: productSlug,
          tier,
          color,
          ship_address: address,
          pay_status: "💳 Unpaid",
        },
      })
      .select("id")
      .single();

    if (orderError) {
      return json(500, { ok: false, error: orderError.message });
    }

    return json(200, { ok: true, orderId: order.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return json(500, { ok: false, error: message });
  }
}
