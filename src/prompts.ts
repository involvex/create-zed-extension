import * as p from "@clack/prompts";
import { cancel, isCancel } from "@clack/prompts";

import type { CliFlags } from "./cli-args.ts";
import {
  applySuggestedSuffix,
  toKebabCase,
  validateExtensionId,
} from "./ids.ts";
import { type Answers, LICENSES } from "./types.ts";

function exitOnCancel<T>(value: T | symbol): T {
  if (isCancel(value)) {
    cancel("Scaffold cancelled.");
    process.exit(0);
  }
  return value;
}

function requireFlag(interactive: boolean, missing: string[]): void {
  if (!interactive && missing.length) {
    throw new Error(
      `Missing required options in non-interactive mode: ${missing.join(", ")}\nRun with --help for usage.`,
    );
  }
}

export async function collectAnswers(flags: CliFlags): Promise<Answers> {
  const interactive = Boolean(process.stdin.isTTY);

  if (interactive) {
    p.intro("create-zed-extension");
  }

  let kind = flags.kind;
  if (!kind) {
    requireFlag(interactive, ["--kind"]);
    kind = exitOnCancel(
      await p.select({
        message: "What kind of extension?",
        options: [
          { value: "theme" as const, label: "Theme" },
          { value: "icon-theme" as const, label: "Icon theme" },
          { value: "snippets" as const, label: "Snippets" },
          {
            value: "language" as const,
            label: "Language (grammar + queries)",
          },
          {
            value: "language-server" as const,
            label: "Language server (Rust + optional language)",
          },
          { value: "debugger" as const, label: "Debugger (DAP)" },
          {
            value: "mcp-server" as const,
            label: "MCP server (may be replaced by MCP registry)",
          },
        ],
      }),
    );
  }

  let name = flags.name;
  if (!name) {
    requireFlag(interactive, ["--name"]);
    name = exitOnCancel(
      await p.text({
        message: "Display name",
        placeholder: "My Extension",
        validate: (v) => (v?.trim() ? undefined : "Name is required"),
      }),
    ).trim();
  }

  let id = flags.id ?? applySuggestedSuffix(toKebabCase(name), kind);
  if (!flags.id && interactive) {
    id = exitOnCancel(
      await p.text({
        message: "Extension id",
        initialValue: id,
        validate: (v) => {
          const result = validateExtensionId(v ?? "", kind);
          return result.ok ? undefined : result.message;
        },
      }),
    ).trim();
  } else {
    let result = validateExtensionId(id, kind);
    if (!result.ok && result.canFixSuffix) {
      const fixed = applySuggestedSuffix(id, kind);
      if (interactive) {
        const accept = exitOnCancel(
          await p.confirm({
            message: `Use suggested id "${fixed}"?`,
            initialValue: true,
          }),
        );
        if (accept) {
          id = fixed;
          result = validateExtensionId(id, kind);
        }
      } else {
        id = fixed;
        result = validateExtensionId(id, kind);
      }
    }
    if (!result.ok) {
      if (!interactive) {
        throw new Error(result.message);
      }
      id = exitOnCancel(
        await p.text({
          message: "Extension id",
          initialValue: applySuggestedSuffix(id, kind),
          validate: (v) => {
            const next = validateExtensionId(v ?? "", kind);
            return next.ok ? undefined : next.message;
          },
        }),
      ).trim();
    }
  }

  let description = flags.description;
  if (!description) {
    requireFlag(interactive, ["--description"]);
    description = exitOnCancel(
      await p.text({
        message: "Description",
        placeholder: "Short description of the extension",
        validate: (v) => (v?.trim() ? undefined : "Description is required"),
      }),
    ).trim();
  }

  let author = flags.author;
  if (!author) {
    requireFlag(interactive, ["--author"]);
    author = exitOnCancel(
      await p.text({
        message: "Author",
        placeholder: "Your Name <you@example.com>",
        validate: (v) => (v?.trim() ? undefined : "Author is required"),
      }),
    ).trim();
  }

  let repository = flags.repository;
  if (!repository) {
    requireFlag(interactive, ["--repository"]);
    repository = exitOnCancel(
      await p.text({
        message: "Repository URL",
        placeholder: "https://github.com/you/your-extension",
        validate: (v) => (v?.trim() ? undefined : "Repository URL is required"),
      }),
    ).trim();
  }

  let license = flags.license ?? "MIT";
  if (!flags.license && interactive) {
    license = exitOnCancel(
      await p.select({
        message: "License",
        initialValue: "MIT" as const,
        options: LICENSES.map((id) => ({ value: id, label: id })),
      }),
    );
  }

  let directory = flags.directory ?? `./${id}`;
  if (!flags.directory && interactive) {
    directory = exitOnCancel(
      await p.text({
        message: "Target directory",
        initialValue: `./${id}`,
        validate: (v) => (v?.trim() ? undefined : "Directory is required"),
      }),
    ).trim();
  }

  const answers: Answers = {
    directory,
    kind,
    name,
    id,
    description,
    author,
    repository,
    license,
    gitInit: flags.gitInit,
    force: flags.force,
  };

  await collectKindSpecific(answers, flags, interactive);

  if (interactive) {
    const gitInit = exitOnCancel(
      await p.confirm({
        message: "Initialize a git repository?",
        initialValue: flags.gitInit,
      }),
    );
    answers.gitInit = gitInit;
  }

  return answers;
}

