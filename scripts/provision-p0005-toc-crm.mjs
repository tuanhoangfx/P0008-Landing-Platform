#!/usr/bin/env node
/**
 * Provision second P0005 Vercel deploy for TOC brand (toc-crm.infi.io.vn).
 * Same P0005-CRM repo, hub Supabase env — iframe target for P0014 /crm.
 */
import fs from "node:fs";
import { upsertProjectEnv } from "../../scripts/lib/vercel-env-upsert.mjs";

function loadSharedEnv() {
  const out = {};
  const envPath = "E:/Dev/.env.shared";
  if (!fs.existsSync(envPath)) return out;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

const env = loadSharedEnv();
const token = env.VERCEL_TOKEN;
const team = "tuanhoangfxs-projects";
const projectName = "p0005-toc-crm";
const domain = "toc-crm.infi.io.vn";
const targets = ["production", "preview", "development"];

if (!token) {
  console.error(JSON.stringify({ ok: false, error: "Missing VERCEL_TOKEN" }));
  process.exit(1);
}

let projectId = process.argv[2] || "";

if (!projectId) {
  const list = await fetch(`https://api.vercel.com/v9/projects?teamId=${team}&search=${projectName}`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then((r) => r.json());
  const hit = (list.projects || []).find((p) => p.name === projectName);
  if (hit?.id) projectId = hit.id;
}

if (!projectId) {
  const body = {
    name: projectName,
    framework: "vite",
    buildCommand: "npm run build",
    outputDirectory: "dist",
    installCommand: "npm install",
    gitRepository: { type: "github", repo: "tuanhoangfx/P0005-CRM" },
  };
  const r = await fetch(`https://api.vercel.com/v10/projects?teamId=${team}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const j = await r.json();
  if (!r.ok) {
    console.error(JSON.stringify({ ok: false, step: "create", error: j }));
    process.exit(1);
  }
  projectId = j.id;
  console.log(JSON.stringify({ ok: true, step: "create", projectId, name: projectName }));
}

const domRes = await fetch(`https://api.vercel.com/v10/projects/${projectId}/domains?teamId=${team}`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify({ name: domain }),
});
const domBody = await domRes.json();
console.log(JSON.stringify({ ok: domRes.ok, step: "domain", domain, status: domRes.status, body: domBody.name || domBody }));

const hubUrl = env.HUB_SUPABASE_URL || env.VITE_HUB_SUPABASE_URL || "https://hub-api.infi.io.vn";
const hubAnon = env.HUB_SUPABASE_ANON_KEY || env.VITE_HUB_SUPABASE_ANON_KEY;
const hubService = env.HUB_SUPABASE_SERVICE_ROLE;

const envPairs = [
  ["VITE_HUB_SUPABASE_URL", hubUrl],
  ["VITE_SUPABASE_URL", hubUrl],
  ["VITE_HUB_SUPABASE_ANON_KEY", hubAnon],
  ["VITE_SUPABASE_ANON_KEY", hubAnon],
  ["HUB_SUPABASE_URL", hubUrl],
  ["HUB_SUPABASE_ANON_KEY", hubAnon],
  ["HUB_SUPABASE_SERVICE_ROLE", hubService],
  ["VITE_APP_BRAND", "TOC"],
];

const envResults = [];
for (const [key, value] of envPairs) {
  if (!value) {
    envResults.push({ key, ok: false, error: "missing" });
    continue;
  }
  try {
    const r = await upsertProjectEnv({
      projectId,
      teamSlug: team,
      token,
      key,
      value,
      targets,
      type: key.includes("SERVICE") ? "encrypted" : key.startsWith("VITE_") ? "plain" : "encrypted",
    });
    envResults.push({ key, ok: true, action: r.action });
  } catch (e) {
    envResults.push({ key, ok: false, error: String(e?.message || e) });
  }
}

const deploy = await fetch(`https://api.vercel.com/v13/deployments?teamId=${team}`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    name: projectName,
    project: projectName,
    target: "production",
    gitSource: {
      type: "github",
      repo: "P0005-CRM",
      org: "tuanhoangfx",
      ref: "main",
    },
  }),
});
const deployBody = await deploy.json();
console.log(
  JSON.stringify({
    ok: envResults.every((r) => r.ok) && deploy.ok,
    projectId,
    crmOrigin: `https://${domain}`,
    envResults,
    deploy: { status: deploy.status, url: deployBody.url, id: deployBody.id },
  }, null, 2),
);
