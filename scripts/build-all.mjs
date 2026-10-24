#!/usr/bin/env node
/** Build every site under sites/ and the ldp.infi.io.vn home index. */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { listSites, platformRoot } from "../engine/site.mjs";

const run = (file, ...a) => {
  const r = spawnSync(process.execPath, [path.join(platformRoot, file), ...a], { stdio: "inherit", windowsHide: true });
  if (r.status !== 0) process.exit(r.status ?? 1);
};
for (const id of listSites()) run("engine/build-site.mjs", "--site", id);
run("scripts/build-home.mjs");
