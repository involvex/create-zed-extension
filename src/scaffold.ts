import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

import {
  debuggerFiles,
  iconThemeFiles,
  languageFiles,
  languageServerFiles,
  mcpServerFiles,
  snippetsFiles,
  themeFiles,
} from "./templates/index.ts";
import type { Answers, ScaffoldFile } from "./types.ts";

export function buildFiles(answers: Answers): ScaffoldFile[] {
  switch (answers.kind) {
    case "theme":
      return themeFiles(answers);
    case "icon-theme":
      return iconThemeFiles(answers);
    case "snippets":
      return snippetsFiles(answers);
    case "language":
      return languageFiles(answers);
    case "language-server":
      return languageServerFiles(answers);
    case "debugger":
      return debuggerFiles(answers);
    case "mcp-server":
      return mcpServerFiles(answers);
  }
}

export function directoryIsNonEmpty(dir: string): boolean {
  if (!existsSync(dir)) {
    return false;
  }
  return readdirSync(dir).length > 0;
}

export function writeScaffold(answers: Answers): string {
  const target = resolve(answers.directory);
  if (directoryIsNonEmpty(target) && !answers.force) {
    throw new Error(
      `Directory ${target} is not empty. Pass --force to write anyway.`,
    );
  }

  const files = buildFiles(answers);
  for (const file of files) {
    const full = join(target, file.path);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, file.contents, "utf8");
  }

  if (answers.gitInit) {
    const gitDir = join(target, ".git");
    if (!existsSync(gitDir)) {
      const result = spawnSync("git", ["init"], {
        cwd: target,
        stdio: "ignore",
        shell: process.platform === "win32",
      });
      if (result.status !== 0) {
        throw new Error("git init failed. Re-run with --no-git to skip.");
      }
    }
  }

  return target;
}
