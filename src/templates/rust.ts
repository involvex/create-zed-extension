import { crateNameFromId } from "../ids.ts";
import type { ScaffoldFile } from "../types.ts";

export function cargoToml(id: string): ScaffoldFile {
  const name = crateNameFromId(id);
  return {
    path: "Cargo.toml",
    contents: [
      "[package]",
      `name = "${name}"`,
      `version = "0.0.1"`,
      `edition = "2021"`,
      "",
      "[lib]",
      `crate-type = ["cdylib"]`,
      "",
      "[dependencies]",
      `zed_extension_api = "0.7.0"`,
      "",
    ].join("\n"),
  };
}

export function rustLib(contents: string): ScaffoldFile {
  return { path: "src/lib.rs", contents };
}
