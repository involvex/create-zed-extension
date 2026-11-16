import { authorDisplayName } from "../ids.ts";
import { renderLicense } from "../licenses.ts";
import type { Answers, ScaffoldFile } from "../types.ts";

export function baseExtensionToml(answers: Answers, extra = ""): string {
  const lines = [
    `id = ${tomlString(answers.id)}`,
    `name = ${tomlString(answers.name)}`,
    `version = "0.0.1"`,
    `schema_version = 1`,
    `authors = [${tomlString(answers.author)}]`,
    `description = ${tomlString(answers.description)}`,
    `repository = ${tomlString(answers.repository)}`,
  ];
  if (extra) {
    lines.push("", extra.trimEnd());
  }
  return `${lines.join("\n")}\n`;
}

export function tomlString(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

export function tomlStringArray(values: string[]): string {
  return `[${values.map(tomlString).join(", ")}]`;
}

export function sharedFiles(answers: Answers): ScaffoldFile[] {
  return [
    {
      path: "LICENSE",
      contents: renderLicense(answers.license, answers.author),
    },
    {
      path: ".gitignore",
      contents: ["/target", "*.wasm", ".DS_Store", ""].join("\n"),
    },
  ];
}

export function readmeFor(
  answers: Answers,
  extras: string[] = [],
): ScaffoldFile {
  const needsRust =
    answers.kind === "language-server" ||
    answers.kind === "debugger" ||
    answers.kind === "mcp-server";

  const lines = [
    `# ${answers.name}`,
    "",
    answers.description,
    "",
    "## Develop locally",
    "",
    "1. Install [Rust](https://www.rust-lang.org/tools/install) via rustup if this extension includes Rust code.",
    "2. Open Zed and run **Install Dev Extension** (or the `zed::InstallDevExtension` action).",
    "3. Choose this directory.",
    "4. Check **Zed.log** (`zed::OpenLog`) if something fails. For more detail, relaunch with `zed --foreground`.",
    "",
  ];

  if (needsRust) {
    lines.push(
      "## Rust / WebAssembly",
      "",
      "Zed compiles this extension to the `wasm32-wasip2` target when you install it as a dev extension.",
      "If Rust was installed with rustup, Zed installs that target automatically.",
      "",
    );
  }

  if (answers.kind === "mcp-server") {
    lines.push(
      "## MCP registry note",
      "",
      "Zed plans to deprecate MCP server extensions in favor of the official MCP registry.",
      "Publish your server to the registry as well so it keeps working in future Zed versions.",
      "",
    );
  }

  if (answers.kind === "debugger") {
    lines.push(
      "## Debug locators",
      "",
      "This starter does not include a debug locator. See the [debugger extension docs](https://zed.dev/docs/extensions/debugger-extensions) if you want to convert tasks into debug scenarios.",
      "",
    );
  }

  if (extras.length) {
    lines.push(...extras, "");
  }

  lines.push(
    "## Publish",
    "",
    "Follow the [extension publishing guide](https://zed.dev/docs/extensions/publishing/publishing-guide).",
    "",
    `Author: ${authorDisplayName(answers.author)}`,
    `License: ${answers.license}`,
    "",
  );

  return { path: "README.md", contents: lines.join("\n") };
}
