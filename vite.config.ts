import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const toolRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 3008,
    strictPort: true,
  },
  resolve: {
    alias: {
      "@": path.join(toolRoot, "src"),
    },
  },
  esbuild: {
    target: "es2022",
  },
});
