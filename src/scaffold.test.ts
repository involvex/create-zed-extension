import { describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { buildFiles, writeScaffold } from "./scaffold.ts";
import type { Answers, ExtensionKind } from "./types.ts";

function baseAnswers(
  kind: ExtensionKind,
  overrides: Partial<Answers> = {},
): Answers {
  const ids: Record<ExtensionKind, string> = {
    theme: "sample-theme",
    "icon-theme": "sample-icon-theme",
    snippets: "sample-snippets",
    language: "samplelang",
    "language-server": "sample-lsp",
    debugger: "sample-debugger",
    "mcp-server": "mcp-server-sample",
  };

  return {
    directory: "./out",
    kind,
    name: "Sample",
    id: ids[kind],
    description: "A sample extension",
    author: "Test Author <test@example.com>",
    repository: "https://github.com/example/sample",
    license: "MIT",
    gitInit: false,
    force: true,
    appearance: "both",
    snippetScope: "global",
    languageName: "SampleLang",
    pathSuffixes: ["spl"],
    lineComment: "# ",
    grammarRepo: "https://github.com/tree-sitter/tree-sitter-json",
    grammarRev: "94f5ce6879010de27509287006a85ffbcd0c9801",
    binary: "sample-bin",
    includeLanguage: false,
    lspLanguages: ["SampleLang"],
    adapterId: "sample",
    serverId: "sample",
    binaryArgs: ["--stdio"],
    ...overrides,
  };
}

const NO_RUST: ExtensionKind[] = [
  "theme",
  "icon-theme",
  "snippets",
  "language",
];

describe("buildFiles", () => {
  for (const kind of NO_RUST) {
    test(`${kind} does not include Cargo.toml`, () => {
      const files = buildFiles(baseAnswers(kind));
      expect(files.some((f) => f.path === "Cargo.toml")).toBe(false);
      expect(files.some((f) => f.path === "extension.toml")).toBe(true);
      expect(files.some((f) => f.path === "LICENSE")).toBe(true);
      expect(files.some((f) => f.path === "README.md")).toBe(true);
    });
  }

  test("theme writes theme json", () => {
    const files = buildFiles(baseAnswers("theme"));
    expect(files.some((f) => f.path === "themes/sample-theme.json")).toBe(true);
  });

  test("icon-theme writes icons and theme json", () => {
    const files = buildFiles(baseAnswers("icon-theme"));
    expect(
      files.some((f) => f.path === "icon_themes/sample-icon-theme.json"),
    ).toBe(true);
    expect(files.some((f) => f.path === "icons/folder.svg")).toBe(true);
  });

  test("snippets writes snippets.json", () => {
    const files = buildFiles(baseAnswers("snippets"));
    expect(files.some((f) => f.path === "snippets/snippets.json")).toBe(true);
    const toml = files.find((f) => f.path === "extension.toml")!.contents;
    expect(toml).toMatch(/snippets\s*=/);
  });

  test("language writes grammar and queries", () => {
    const files = buildFiles(baseAnswers("language"));
    expect(
      files.some((f) => f.path === "languages/samplelang/config.toml"),
    ).toBe(true);
    expect(
      files.some((f) => f.path === "languages/samplelang/highlights.scm"),
    ).toBe(true);
    const toml = files.find((f) => f.path === "extension.toml")!.contents;
    expect(toml).toMatch(/\[grammars\.samplelang\]/);
  });

  test("language-server includes Rust and optional language", () => {
    const withoutLang = buildFiles(baseAnswers("language-server"));
    expect(withoutLang.some((f) => f.path === "Cargo.toml")).toBe(true);
    expect(withoutLang.some((f) => f.path === "src/lib.rs")).toBe(true);
    expect(withoutLang.some((f) => f.path.startsWith("languages/"))).toBe(
      false,
    );

    const withLang = buildFiles(
      baseAnswers("language-server", { includeLanguage: true }),
    );
    expect(withLang.some((f) => f.path.startsWith("languages/"))).toBe(true);
  });

  test("debugger includes schema and Rust", () => {
    const files = buildFiles(baseAnswers("debugger"));
    expect(files.some((f) => f.path === "Cargo.toml")).toBe(true);
    expect(
      files.some((f) => f.path === "debug_adapter_schemas/sample.json"),
    ).toBe(true);
    expect(files.find((f) => f.path === "src/lib.rs")!.contents).toMatch(
      /get_dap_binary/,
    );
  });

  test("mcp-server includes context server Rust", () => {
    const files = buildFiles(baseAnswers("mcp-server"));
    expect(files.some((f) => f.path === "Cargo.toml")).toBe(true);
    const toml = files.find((f) => f.path === "extension.toml")!.contents;
    expect(toml).toMatch(/\[context_servers\.sample\]/);
    expect(files.find((f) => f.path === "src/lib.rs")!.contents).toMatch(
      /context_server_command/,
    );
  });
});

describe("writeScaffold", () => {
  test("writes files to disk", () => {
    const dir = mkdtempSync(join(tmpdir(), "cze-"));
    try {
      const answers = baseAnswers("theme", {
        directory: dir,
        force: true,
        gitInit: false,
      });
      writeScaffold(answers);
      expect(existsSync(join(dir, "extension.toml"))).toBe(true);
      expect(existsSync(join(dir, "themes/sample-theme.json"))).toBe(true);
      expect(existsSync(join(dir, "LICENSE"))).toBe(true);
      const license = readFileSync(join(dir, "LICENSE"), "utf8");
      expect(license).toMatch(/MIT License/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("refuses non-empty directories without --force", () => {
    const dir = mkdtempSync(join(tmpdir(), "cze-"));
    try {
      const answers = baseAnswers("theme", {
        directory: dir,
        force: false,
        gitInit: false,
      });
      writeScaffold({ ...answers, force: true });
      expect(() => writeScaffold(answers)).toThrow(/not empty/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
