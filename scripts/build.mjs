#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function runNode(modulePath, args = []) {
  const result = spawnSync(process.execPath, [modulePath, ...args], { stdio: "inherit", cwd: root });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (!process.env.VERCEL) {
  runNode(path.join(root, "node_modules/typescript/bin/tsc"), ["--noEmit"]);
}
runNode(path.join(root, "node_modules/vite/bin/vite.js"), ["build"]);
