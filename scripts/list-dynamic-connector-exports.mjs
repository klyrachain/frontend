#!/usr/bin/env node
/**
 * Lists connector-related symbols published by each @dynamic-labs/* dependency in this app.
 * Run from frontend/: `pnpm run dynamic:list-connectors`
 *
 * Uses Node module resolution (same as your app), so it works whenever `pnpm install` has run.
 * This is not identical to the connect modal list (that also uses Dynamic dashboard + wallet book
 * + `filterWalletsForPlatform`); use `NEXT_PUBLIC_DYNAMIC_DEBUG_WALLETS=true` in the browser for that.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.join(__dirname, "..");
const require = createRequire(path.join(frontendRoot, "package.json"));

function extractFromSource(src) {
  const names = new Set();
  const decl =
    /export\s+(?:declare\s+)?(?:const|class|function)\s+([A-Za-z0-9_]+)/g;
  let m;
  while ((m = decl.exec(src)) !== null) {
    names.add(m[1]);
  }
  const brace =
    /export\s*\{([^}]+)\}\s*(?:from[^'"]*['"][^'"]+['"]\s*;?|;)/gs;
  while ((m = brace.exec(src)) !== null) {
    for (const part of m[1].split(",")) {
      const seg = part.replace(/,$/, "").trim();
      if (!seg || seg.startsWith("type ")) continue;
      const asMatch = seg.match(/^([A-Za-z0-9_]+)(?:\s+as\s+([A-Za-z0-9_]+))?$/);
      if (asMatch) names.add(asMatch[2] ?? asMatch[1]);
    }
  }
  return [...names].sort();
}

function tryReadNearResolved(pkgName) {
  let resolved;
  try {
    resolved = require.resolve(pkgName);
  } catch {
    return null;
  }
  const pkgDir = path.join(resolved, "..", "..");
  const candidates = [
    path.join(pkgDir, "src", "index.d.ts"),
    path.join(pkgDir, "src", "index.js"),
    path.join(pkgDir, "dist", "index.d.ts"),
    resolved,
  ];
  for (const p of candidates) {
    if (fs.existsSync(p) && fs.statSync(p).isFile()) {
      const ext = path.extname(p);
      if (ext === ".ts" && !p.endsWith(".d.ts")) continue;
      return fs.readFileSync(p, "utf8");
    }
  }
  return null;
}

function main() {
  const pkgPath = path.join(frontendRoot, "package.json");
  const { dependencies = {} } = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  const dynamicDeps = Object.keys(dependencies).filter((k) =>
    k.startsWith("@dynamic-labs/")
  );

  if (dynamicDeps.length === 0) {
    console.error("No @dynamic-labs/* dependencies in package.json.");
    process.exit(1);
  }

  let printedAny = false;
  for (const dep of dynamicDeps.sort()) {
    const src = tryReadNearResolved(dep);
    if (!src) continue;
    const exportNames = extractFromSource(src);
    const connectorLike = exportNames.filter((n) =>
      /WalletConnectors$|Connectors$|Connector$/.test(n)
    );
    if (connectorLike.length === 0) continue;
    printedAny = true;
    console.log(`\n${dep}`);
    for (const n of connectorLike) {
      console.log(`  - ${n}`);
    }
  }

  if (!printedAny) {
    console.error(
      "[dynamic:list-connectors] Could not read any package entry files. Run `pnpm install` in frontend/."
    );
    process.exit(1);
  }
  console.log(
    "\n(Done. Import from `@dynamic-labs/<pkg>` in wallet-connectors.ts — never edit paths under node_modules.)"
  );
}

main();
