#!/usr/bin/env node

import * as fs from "fs";
import * as Listr from "listr";
import { homedir } from "os";
import { join } from "path";
import { SwfReader } from "xswf";
import { ITagDoAbc, TagCode } from "xswf/dist/Types";
import * as yargs from "yargs";
import { build } from "./builder";
import { generateProtocol } from "./builder";
import Downloader from "./Downloader";
import { extract, IProtocol } from "./extractor";

const args = yargs
  .usage("Usage: $0 <command>") // (-e (--src [filePath]) --out [jsonFilePath]) or (-b --src [jsonFilePath])
  .command("extract", "Extract the protocol.")
  .option("s", {
    description:
      "DofusInvorker path. If not provided, we doawnload the last one.",
    required: false
  })
  .alias("s", ["src", "source"])
  .option("o", {
    description: "Json outputh path. Required.",
    required: true
  })
  .command("build", "Build the TS protocol.")
  .option("o", {
    description: "Output path for the protocol directory.",
    required: true
  })
  .alias("o", ["out", "output"])
  .example(
    "yarn start e -o protocol.json -s ./tests/DofusInvoker.swf",
    "Extract the protocol from the Invoker passed in arguments."
  )
  .showHelpOnFail(false, "whoops, something went wrong! run with --help").argv;

if (args._[0] === "extract") {
  const path = join(homedir(), "DofusInvoker.swf");

let protocol: IProtocol;

const tasks: Listr.ListrTask[] = [];

  if (!args.src) {
    tasks.push(Downloader.getDownloadTask(path));
  }

  tasks.push({
    title: "Extract protocol",
    task: (ctx, task) => {
      return new Promise<void>(resolve => {
        const reader = new SwfReader(args.src || path);
        const file = reader.getFile();
        const doAbc = file.tags.find(
          tag => tag.code === TagCode.DoABC
        ) as ITagDoAbc;
        const abcFile = doAbc.abcFile;

      protocol = extract(abcFile);
      fs.writeFileSync(args.out, JSON.stringify(protocol));

        resolve();
      });
    }
  });

tasks.push({
  title: "Build protocol",
  task: (ctx, task) => {
    return new Promise<void>(resolve => {
      build(protocol, "./protocol");
      resolve();
    });
  }
});

const listr = new Listr(tasks, {
  concurrent: false,
  renderer: "default"
});

  listr.run().then(() => {
    if (!args.src && path) {
      fs.unlinkSync(path);
    }
  });
} else if (args._[0] === "build") {
  generateProtocol("./protocol.json", "./test");
} else {
  throw new Error("whoops, something went wrong! run with --help");
}
