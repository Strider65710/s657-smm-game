/**
 * @license All Rights Reserved.
 *
 * Build for the mods. For every mod folder that has a
 * `src/main.ts` (or `src/main.tsx`/`.js`) entry, this transpiles + bundles it
 * to `dist/main.js` with esbuild — the SAME thing a mod author runs. It is not
 * hand-written output; it's a genuine compile.
 *
 * Key settings, and why:
 *   - format: "cjs"          The loader runs mod code inside a `new Function`
 *                            that supplies `require`, `module`, `exports`, so
 *                            CommonJS output drops straight in.
 *   - external @smm/modkit   The game injects the real API at runtime and
 *                            resolves require("@smm/modkit"); never inline it.
 *   - bundle: true           So a mod can `import`/`require` sibling files in
 *                            its own src/ and ship a single dist/main.js.
 *   - platform: "browser"    Mods run in the game's page.
 *   - target: es2020         Matches the game's build target.
 *
 * Run from the repo root:  node example_mods/build.mjs
 * Or build one mod:        node example_mods/build.mjs journal_plus
 */

import { build } from "esbuild";
import { readdir, stat, access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));

const ENTRY_CANDIDATES = ["src/main.ts", "src/main.tsx", "src/main.js"];

async function exists(p) {
  try {
    await access(p, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function findEntry(modDir) {
  for (const rel of ENTRY_CANDIDATES) {
    const p = join(modDir, rel);
    if (await exists(p)) return p;
  }
  return null;
}

/** Read a mod's declared dependency namespaces (array or {ns:ver} map). */
async function readDependencies(modDir) {
  try {
    const raw = await readFile(join(modDir, "mod.json"), "utf8");
    const dep = JSON.parse(raw).dependencies;
    if (!dep) return [];
    return Array.isArray(dep) ? dep : Object.keys(dep);
  } catch {
    return [];
  }
}

async function buildMod(name) {
  const modDir = join(HERE, name);
  const entry = await findEntry(modDir);
  if (!entry) return { name, skipped: true };

  // A mod's declared dependencies (e.g. library mods it require()s) are supplied
  // by the loader at runtime, so keep them external — never bundle them in.
  const deps = await readDependencies(modDir);

  await build({
    entryPoints: [entry],
    outfile: join(modDir, "dist", "main.js"),
    bundle: true,
    format: "cjs",
    platform: "browser",
    target: "es2020",
    // The game supplies these at runtime; never inline them.
    external: ["@smm/modkit", "modkit", ...deps],
    minify: true,
    legalComments: "none",
    logLevel: "warning",
    banner: {
      js: "/* Milkshake Mania mod — built with esbuild. Source in ../src. */",
    },
  });
  return { name, built: true };
}

async function main() {
  const only = process.argv[2];
  let names;
  if (only) {
    names = [only];
  } else {
    const entries = await readdir(HERE);
    names = [];
    for (const e of entries) {
      const full = join(HERE, e);
      if ((await stat(full)).isDirectory()) names.push(e);
    }
  }

  let built = 0;
  let skipped = 0;
  for (const name of names.sort()) {
    const res = await buildMod(name);
    if (res.built) {
      built++;
      console.log(`  built  ${name}/dist/main.js`);
    } else if (res.skipped) {
      skipped++;
      // Asset-only mods (registry.json, no code) have nothing to compile.
    }
  }
  console.log(
    `\nDone: ${built} code mod(s) built, ${skipped} skipped (asset-only or missing).`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

