import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { authorDisplayName } from "./ids.ts";
import type { LicenseId } from "./types.ts";

function licensesDir(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  // dist/ -> ../licenses ; also support running from src during tests after build
  return join(here, "..", "licenses");
}

export function renderLicense(license: LicenseId, author: string): string {
  const path = join(licensesDir(), `${license}.txt`);
  const template = readFileSync(path, "utf8");
  const year = String(new Date().getFullYear());
  return template
    .replaceAll("{{YEAR}}", year)
    .replaceAll("{{AUTHOR}}", authorDisplayName(author));
}
