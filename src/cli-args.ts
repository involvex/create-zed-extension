import { parseArgs } from "node:util";

import {
  type Answers,
  EXTENSION_KINDS,
  type ExtensionKind,
  type LicenseId,
  LICENSES,
  type ThemeAppearance,
} from "./types.ts";

function isExtensionKind(value: string): value is ExtensionKind {
  return (EXTENSION_KINDS as readonly string[]).includes(value);
}

function isLicenseId(value: string): value is LicenseId {
  return (LICENSES as readonly string[]).includes(value);
}

function isThemeAppearance(value: string): value is ThemeAppearance {
  return value === "dark" || value === "light" || value === "both";
}

export type CliFlags = {
  directory?: string;
  kind?: ExtensionKind;
  name?: string;
  id?: string;
  description?: string;
  author?: string;
  repository?: string;
  license?: LicenseId;
  gitInit: boolean;
  force: boolean;
  help: boolean;
  appearance?: ThemeAppearance;
  snippetScope?: string;
  languageName?: string;
  pathSuffixes?: string[];
  lineComment?: string;
  grammarRepo?: string;
  grammarRev?: string;
  binary?: string;
  includeLanguage?: boolean;
  lspLanguages?: string[];
  adapterId?: string;
  serverId?: string;
  binaryArgs?: string[];
};

export function parseCliArgs(argv: string[]): CliFlags {
  const { values, positionals } = parseArgs({
    args: argv,
    options: {
      kind: { type: "string" },
      name: { type: "string" },
      id: { type: "string" },
      description: { type: "string" },
      author: { type: "string" },
      repository: { type: "string" },
      license: { type: "string", default: "MIT" },
      force: { type: "boolean", default: false },
      "no-git": { type: "boolean", default: false },
      help: { type: "boolean", short: "h", default: false },
      appearance: { type: "string" },
      "snippet-scope": { type: "string" },
      "language-name": { type: "string" },
      "path-suffixes": { type: "string" },
      "line-comment": { type: "string" },
      "grammar-repo": { type: "string" },
      "grammar-rev": { type: "string" },
      binary: { type: "string" },
      "include-language": { type: "boolean" },
      "lsp-languages": { type: "string" },
      "adapter-id": { type: "string" },
      "server-id": { type: "string" },
      "binary-args": { type: "string" },
    },
    allowPositionals: true,
    strict: true,
  });

  let kind: ExtensionKind | undefined;
  if (values.kind !== undefined) {
    if (!isExtensionKind(values.kind)) {
      throw new Error(
        `Unknown kind "${values.kind}". Expected one of: ${EXTENSION_KINDS.join(", ")}`,
      );
    }
    kind = values.kind;
  }

  const licenseValue = values.license ?? "MIT";
  if (!isLicenseId(licenseValue)) {
    throw new Error(
      `Unknown license "${licenseValue}". Expected one of: ${LICENSES.join(", ")}`,
    );
  }
  const license = licenseValue;

  let appearance: ThemeAppearance | undefined;
  if (values.appearance !== undefined) {
    if (!isThemeAppearance(values.appearance)) {
      throw new Error('--appearance must be "dark", "light", or "both"');
    }
    appearance = values.appearance;
  }

  return {
    directory: positionals[0],
    kind,
    name: values.name,
    id: values.id,
    description: values.description,
    author: values.author,
    repository: values.repository,
    license,
    gitInit: !values["no-git"],
    force: Boolean(values.force),
    help: Boolean(values.help),
    appearance,
    snippetScope: values["snippet-scope"],
    languageName: values["language-name"],
    pathSuffixes: values["path-suffixes"]
      ?.split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    lineComment: values["line-comment"],
    grammarRepo: values["grammar-repo"],
    grammarRev: values["grammar-rev"],
    binary: values.binary,
    includeLanguage: values["include-language"],
    lspLanguages: values["lsp-languages"]
      ?.split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    adapterId: values["adapter-id"],
    serverId: values["server-id"],
    binaryArgs: values["binary-args"]
      ?.split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  };
}

export function usage(): string {
  return `Usage: create-zed-extension [directory] [options]

Scaffold a Zed editor extension interactively (like "yo code").

Options:
  --kind <kind>              theme | icon-theme | snippets | language |
                             language-server | debugger | mcp-server
  --name <name>              Display name
  --id <id>                  Extension id (kebab-case)
  --description <text>       Short description
  --author <author>          "Name <email@example.com>"
  --repository <url>         Repository URL
  --license <id>             ${LICENSES.join(" | ")} (default: MIT)
  --force                    Write into a non-empty directory
  --no-git                   Skip git init
  --appearance <value>       dark | light | both (theme)
  --snippet-scope <scope>    Language name or "global" (snippets)
  --language-name <name>     Language display name
  --path-suffixes <list>     Comma-separated file suffixes
  --line-comment <text>      Line comment prefix (default: "# ")
  --grammar-repo <url>       Tree-sitter grammar repository URL
  --grammar-rev <sha>        40-character grammar commit SHA
  --binary <name>            Binary on PATH (lsp / debugger / mcp)
  --include-language         Also scaffold language files (language-server)
  --lsp-languages <list>     Comma-separated language names for the LSP
  --adapter-id <id>          Debug adapter id
  --server-id <id>           MCP context server id
  --binary-args <list>       Comma-separated MCP server args
  -h, --help                 Show this help
`;
}

/** Partial answers already known from flags (before prompting). */
export function flagsToPartial(flags: CliFlags): Partial<Answers> {
  return {
    directory: flags.directory,
    kind: flags.kind,
    name: flags.name,
    id: flags.id,
    description: flags.description,
    author: flags.author,
    repository: flags.repository,
    license: flags.license,
    gitInit: flags.gitInit,
    force: flags.force,
    appearance: flags.appearance,
    snippetScope: flags.snippetScope,
    languageName: flags.languageName,
    pathSuffixes: flags.pathSuffixes,
    lineComment: flags.lineComment,
    grammarRepo: flags.grammarRepo,
    grammarRev: flags.grammarRev,
    binary: flags.binary,
    includeLanguage: flags.includeLanguage,
    lspLanguages: flags.lspLanguages,
    adapterId: flags.adapterId,
    serverId: flags.serverId,
    binaryArgs: flags.binaryArgs,
  };
}
