import type { Answers, ScaffoldFile } from "../types.ts";
import {
  baseExtensionToml,
  readmeFor,
  sharedFiles,
  tomlString,
} from "./shared.ts";

export function snippetsFiles(answers: Answers): ScaffoldFile[] {
  const scope = answers.snippetScope ?? "global";
  const fileName =
    scope === "global" ? "snippets.json" : `${scope.toLowerCase()}.json`;
  const relative = `./snippets/${fileName}`;

  const sample = {
    "Hello snippet": {
      prefix: "hello",
      body: ["Hello, ${1:World}!", "$0"],
      description: "A starter snippet",
    },
  };

  return [
    {
      path: "extension.toml",
      contents: baseExtensionToml(
        answers,
        `snippets = [${tomlString(relative)}]`,
      ),
    },
    {
      path: `snippets/${fileName}`,
      contents: `${JSON.stringify(sample, null, 2)}\n`,
    },
    readmeFor(answers),
    ...sharedFiles(answers),
  ];
}
