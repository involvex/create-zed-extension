#!/usr/bin/env node
import * as p from "@clack/prompts";

import { parseCliArgs, usage } from "./cli-args.ts";
import { collectAnswers } from "./prompts.ts";
import { writeScaffold } from "./scaffold.ts";

async function main(): Promise<void> {
  let flags;
  try {
    flags = parseCliArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    console.error();
    console.error(usage());
    process.exit(2);
  }

  if (flags.help) {
    console.log(usage());
    process.exit(0);
  }

  try {
    const answers = await collectAnswers(flags);
    const target = writeScaffold(answers);

    if (process.stdin.isTTY) {
      p.outro(`Created ${answers.kind} extension in ${target}`);
      p.log.step("Next: open Zed → Install Dev Extension → select this folder");
    } else {
      console.log(`Created ${answers.kind} extension in ${target}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (process.stdin.isTTY) {
      p.cancel(message);
    } else {
      console.error(message);
    }
    process.exit(1);
  }
}

void main();
