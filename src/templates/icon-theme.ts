import { authorDisplayName } from "../ids.ts";
import type { Answers, ScaffoldFile } from "../types.ts";
import { baseExtensionToml, readmeFor, sharedFiles } from "./shared.ts";

const SVGS: Record<string, string> = {
  "folder.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#89b4fa" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/></svg>\n`,
  "folder-open.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#89b4fa" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v1H6.5a2 2 0 0 0-1.94 1.5L3 18V8z"/><path d="M3 18l1.7-5.1A2 2 0 0 1 6.6 11.5H21l-1.4 4.2A2 2 0 0 1 17.7 17H5a2 2 0 0 1-2-2z"/></svg>\n`,
  "file.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#cdd6f4" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/></svg>\n`,
  "chevron-right.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#a6adc8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>\n`,
  "chevron-down.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#a6adc8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>\n`,
};

export function iconThemeFiles(answers: Answers): ScaffoldFile[] {
  const iconTheme = {
    $schema: "https://zed.dev/schema/icon_themes/v0.3.0.json",
    name: answers.name,
    author: authorDisplayName(answers.author),
    themes: [
      {
        name: answers.name,
        appearance: "dark",
        directory_icons: {
          collapsed: "./icons/folder.svg",
          expanded: "./icons/folder-open.svg",
        },
        chevron_icons: {
          collapsed: "./icons/chevron-right.svg",
          expanded: "./icons/chevron-down.svg",
        },
        file_stems: {},
        file_suffixes: {},
        file_icons: {
          default: { path: "./icons/file.svg" },
        },
      },
    ],
  };

  return [
    { path: "extension.toml", contents: baseExtensionToml(answers) },
    {
      path: `icon_themes/${answers.id}.json`,
      contents: `${JSON.stringify(iconTheme, null, 2)}\n`,
    },
    ...Object.entries(SVGS).map(([name, contents]) => ({
      path: `icons/${name}`,
      contents,
    })),
    readmeFor(answers),
    ...sharedFiles(answers),
  ];
}
