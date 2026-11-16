import { toKebabCase } from "../ids.ts";
import type { Answers, ScaffoldFile } from "../types.ts";
import { cargoToml, rustLib } from "./rust.ts";
import { baseExtensionToml, readmeFor, sharedFiles } from "./shared.ts";

function rustStructName(id: string): string {
  return (
    id
      .split("-")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join("") + "Extension"
  );
}

export function mcpServerFiles(answers: Answers): ScaffoldFile[] {
  const serverId =
    answers.serverId ??
    ((answers.id.startsWith("mcp-server-")
      ? answers.id.slice("mcp-server-".length)
      : toKebabCase(answers.id.replace(/-mcp-server$/, ""))) ||
      answers.id);
  const binary = answers.binary ?? serverId;
  const args = answers.binaryArgs ?? [];

  const lib = `use zed_extension_api::{self as zed, Result};

struct ${rustStructName(answers.id)};

impl zed::Extension for ${rustStructName(answers.id)} {
    fn new() -> Self {
        Self
    }

    fn context_server_command(
        &mut self,
        _context_server_id: &zed::ContextServerId,
        _project: &zed::Project,
    ) -> Result<zed::Command> {
        Ok(zed::Command {
            command: ${JSON.stringify(binary)}.to_string(),
            args: vec![${args.map((a) => `${JSON.stringify(a)}.to_string()`).join(", ")}],
            env: Default::default(),
        })
    }
}

zed::register_extension!(${rustStructName(answers.id)});
`;

  return [
    {
      path: "extension.toml",
      contents: baseExtensionToml(answers, `[context_servers.${serverId}]`),
    },
    cargoToml(answers.id),
    rustLib(lib),
    readmeFor(answers, [
      "## MCP server binary",
      "",
      `This starter starts \`${binary}\`${args.length ? ` with args ${JSON.stringify(args)}` : ""}.`,
      "Do not bundle the server with the extension; download it or rely on the user's environment.",
    ]),
    ...sharedFiles(answers),
  ];
}
