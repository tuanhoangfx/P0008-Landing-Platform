#!/usr/bin/env node
import { spawnSync } from "node:child_process";

function run(label, cmd, args) {
  const r = spawnSync(cmd, args, { stdio: "inherit", shell: true, windowsHide: true });
  if (r.status !== 0) {
    console.error(`build failed at ${label}`);
    process.exit(r.status ?? 1);
  }
}

run("tsc", "pnpm", ["exec", "tsc", "--noEmit"]);
run("vite", "pnpm", ["exec", "vite", "build"]);
