import { toKebabCase } from "../ids.ts";
import type { Answers, ScaffoldFile } from "../types.ts";
import { cargoToml, rustLib } from "./rust.ts";
import {
  baseExtensionToml,
  readmeFor,
  sharedFiles,
  tomlString,
} from "./shared.ts";

function rustStructName(id: string): string {
  return (
    id
      .split("-")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join("") + "Extension"
  );
}

export function debuggerFiles(answers: Answers): ScaffoldFile[] {
  const adapterId =
    answers.adapterId ??
    (toKebabCase(answers.id.replace(/-debugger$/, "")) || answers.id);
  const binary = answers.binary ?? adapterId;
  const schemaPath = `debug_adapter_schemas/${adapterId}.json`;

  const schema = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    title: `${answers.name} debug adapter configuration`,
    type: "object",
    properties: {
      request: {
        type: "string",
        enum: ["launch", "attach"],
        description:
          "Whether to launch a new process or attach to an existing one.",
      },
      program: {
        type: "string",
        description: "Path to the program to debug (launch).",
      },
      cwd: {
        type: "string",
        description: "Working directory for the debuggee.",
      },
      args: {
        type: "array",
        items: { type: "string" },
        description: "Arguments passed to the program.",
      },
    },
    required: ["request"],
  };

  const cargo = cargoToml(answers.id);
  cargo.contents = cargo.contents.replace(
    `[dependencies]\nzed_extension_api = "0.7.0"\n`,
    `[dependencies]\nzed_extension_api = "0.7.0"\nserde_json = "1.0"\n`,
  );

  const lib = `use zed_extension_api::{
    self as zed, DebugAdapterBinary, DebugConfig, DebugScenario, DebugTaskDefinition, Result,
    StartDebuggingRequestArguments, StartDebuggingRequestArgumentsRequest,
};

struct ${rustStructName(answers.id)};

impl zed::Extension for ${rustStructName(answers.id)} {
    fn new() -> Self {
        Self
    }

    fn get_dap_binary(
        &mut self,
        _adapter_name: String,
        config: DebugTaskDefinition,
        user_provided_debug_adapter_path: Option<String>,
        worktree: &zed::Worktree,
    ) -> Result<DebugAdapterBinary, String> {
        let command = user_provided_debug_adapter_path
            .or_else(|| worktree.which(${JSON.stringify(binary)}))
            .ok_or_else(|| {
                format!(
                    "Could not find \`${binary}\` on PATH. Install it or set a custom adapter path."
                )
            })?;

        let parsed: serde_json::Value = serde_json::from_str(&config.config)
            .map_err(|e| format!("Invalid debug configuration JSON: {e}"))?;
        let request = Self::request_kind_from_config(&parsed)?;

        Ok(DebugAdapterBinary {
            command: Some(command),
            arguments: vec![],
            envs: vec![],
            cwd: Some(worktree.root_path()),
            connection: None,
            request_args: StartDebuggingRequestArguments {
                configuration: config.config,
                request,
            },
        })
    }

    fn dap_request_kind(
        &mut self,
        _adapter_name: String,
        config: serde_json::Value,
    ) -> Result<StartDebuggingRequestArgumentsRequest, String> {
        Self::request_kind_from_config(&config)
    }

    fn dap_config_to_scenario(&mut self, _config: DebugConfig) -> Result<DebugScenario, String> {
        Err(format!(
            "dap_config_to_scenario is not implemented for {}. Configure debug.json manually for now.",
            ${JSON.stringify(adapterId)}
        ))
    }
}

impl ${rustStructName(answers.id)} {
    fn request_kind_from_config(
        config: &serde_json::Value,
    ) -> Result<StartDebuggingRequestArgumentsRequest, String> {
        match config.get("request").and_then(|v| v.as_str()) {
            Some("launch") => Ok(StartDebuggingRequestArgumentsRequest::Launch),
            Some("attach") => Ok(StartDebuggingRequestArgumentsRequest::Attach),
            Some(other) => Err(format!("Unknown request kind: {other}")),
            None => Err("Debug configuration must include a \\"request\\" field".to_string()),
        }
    }
}

zed::register_extension!(${rustStructName(answers.id)});
`;

  return [
    {
      path: "extension.toml",
      contents: baseExtensionToml(
        answers,
        [
          `[debug_adapters.${adapterId}]`,
          `schema_path = ${tomlString(schemaPath)}`,
        ].join("\n"),
      ),
    },
    {
      path: schemaPath,
      contents: `${JSON.stringify(schema, null, 2)}\n`,
    },
    cargo,
    rustLib(lib),
    readmeFor(answers, [
      "## Debug adapter binary",
      "",
      `This starter looks for \`${binary}\` on the user's PATH. Do not bundle the adapter with the extension.`,
    ]),
    ...sharedFiles(answers),
  ];
}
