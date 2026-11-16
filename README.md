# create-zed-extension

Interactive CLI that scaffolds [Zed](https://zed.dev) editor extensions — similar to `yo code` or `bun create …`.

```bash
bun create zed-extension
npm create zed-extension
pnpm create zed-extension
npx create-zed-extension
```

## What it creates

One publishable extension kind per run:

| Kind            | Output                                           |
| --------------- | ------------------------------------------------ |
| Theme           | `themes/*.json`                                  |
| Icon theme      | `icon_themes/*.json` + SVG icons                 |
| Snippets        | `snippets/*.json`                                |
| Language        | `languages/**` + Tree-sitter grammar entry       |
| Language server | Rust (`wasm32-wasip2`) + optional language files |
| Debugger        | Rust DAP adapter + JSON schema                   |
| MCP server      | Rust context server starter                      |

Slash-command and agent-server extensions are not offered (removed / deprecated by Zed).

## Non-interactive example

```bash
npx create-zed-extension ./midnight-theme \
  --kind theme \
  --name "Midnight" \
  --id midnight-theme \
  --description "A dark and light starter theme" \
  --author "You <you@example.com>" \
  --repository https://github.com/you/midnight-theme \
  --appearance both \
  --no-git
```

## Develop the generated extension

1. Open Zed.
2. Run **Install Dev Extension**.
3. Select the generated directory.

## Agent skill (skills CLI)

This repo ships a `creating-zed-extensions` skill for coding agents, keyed off the official docs at [zed-industries/zed/docs/src/extensions](https://github.com/zed-industries/zed/tree/main/docs/src/extensions).

```bash
npx skills add involvex/create-zed-extension --skill creating-zed-extensions
# or
skills add involvex/create-zed-extension -s creating-zed-extensions
```

## Develop this CLI

```bash
bun install
bun check
bun fmt
bun lint
bun test
bun run build
bun dist/index.js --help
# or without building:
bun src/index.ts --help
```

## License

MIT
