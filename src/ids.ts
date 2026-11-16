import type { ExtensionKind } from "./types.ts";

const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function toKebabCase(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function suggestedSuffix(kind: ExtensionKind): string | null {
  switch (kind) {
    case "theme":
      return "-theme";
    case "icon-theme":
      return "-icon-theme";
    case "snippets":
      return "-snippets";
    case "language-server":
      return "-lsp";
    case "debugger":
      return "-debugger";
    case "mcp-server":
      return "-mcp-server";
    case "language":
      return null;
  }
}

export function hasRequiredIdShape(id: string, kind: ExtensionKind): boolean {
  switch (kind) {
    case "theme":
      return id.endsWith("-theme");
    case "icon-theme":
      return id.endsWith("-icon-theme") || id.endsWith("-icons");
    case "snippets":
      return id.endsWith("-snippets");
    case "language-server":
      return id.endsWith("-language-server") || id.endsWith("-lsp");
    case "debugger":
      return id.endsWith("-debugger");
    case "mcp-server":
      return id.startsWith("mcp-server-") || id.endsWith("-mcp-server");
    case "language":
      return true;
  }
}

export function applySuggestedSuffix(id: string, kind: ExtensionKind): string {
  if (hasRequiredIdShape(id, kind)) {
    return id;
  }
  const suffix = suggestedSuffix(kind);
  if (!suffix) {
    return id;
  }
  if (kind === "mcp-server" && !id.startsWith("mcp-server-")) {
    return `${id}${suffix}`;
  }
  if (id.endsWith(suffix)) {
    return id;
  }
  return `${id}${suffix}`;
}

export type IdValidation =
  { ok: true } | { ok: false; message: string; canFixSuffix?: boolean };

export function validateExtensionId(
  id: string,
  kind: ExtensionKind,
): IdValidation {
  if (!id) {
    return { ok: false, message: "Extension id is required." };
  }
  if (!KEBAB.test(id)) {
    return {
      ok: false,
      message:
        "Extension id must be kebab-case (lowercase letters, numbers, hyphens).",
    };
  }
  if (id.includes("zed") || id.includes("extension")) {
    return {
      ok: false,
      message: 'Extension id must not contain the words "zed" or "extension".',
    };
  }
  if (!hasRequiredIdShape(id, kind)) {
    const suffix = suggestedSuffix(kind);
    const hint =
      kind === "mcp-server"
        ? 'prefix with "mcp-server-" or suffix with "-mcp-server"'
        : kind === "icon-theme"
          ? 'end with "-icon-theme" or "-icons"'
          : kind === "language-server"
            ? 'end with "-language-server" or "-lsp"'
            : `end with "${suffix}"`;
    return {
      ok: false,
      message: `For ${kind} extensions, the id should ${hint}.`,
      canFixSuffix: true,
    };
  }
  return { ok: true };
}

export function crateNameFromId(id: string): string {
  return id.replace(/-/g, "_");
}

export function authorDisplayName(author: string): string {
  const match = author.match(/^([^<]+)/);
  return (match?.[1] ?? author).trim();
}