async function collectKindSpecific(
  answers: Answers,
  flags: CliFlags,
  interactive: boolean,
): Promise<void> {
  switch (answers.kind) {
    case "theme": {
      let appearance = flags.appearance;
      if (!appearance) {
        requireFlag(interactive, ["--appearance"]);
        appearance = exitOnCancel(
          await p.select({
            message: "Theme appearance",
            initialValue: "both" as const,
            options: [
              { value: "both" as const, label: "Dark and light" },
              { value: "dark" as const, label: "Dark only" },
              { value: "light" as const, label: "Light only" },
            ],
          }),
        );
      }
      answers.appearance = appearance;
      break;
    }
    case "icon-theme":
      break;
    case "snippets": {
      let scope = flags.snippetScope;
      if (!scope) {
        requireFlag(interactive, ["--snippet-scope"]);
        scope = exitOnCancel(
          await p.text({
            message: 'Snippet scope (language name, or "global")',
            initialValue: "global",
            validate: (v) => (v?.trim() ? undefined : "Scope is required"),
          }),
        ).trim();
      }
      answers.snippetScope = scope;
      break;
    }
    case "language": {
      await collectLanguageFields(answers, flags, interactive, true);
      break;
    }
    case "language-server": {
      let binary = flags.binary;
      if (!binary) {
        requireFlag(interactive, ["--binary"]);
        binary = exitOnCancel(
          await p.text({
            message: "Language server binary on PATH",
            placeholder: "my-language-server",
            validate: (v) => (v?.trim() ? undefined : "Binary is required"),
          }),
        ).trim();
      }
      answers.binary = binary;

      let includeLanguage = flags.includeLanguage;
      if (includeLanguage === undefined) {
        if (!interactive) {
          includeLanguage = false;
        } else {
          includeLanguage = exitOnCancel(
            await p.confirm({
              message: "Also scaffold language + grammar files?",
              initialValue: true,
            }),
          );
        }
      }
      answers.includeLanguage = includeLanguage;

      let lspLanguages = flags.lspLanguages;
      if (!lspLanguages?.length) {
        requireFlag(interactive, ["--lsp-languages"]);
        const raw = exitOnCancel(
          await p.text({
            message: "Languages this server supports (comma-separated)",
            initialValue: answers.name,
            validate: (v) =>
              v?.trim() ? undefined : "At least one language is required",
          }),
        );
        lspLanguages = raw
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
      answers.lspLanguages = lspLanguages;
      answers.languageName = lspLanguages[0];

      if (includeLanguage) {
        await collectLanguageFields(answers, flags, interactive, true);
      }
      break;
    }
    case "debugger": {
      let adapterId = flags.adapterId;
      if (!adapterId) {
        const suggested = toKebabCase(answers.id.replace(/-debugger$/, ""));
        if (!interactive) {
          adapterId = suggested || answers.id;
        } else {
          adapterId = exitOnCancel(
            await p.text({
              message: "Debug adapter id",
              initialValue: suggested || answers.id,
              validate: (v) =>
                v?.trim() ? undefined : "Adapter id is required",
            }),
          ).trim();
        }
      }
      answers.adapterId = adapterId;

      let binary = flags.binary;
      if (!binary) {
        requireFlag(interactive, ["--binary"]);
        binary = exitOnCancel(
          await p.text({
            message: "Debug adapter binary on PATH",
            initialValue: adapterId,
            validate: (v) => (v?.trim() ? undefined : "Binary is required"),
          }),
        ).trim();
      }
      answers.binary = binary;
      break;
    }
    case "mcp-server": {
      if (interactive) {
        p.note(
          "Zed plans to replace MCP server extensions with the official MCP registry. Publish there too.",
          "Deprecation notice",
        );
      }

      let serverId = flags.serverId;
      if (!serverId) {
        const suggested = answers.id.startsWith("mcp-server-")
          ? answers.id.slice("mcp-server-".length)
          : toKebabCase(answers.id.replace(/-mcp-server$/, ""));
        if (!interactive) {
          serverId = suggested || answers.id;
        } else {
          serverId = exitOnCancel(
            await p.text({
              message: "Context server id",
              initialValue: suggested || answers.id,
              validate: (v) =>
                v?.trim() ? undefined : "Server id is required",
            }),
          ).trim();
        }
      }
      answers.serverId = serverId;

      let binary = flags.binary;
      if (!binary) {
        requireFlag(interactive, ["--binary"]);
        binary = exitOnCancel(
          await p.text({
            message: "MCP server binary on PATH",
            initialValue: serverId,
            validate: (v) => (v?.trim() ? undefined : "Binary is required"),
          }),
        ).trim();
      }
      answers.binary = binary;

      let binaryArgs = flags.binaryArgs;
      if (!binaryArgs) {
        if (interactive) {
          const raw = exitOnCancel(
            await p.text({
              message: "Binary arguments (comma-separated, optional)",
              placeholder: "--stdio",
            }),
          );
          binaryArgs = raw
            ? raw
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : [];
        } else {
          binaryArgs = [];
        }
      }
      answers.binaryArgs = binaryArgs;
      break;
    }
  }
}

async function collectLanguageFields(
  answers: Answers,
  flags: CliFlags,
  interactive: boolean,
  required: boolean,
): Promise<void> {
  let languageName = flags.languageName ?? answers.languageName;
  if (!languageName) {
    if (!interactive && required) {
      requireFlag(interactive, ["--language-name"]);
    }
    languageName = exitOnCancel(
      await p.text({
        message: "Language display name",
        initialValue: answers.lspLanguages?.[0] ?? answers.name,
        validate: (v) => (v?.trim() ? undefined : "Language name is required"),
      }),
    ).trim();
  }
  answers.languageName = languageName;

  let pathSuffixes = flags.pathSuffixes;
  if (!pathSuffixes?.length) {
    if (!interactive && required) {
      requireFlag(interactive, ["--path-suffixes"]);
    }
    const raw = exitOnCancel(
      await p.text({
        message: "File suffixes (comma-separated, without dots)",
        placeholder: "myl",
        validate: (v) =>
          v?.trim() ? undefined : "At least one suffix is required",
      }),
    );
    pathSuffixes = raw
      .split(",")
      .map((s) => s.trim().replace(/^\./, ""))
      .filter(Boolean);
  }
  answers.pathSuffixes = pathSuffixes;

  let lineComment = flags.lineComment;
  if (!lineComment) {
    if (interactive) {
      lineComment = exitOnCancel(
        await p.text({
          message: "Line comment prefix",
          initialValue: "# ",
        }),
      );
    } else {
      lineComment = "# ";
    }
  }
  answers.lineComment = lineComment;

  let grammarRepo = flags.grammarRepo;
  if (!grammarRepo) {
    requireFlag(interactive, ["--grammar-repo"]);
    grammarRepo = exitOnCancel(
      await p.text({
        message: "Tree-sitter grammar repository URL",
        placeholder: "https://github.com/tree-sitter/tree-sitter-json",
        validate: (v) =>
          v?.trim() ? undefined : "Grammar repository is required",
      }),
    ).trim();
  }
  answers.grammarRepo = grammarRepo;

  let grammarRev = flags.grammarRev;
  if (!grammarRev) {
    requireFlag(interactive, ["--grammar-rev"]);
    grammarRev = exitOnCancel(
      await p.text({
        message: "Grammar commit SHA (40 hex characters)",
        placeholder: "94f5ce6879010de27509287006a85ffbcd0c9801",
        validate: (v) => {
          if (!v?.trim()) return "Revision is required";
          if (!/^[0-9a-fA-F]{40}$/.test(v.trim())) {
            return "Revision must be a 40-character commit SHA";
          }
          return undefined;
        },
      }),
    ).trim();
  } else if (!/^[0-9a-fA-F]{40}$/.test(grammarRev)) {
    throw new Error("--grammar-rev must be a 40-character commit SHA");
  }
  answers.grammarRev = grammarRev;
}
