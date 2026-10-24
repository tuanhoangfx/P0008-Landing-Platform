#!/usr/bin/env node
/**
 * Dev server for one site (live reload on content/ and site.config.json changes).
 *
 *   node engine/dev-site.mjs --site videolab      → http://127.0.0.1:<devPort><base>
 */
import { createServer } from "vite";
import { viteConfigFor } from "./site.mjs";

const args = process.argv.slice(2);
const id = args[args.indexOf("--site") + 1];
if (!id || id.startsWith("--")) throw new Error("usage: dev-site.mjs --site <id>");

const { site, config } = await viteConfigFor(id, { mode: "development" });
const server = await createServer({ ...config, logLevel: "info" });
await server.listen();
console.log(`[site:${id}] http://${config.server.host}:${config.server.port}${site.base}`);
