import { toKebabCase } from "../ids.ts";
import type { Answers, ScaffoldFile } from "../types.ts";
import {
  grammarTomlSection,
  languageAssetFiles,
  languageBitsFromAnswers,
} from "./language.ts";
import { cargoToml, rustLib } from "./rust.ts";
import {
  baseExtensionToml,
  readmeFor,
  sharedFiles,
  tomlString,
  tomlStringArray,
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

export function languageServerFiles(answers: Answers): ScaffoldFile[] {
  const binary = answers.binary ?? "language-server";
  const serverId =
    toKebabCase(answers.id.replace(/-(lsp|language-server)$/, "")) ||
    answers.id;
  const languages = answers.lspLanguages?.length
    ? answers.lspLanguages
    : [answers.languageName ?? answers.name];

  const sections: string[] = [
    `[language_servers.${serverId}]`,
    `name = ${tomlString(`${answers.name} Language Server`)}`,
    `languages = ${tomlStringArray(languages)}`,
  ];

  const files: ScaffoldFile[] = [];

  if (answers.includeLanguage) {
    const bits = languageBitsFromAnswers({
      ...answers,
      languageName: languages[0],
    });
    sections.push("", grammarTomlSection(bits));
    files.push(...languageAssetFiles(bits));
  }

  const lib = `use zed_extension_api::{self as zed, Result};

struct ${rustStructName(answers.id)};

impl zed::Extension for ${rustStructName(answers.id)} {
    fn new() -> Self {
        Self
    }

    fn language_server_command(
        &mut self,
        _language_server_id: &zed::LanguageServerId,
        worktree: &zed::Worktree,
    ) -> Result<zed::Command> {
        let command = worktree.which(${JSON.stringify(binary)}).ok_or_else(|| {
            format!(
                "Could not find \`${binary}\` on PATH. Install it and try again."
            )
        })?;

        Ok(zed::Command {
            command,
            args: vec![],
            env: Default::default(),
        })
    }
}

zed::register_extension!(${rustStructName(answers.id)});
`;

  return [
    {
      path: "extension.toml",
      contents: baseExtensionToml(answers, sections.join("\n")),
    },
    cargoToml(answers.id),
    rustLib(lib),
    ...files,
    readmeFor(answers, [
      "## Language server binary",
      "",
      `This starter looks for \`${binary}\` on the user's PATH. Do not bundle the language server with the extension.`,
    ]),
    ...sharedFiles(answers),
  ];
}
