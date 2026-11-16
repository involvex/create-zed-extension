export const EXTENSION_KINDS = [
  "theme",
  "icon-theme",
  "snippets",
  "language",
  "language-server",
  "debugger",
  "mcp-server",
] as const;

export type ExtensionKind = (typeof EXTENSION_KINDS)[number];

export const LICENSES = [
  "MIT",
  "Apache-2.0",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "CC-BY-4.0",
  "GPL-3.0",
  "LGPL-3.0",
  "Unlicense",
  "Zlib",
] as const;

export type LicenseId = (typeof LICENSES)[number];

export type ThemeAppearance = "dark" | "light" | "both";

export type Answers = {
  directory: string;
  kind: ExtensionKind;
  name: string;
  id: string;
  description: string;
  author: string;
  repository: string;
  license: LicenseId;
  gitInit: boolean;
  force: boolean;

  // theme
  appearance?: ThemeAppearance;

  // snippets
  snippetScope?: string; // language name lowercase, or "global"

  // language / language-server language bits
  languageName?: string;
  pathSuffixes?: string[];
  lineComment?: string;
  grammarRepo?: string;
  grammarRev?: string;

  // language-server
  binary?: string;
  includeLanguage?: boolean;
  lspLanguages?: string[];

  // debugger
  adapterId?: string;

  // mcp
  serverId?: string;
  binaryArgs?: string[];
};

export type ScaffoldFile = {
  path: string;
  contents: string;
};
