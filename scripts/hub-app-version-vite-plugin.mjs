/**
 * Vite plugin: inject app-version meta + VITE_APP_VERSION for production version probe.
 * SSOT copy lives in Tool/scripts/embed-app-version.mjs — sync on hub-ui onboard.
 */
import fs from "node:fs";
import path from "node:path";

function readPkgVersion(productRoot) {
  const pkgPath = path.join(productRoot, "package.json");
  if (!fs.existsSync(pkgPath)) return "";
  return String(JSON.parse(fs.readFileSync(pkgPath, "utf8")).version || "").trim();
}

function injectAppVersionMeta(html, version) {
  const metaTag = `<meta name="app-version" content="${version}" />`;
  const metaRe = /<meta\s+name=["']app-version["']\s+content=["'][^"']*["']\s*\/?>/i;
  if (metaRe.test(html)) return html.replace(metaRe, metaTag);
  if (/<meta\s+name=["']viewport["']/i.test(html)) {
    return html.replace(/<meta\s+name=["']viewport["']/i, `${metaTag}\n    <meta name="viewport"`);
  }
  if (/<head>/i.test(html)) return html.replace(/<head>/i, `<head>\n    ${metaTag}`);
  return html;
}

export function hubAppVersionPlugin(options = {}) {
  const root = path.resolve(options.root || process.cwd());
  let version = "";

  return {
    name: "hub-app-version",
    config() {
      version = readPkgVersion(root);
      if (!version) return {};
      return {
        define: {
          "import.meta.env.VITE_APP_VERSION": JSON.stringify(version),
        },
      };
    },
    transformIndexHtml(html) {
      if (!version) version = readPkgVersion(root);
      if (!version) return html;
      return injectAppVersionMeta(html, version);
    },
  };
}
