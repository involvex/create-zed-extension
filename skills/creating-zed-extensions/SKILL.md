---
name: creating-zed-extensions
description: >-
  Scaffold and implement Zed editor extensions (themes, icon themes, snippets,
  languages, language servers, debuggers, MCP servers). Use when creating a Zed
  extension, editing extension.toml, Tree-sitter grammars/queries, zed_extension_api
  Rust/WASM code, Install Dev Extension workflows, or publishing to the Zed
  extension registry.
license: MIT
compatibility: Requires Bun or Node for create-zed-extension; Rust via rustup for WASM extensions
metadata:
  author: involvex
  docs: https://github.com/zed-industries/zed/tree/main/docs/src/extensions
---

# Creating Zed Extensions

## Official docs (source of truth)

Always prefer current Zed docs over older slash-command / ACP extension guides:

- Docs tree: https://github.com/zed-industries/zed/tree/main/docs/src/extensions
- Developing: https://zed.dev/docs/extensions/developing-extensions
- Publishing prerequisites: https://zed.dev/docs/extensions/publishing/prerequisites

Index of pages in this tree: [references/docs-index.md](references/docs-index.md)

## Pair with the scaffolder

Prefer scaffolding over hand-rolling manifests:

```bash
bunx create-zed-extension
# or after this repo is published:
npx create-zed-extension
bun create zed-extension
```

Install this skill via skills CLI:

```bash
npx skills add involvex/create-zed-extension --skill creating-zed-extensions
# or
skills add involvex/create-zed-extension -s creating-zed-extensions
```

## When to use / not use

**Use for:** themes, icon themes, snippets, languages (+ grammars), language servers, debuggers (DAP), MCP/context servers.

**Do not use for:** slash-command extensions or agent-server (ACP) extensions — both are removed/deprecated; submissions are rejected. Put agents in the [ACP Registry](https://agentclientprotocol.com/registry). Prefer the [MCP registry](https://registry.modelcontextprotocol.io/) for new MCP servers (extension MCP path is being phased out).

## Extension kinds and id rules

One primary kind per extension when publishing (language + its LSP is the allowed combo).

| Kind            | Id convention                    | Rust required?                            |
| --------------- | -------------------------------- | ----------------------------------------- |
| Theme           | `*-theme`                        | No                                        |
| Icon theme      | `*-icon-theme` or `*-icons`      | No                                        |
| Snippets        | `*-snippets` (if snippets-only)  | No                                        |
| Language        | language name-like id            | No (forbid Rust unless also shipping LSP) |
| Language server | `*-language-server` or `*-lsp`   | Yes                                       |
| Debugger        | `*-debugger`                     | Yes                                       |
| MCP server      | `mcp-server-*` or `*-mcp-server` | Yes                                       |

Id must be kebab-case, unique, and must **not** contain `zed` or `extension`.

Allowed licenses: Apache-2.0, BSD-2-Clause, BSD-3-Clause, CC-BY-4.0, GPL-3.0, LGPL-3.0, MIT, Unlicense, Zlib. Put a matching `LICENSE` file in the extension directory.

## Minimal layout

```text
my-extension/
  extension.toml      # required
  LICENSE
  Cargo.toml          # only if Rust needed
  src/lib.rs
  languages/<name>/config.toml + *.scm
  themes/*.json
  icon_themes/*.json + icons/
  snippets/*.json
  debug_adapter_schemas/*.json
```

`extension.toml` baseline:

```toml
id = "my-extension"
name = "My extension"
version = "0.0.1"
schema_version = 1
authors = ["Your Name <you@example.com>"]
description = "Example extension"
repository = "https://github.com/your-name/my-extension"
```

## Workflow

1. **Scaffold** with `create-zed-extension` for the chosen kind.
2. **Fill** kind-specific files (see below). Keep placeholders out of published PRs.
3. **Dev load:** Zed → **Install Dev Extension** (`zed::InstallDevExtension`) → select the extension directory.
4. **Debug:** `zed::OpenLog`, or relaunch `zed --foreground` for INFO logs. Rust `println!` / `dbg!` go to the Zed process stdout/stderr.
5. **Publish:** follow https://zed.dev/docs/extensions/publishing/publishing-guide (PR to `zed-industries/extensions`).

Rust target is **`wasm32-wasip2`** (not wasip1). rustup installs it automatically when Zed builds the dev extension. Grammar builds may need wasi-sdk (`WASI_SDK_PATH`).

Use latest `zed_extension_api` on crates.io that still supports the Zed versions you care about.

## Kind recipes

### Theme (JSON only)

- `themes/<id>.json` with `$schema`: `https://zed.dev/schema/themes/v0.2.0.json`
- Theme-only: no other features in the same extension

### Icon theme

- `icon_themes/*.json` with `$schema`: `https://zed.dev/schema/icon_themes/v0.3.0.json`
- Icon paths relative to extension root under `icons/`

### Snippets

```toml
snippets = ["./snippets/rust.json", "./snippets/snippets.json"]
```

Files are matched by lowercase language name (`rust.json`); `snippets.json` is global.

### Language (no Rust)

- `languages/<dir>/config.toml` with `name`, `grammar`, `path_suffixes`, optional `line_comments`
- Queries: at least `highlights.scm` (add `brackets.scm`, `outline.scm`, … as needed)
- Register grammar:

```toml
[grammars.my-language]
repository = "https://github.com/org/tree-sitter-my-language"
rev = "<40-char-commit-sha>"
```

### Language server (Rust)

```toml
[language_servers.my-lsp]
name = "My LSP"
languages = ["My Language"]
```

Implement `language_server_command`. Resolve binaries with `worktree.which` — **do not bundle** the server. Download or locate via the extension API.

### Debugger (Rust)

```toml
[debug_adapters.my-adapter]
schema_path = "debug_adapter_schemas/my-adapter.json"
```

Implement `get_dap_binary` and `dap_request_kind`. Schema is mandatory. Do not bundle the adapter binary.

### MCP / context server (Rust)

```toml
[context_servers.my-context-server]
```

Implement `context_server_command`. One MCP server only; do not bundle the binary. Also publish to the MCP registry.

## Rust stub

```rust
use zed_extension_api as zed;

struct MyExtension;

impl zed::Extension for MyExtension {
    fn new() -> Self {
        Self
    }
}

zed::register_extension!(MyExtension);
```

```toml
[lib]
crate-type = ["cdylib"]

[dependencies]
zed_extension_api = "0.7.0"
```

WASM caveats: prefer `zed::current_platform` and `Worktree` (`which`, `shell_env`, `root_path`) over `std::env::var` / host `cfg`.

## Common mistakes

| Mistake                           | Fix                               |
| --------------------------------- | --------------------------------- |
| Slash commands / agent servers    | Rejected — use MCP / ACP registry |
| Rust in a language-only extension | Remove Cargo.toml / src           |
| Bundled LSP / DAP / MCP binary    | Download or `which` at runtime    |
| Wrong WASM target docs            | Use `wasm32-wasip2`               |
| Id contains `zed` or `extension`  | Rename                            |
| Missing LICENSE                   | Add an allowed license file       |

## References

- [references/docs-index.md](references/docs-index.md) — map of the official docs tree
- [references/publishing-checklist.md](references/publishing-checklist.md) — registry gate checklist
