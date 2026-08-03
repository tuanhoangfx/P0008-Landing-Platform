import path from "node:path";
import fs from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, type PluginOption } from "vite";
import { hubAppVersionPlugin } from "./scripts/hub-app-version-vite-plugin.mjs";

const toolRoot = path.dirname(fileURLToPath(import.meta.url));
const devRoot = path.resolve(toolRoot, "../..");
const hubUiVendorWatchPluginPath = path.resolve(toolRoot, "../scripts/hub-ui-vendor-watch-vite-plugin.mjs");
const hubUiVendorWatchPlugin = fs.existsSync(hubUiVendorWatchPluginPath)
  ? import(pathToFileURL(hubUiVendorWatchPluginPath).href).then((m) =>
      m.hubUiVendorWatchPlugin({ toolRoot, devRoot, code: "P0008" }),
    )
  : null;
const hubUiSrc = path.resolve(toolRoot, "vendor/hub-ui/src");
const hubIdentitySrc = path.resolve(toolRoot, "vendor/hub-identity/src");
const onVercel = Boolean(process.env.VERCEL);
const hubQueryPackages = path.resolve(devRoot, "packages/hub-query/src");
const hubQueryVendor = path.resolve(toolRoot, "vendor/hub-query/src");
const hubQuerySrc =
  !onVercel && fs.existsSync(path.join(hubQueryPackages, "index.ts"))
    ? hubQueryPackages
    : hubQueryVendor;

function supabaseResolve(subpath: string): string {
  for (const base of [toolRoot, devRoot]) {
    try {
      return createRequire(path.join(base, "package.json")).resolve(subpath);
    } catch {
      /* try next */
    }
  }
  try {
    const supabaseEntry = createRequire(path.join(toolRoot, "package.json")).resolve(
      "@supabase/supabase-js",
    );
    return createRequire(supabaseEntry).resolve(subpath);
  } catch {
    throw new Error(
      `Cannot resolve ${subpath} — add it to P0008 dependencies or run pnpm install`,
    );
  }
}

const SUPABASE_ALIASES = [
  "@supabase/supabase-js",
  "@supabase/postgrest-js",
  "@supabase/realtime-js",
  "@supabase/auth-js",
  "@supabase/storage-js",
  "@supabase/functions-js",
].map((pkg) => ({ find: pkg, replacement: supabaseResolve(pkg) }));

export default defineConfig(async () => {
  const plugins: PluginOption[] = [react(), hubAppVersionPlugin({ root: toolRoot }), hubUiVendorWatchPlugin];

  return {
    plugins,
    server: {
      host: "127.0.0.1",
      port: 3008,
      strictPort: true,
      fs: {
        allow: [toolRoot, hubUiSrc, hubIdentitySrc, hubQuerySrc, devRoot],
      },
    },
    optimizeDeps: {
      include: ["react", "react-dom", "lucide-react"],
      exclude: ["@tool-workspace/hub-ui", "@tool-workspace/hub-identity", "@tool-workspace/hub-query"],
    },
    resolve: {
      dedupe: ["react", "react-dom"],
      alias: [
        ...SUPABASE_ALIASES,
        { find: /^@tool-workspace\/hub-ui\/(.+)$/, replacement: `${hubUiSrc}/$1` },
        { find: "@tool-workspace/hub-ui", replacement: path.join(hubUiSrc, "index.ts") },
        { find: "@tool-workspace/hub-identity", replacement: path.join(hubIdentitySrc, "index.ts") },
        { find: /^@tool-workspace\/hub-identity\/(.+)$/, replacement: `${hubIdentitySrc}/$1` },
        { find: /^@tool-workspace\/hub-query\/(.+)$/, replacement: `${hubQuerySrc}/$1` },
        { find: "@tool-workspace/hub-query", replacement: path.join(hubQuerySrc, "index.ts") },
        { find: "@", replacement: path.join(toolRoot, "src") },
      ],
    },
    esbuild: {
      target: "es2022",
    },
  };
});
