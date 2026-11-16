import { chmodSync, readFileSync, writeFileSync } from "node:fs";

const result = await Bun.build({
  entrypoints: ["./src/index.ts"],
  outdir: "./dist",
  target: "node",
  format: "esm",
});

if (!result.success) {
  for (const log of result.logs) {
    console.error(log);
  }
  process.exit(1);
}

const out = "./dist/index.js";
let code = readFileSync(out, "utf8");
code = code.replace(/^(?:#!.*\r?\n)+/, "");
writeFileSync(out, `#!/usr/bin/env node\n${code}`);

try {
  chmodSync(out, 0o755);
} catch {
  // Windows may ignore mode bits.
}

console.log(`Bundled ${result.outputs.length} file(s) → ${out}`);
