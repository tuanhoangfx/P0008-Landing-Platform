#!/usr/bin/env node
/**
 * Resolve hub auth user id for TOC_CRM_USER_ID (staging hub plane).
 * Reads HUB_SUPABASE_* from E:\Dev\.env.shared — never prints secrets.
 */
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadSharedEnv() {
  const envPath = path.resolve("E:/Dev/.env.shared");
  const out = {};
  if (!fs.existsSync(envPath)) return out;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

const env = loadSharedEnv();
const url = env.HUB_SUPABASE_URL || env.VITE_HUB_SUPABASE_URL;
const key = env.HUB_SUPABASE_SERVICE_ROLE;
const email = process.argv[2] || env.DEV_AUTO_LOGIN_EMAIL || "";

if (!url || !key) {
  console.error(JSON.stringify({ ok: false, error: "Missing HUB_SUPABASE_URL or SERVICE_ROLE in .env.shared" }));
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });

if (error) {
  console.error(JSON.stringify({ ok: false, error: error.message }));
  process.exit(1);
}

const users = data?.users || [];
const hit = email ? users.find((u) => String(u.email || "").toLowerCase() === email.toLowerCase()) : users[0];

console.log(
  JSON.stringify({
    ok: Boolean(hit?.id),
    userId: hit?.id || null,
    email: hit?.email || null,
    totalUsers: users.length,
  }),
);
