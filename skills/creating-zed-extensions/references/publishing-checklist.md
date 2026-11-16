# Publishing checklist

From https://zed.dev/docs/extensions/publishing/prerequisites

## General

- [ ] Manually tested as a Zed **dev extension** at the commit you will submit
- [ ] Feature is not already covered by an existing registry extension (contribute upstream first)
- [ ] Id is unique, kebab-case, no `zed` / `extension` substring
- [ ] Id matches kind conventions (theme / icons / snippets / lsp / debugger / mcp)
- [ ] Only ships resources the extension needs
- [ ] Allowed `LICENSE` present in the extension directory
- [ ] User-facing text is English
- [ ] No filesystem access outside Zed’s designated extension environment

## By kind

- [ ] **Language:** grammar defined for every language; no Rust unless also shipping a language server
- [ ] **Language server:** id reflects LSP; binary not bundled
- [ ] **Debugger:** id ends with `-debugger`; adapter not bundled; schema present
- [ ] **Theme:** themes only; id ends with `-theme`
- [ ] **Icon theme:** icons only; id ends with `-icon-theme` or `-icons`
- [ ] **Snippets:** id reflects snippets when snippets-only; scopes correct
- [ ] **MCP:** single server; id uses `mcp-server-` / `-mcp-server`; binary not bundled; also publish to MCP registry
- [ ] **Not** submitting slash-command or agent-server extensions

## Submit

Follow https://zed.dev/docs/extensions/publishing/publishing-guide — typically a PR to https://github.com/zed-industries/extensions
