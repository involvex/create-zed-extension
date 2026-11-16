import { toKebabCase } from "../ids.ts";
import type { Answers, ScaffoldFile } from "../types.ts";
import {
  baseExtensionToml,
  readmeFor,
  sharedFiles,
  tomlString,
  tomlStringArray,
} from "./shared.ts";

export type LanguageBits = {
  languageName: string;
  languageDir: string;
  grammarName: string;
  pathSuffixes: string[];
  lineComment: string;
  grammarRepo: string;
  grammarRev: string;
};

export function languageBitsFromAnswers(answers: Answers): LanguageBits {
  const languageName = answers.languageName ?? answers.name;
  const languageDir = toKebabCase(languageName) || answers.id;
  const grammarName = languageDir;
  return {
    languageName,
    languageDir,
    grammarName,
    pathSuffixes: answers.pathSuffixes?.length
      ? answers.pathSuffixes
      : [languageDir],
    lineComment: answers.lineComment ?? "# ",
    grammarRepo:
      answers.grammarRepo ?? "https://github.com/tree-sitter/tree-sitter-json",
    grammarRev:
      answers.grammarRev ?? "94f5ce6879010de27509287006a85ffbcd0c9801",
  };
}

export function languageAssetFiles(bits: LanguageBits): ScaffoldFile[] {
  const config = [
    `name = ${tomlString(bits.languageName)}`,
    `grammar = ${tomlString(bits.grammarName)}`,
    `path_suffixes = ${tomlStringArray(bits.pathSuffixes)}`,
    `line_comments = ${tomlStringArray([bits.lineComment])}`,
    "",
  ].join("\n");

  const highlights = `; Placeholder Tree-sitter highlights for ${bits.languageName}.
; Replace these with queries that match your grammar.
; (identifier) @variable
; (string) @string
; (comment) @comment
`;

  const brackets = `; Placeholder bracket pairs for ${bits.languageName}.
; ("(" @open ")" @close)
; ("[" @open "]" @close)
; ("{" @open "}" @close)
`;

  return [
    { path: `languages/${bits.languageDir}/config.toml`, contents: config },
    {
      path: `languages/${bits.languageDir}/highlights.scm`,
      contents: highlights,
    },
    {
      path: `languages/${bits.languageDir}/brackets.scm`,
      contents: brackets,
    },
  ];
}

export function grammarTomlSection(bits: LanguageBits): string {
  return [
    `[grammars.${bits.grammarName}]`,
    `repository = ${tomlString(bits.grammarRepo)}`,
    `rev = ${tomlString(bits.grammarRev)}`,
  ].join("\n");
}

export function languageFiles(answers: Answers): ScaffoldFile[] {
  const bits = languageBitsFromAnswers(answers);
  return [
    {
      path: "extension.toml",
      contents: baseExtensionToml(answers, grammarTomlSection(bits)),
    },
    ...languageAssetFiles(bits),
    readmeFor(answers, [
      "## Language grammar",
      "",
      "Replace the placeholder Tree-sitter queries and point `repository` / `rev` at the grammar you want to ship.",
    ]),
    ...sharedFiles(answers),
  ];
}
