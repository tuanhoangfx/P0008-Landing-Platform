/**
 * ldp.infi.io.vn admin — Hub-UI management app for the Landing Platform library.
 *
 * Alias tool (no vendor/): @tool-workspace/hub-* resolve straight to E:/Dev/packages/* (P0002/P0024 pattern).
 * The engine builds (engine/site.mjs) use `configFile: false`, so this file only ever drives the admin.
 *
 * Data: dist/catalog.json + dist/preview/** come from engine/catalog.mjs. In dev they are served from
 * dist/ (run `node engine/catalog.mjs` once — `pnpm dev` does it via predev).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { hubAppVersionPlugin } from "../scripts/embed-app-version.mjs";

const toolRoot = path.dirname(fileURLToPath(import.meta.url));
const devRoot = path.resolve(toolRoot, "../..");
const hubUiSrc = path.resolve(devRoot, "packages/hub-ui/src");
const hubIdentitySrc = path.resolve(devRoot, "packages/hub-identity/src");
const catalogDist = path.join(toolRoot, "dist");

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".woff2": "font/woff2",
  ".vtt": "text/vtt; charset=utf-8",
};

/** Dev only — serve the catalog build output (/catalog.json, /preview/**) like nginx does in prod. */
function catalogDistPlugin(): Plugin {
  return {
    name: "p0008-catalog-dist",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = decodeURIComponent((req.url ?? "").split("?")[0] ?? "");
        if (url !== "/catalog.json" && !url.startsWith("/preview/")) return next();
        let file = path.join(catalogDist, url);
        if (!file.startsWith(catalogDist)) return next();
        if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
        if (!fs.existsSync(file)) {
          res.statusCode = 404;
          res.setHeader("content-type", "text/plain; charset=utf-8");
          res.end(`Not built: ${url} — run node engine/catalog.mjs`);
          return;
        }
        res.setHeader("content-type", MIME[path.extname(file)] ?? "application/octet-stream");
        res.setHeader("cache-control", "no-cache");
        fs.createReadStream(file).pipe(res);
      });
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    // <meta name="app-version"> + VITE_APP_BUILT_AT — deploy-lenovo-static.mjs verifies prod by this.
    hubAppVersionPlugin({ root: toolRoot }),
    catalogDistPlugin(),
  ],
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: [
      { find: /^@tool-workspace\/hub-ui\/(.+)$/, replacement: `${hubUiSrc}/$1` },
      { find: "@tool-workspace/hub-ui", replacement: path.join(hubUiSrc, "index.ts") },
      { find: /^@tool-workspace\/hub-identity\/(.+)$/, replacement: `${hubIdentitySrc}/$1` },
      { find: "@tool-workspace/hub-identity", replacement: path.join(hubIdentitySrc, "index.ts") },
    ],
  },
  optimizeDeps: {
    exclude: ["@tool-workspace/hub-ui", "@tool-workspace/hub-identity"],
  },
  build: {
    outDir: "dist",
    // dist/ already holds preview/ + catalog.json + 404.html from engine/catalog.mjs (build-home.mjs order).
    emptyOutDir: false,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          const p = id.split("\\").join("/");
          if (p.includes("/node_modules/react") || p.includes("/node_modules/scheduler/")) return "vendor-react";
          if (p.includes("/packages/hub-ui/") || p.includes("/packages/hub-identity/")) return "vendor-hub";
          if (p.includes("/node_modules/")) return "vendor";
          return undefined;
        },
      },
    },
  },
  server: {
    host: "127.0.0.1",
    port: 3008,
    strictPort: true,
    fs: { allow: [toolRoot, devRoot] },
  },
  preview: { host: "127.0.0.1", port: 4108 },
});
