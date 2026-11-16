import { authorDisplayName } from "../ids.ts";
import type { Answers, ScaffoldFile, ThemeAppearance } from "../types.ts";
import { baseExtensionToml, readmeFor, sharedFiles } from "./shared.ts";

type Palette = {
  background: string;
  foreground: string;
  accent: string;
  editorBackground: string;
  muted: string;
  border: string;
  keyword: string;
  string: string;
  comment: string;
  function: string;
  number: string;
};

const DARK: Palette = {
  background: "#1e1e2e",
  foreground: "#cdd6f4",
  accent: "#89b4fa",
  editorBackground: "#181825",
  muted: "#6c7086",
  border: "#313244",
  keyword: "#cba6f7",
  string: "#a6e3a1",
  comment: "#6c7086",
  function: "#89b4fa",
  number: "#fab387",
};

const LIGHT: Palette = {
  background: "#eff1f5",
  foreground: "#4c4f69",
  accent: "#1e66f5",
  editorBackground: "#ffffff",
  muted: "#9ca0b0",
  border: "#ccd0da",
  keyword: "#8839ef",
  string: "#40a02b",
  comment: "#9ca0b0",
  function: "#1e66f5",
  number: "#fe640b",
};

function themeStyle(p: Palette) {
  return {
    background: p.background,
    foreground: p.foreground,
    accent: p.accent,
    border: p.border,
    "border.variant": p.border,
    "element.background": p.background,
    "element.hover": p.border,
    "element.active": p.border,
    "element.selected": p.border,
    "elevated_surface.background": p.background,
    "surface.background": p.background,
    "editor.background": p.editorBackground,
    "editor.foreground": p.foreground,
    "editor.gutter.background": p.editorBackground,
    "editor.line_number": p.muted,
    "editor.active_line_number": p.foreground,
    "terminal.background": p.editorBackground,
    "terminal.foreground": p.foreground,
    "text.muted": p.muted,
    syntax: {
      keyword: { color: p.keyword, font_style: null, font_weight: null },
      string: { color: p.string, font_style: null, font_weight: null },
      comment: { color: p.comment, font_style: "italic", font_weight: null },
      function: { color: p.function, font_style: null, font_weight: null },
      number: { color: p.number, font_style: null, font_weight: null },
    },
  };
}

function themeEntry(name: string, appearance: "dark" | "light", p: Palette) {
  return {
    name,
    appearance,
    style: themeStyle(p),
  };
}

function appearances(choice: ThemeAppearance): Array<"dark" | "light"> {
  if (choice === "both") return ["dark", "light"];
  return [choice];
}

export function themeFiles(answers: Answers): ScaffoldFile[] {
  const choice = answers.appearance ?? "both";
  const themes = appearances(choice).map((appearance) =>
    themeEntry(
      appearance === "dark" ? `${answers.name} Dark` : `${answers.name} Light`,
      appearance,
      appearance === "dark" ? DARK : LIGHT,
    ),
  );

  const themeJson = {
    $schema: "https://zed.dev/schema/themes/v0.2.0.json",
    name: answers.name,
    author: authorDisplayName(answers.author),
    themes,
  };

  return [
    { path: "extension.toml", contents: baseExtensionToml(answers) },
    {
      path: `themes/${answers.id}.json`,
      contents: `${JSON.stringify(themeJson, null, 2)}\n`,
    },
    readmeFor(answers),
    ...sharedFiles(answers),
  ];
}
