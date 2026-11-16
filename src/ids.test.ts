import { describe, expect, test } from "bun:test";

import {
  applySuggestedSuffix,
  hasRequiredIdShape,
  toKebabCase,
  validateExtensionId,
} from "./ids.ts";

describe("toKebabCase", () => {
  test("normalizes display names", () => {
    expect(toKebabCase("My Cool Theme")).toBe("my-cool-theme");
    expect(toKebabCase("  Foo_Bar  ")).toBe("foo-bar");
  });
});

describe("validateExtensionId", () => {
  test("rejects reserved words", () => {
    expect(validateExtensionId("my-zed-theme", "theme").ok).toBe(false);
  });

  test("rejects non-kebab ids", () => {
    expect(validateExtensionId("MyTheme", "theme").ok).toBe(false);
  });

  test("requires theme suffix", () => {
    const result = validateExtensionId("midnight", "theme");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.canFixSuffix).toBe(true);
    }
  });

  test("accepts valid theme id", () => {
    expect(validateExtensionId("midnight-theme", "theme").ok).toBe(true);
  });

  test("accepts mcp server prefixes and suffixes", () => {
    expect(validateExtensionId("mcp-server-github", "mcp-server").ok).toBe(
      true,
    );
    expect(validateExtensionId("github-mcp-server", "mcp-server").ok).toBe(
      true,
    );
  });

  test("accepts icon theme suffixes", () => {
    expect(hasRequiredIdShape("material-icons", "icon-theme")).toBe(true);
    expect(hasRequiredIdShape("material-icon-theme", "icon-theme")).toBe(true);
  });
});

describe("applySuggestedSuffix", () => {
  test("appends missing suffixes", () => {
    expect(applySuggestedSuffix("midnight", "theme")).toBe("midnight-theme");
    expect(applySuggestedSuffix("rust", "snippets")).toBe("rust-snippets");
    expect(applySuggestedSuffix("foo", "debugger")).toBe("foo-debugger");
    expect(applySuggestedSuffix("bar", "mcp-server")).toBe("bar-mcp-server");
  });
});
