#!/usr/bin/env node

import * as fs from "fs";
import * as Listr from "listr";
import { homedir } from "os";
import { join } from "path";
import { SwfReader } from "xswf";
import { ITagDoAbc, TagCode } from "xswf/dist/Types";
import * as yargs from "yargs";
import { build } from "./builder";
import Downloader from "./Downloader";
import { extract, IProtocol } from "./extractor";

const args = yargs
  .usage("Usage: $0 <command>") // (-e (--src [filePath]) --out [jsonFilePath]) or (-b --src [jsonFilePath])
  .command("extract", "Extract the protocol.")
  .option("s", {
    description:
      "DofusInvoker path. If not provided, we download the last one.",
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
    "cookiebuilder extract -o protocol.json -s ./tests/DofusInvoker.swf",
    "Extract the protocol from the Invoker passed in arguments."
  )
  .example(
    "cookiebuilder build -o protocol/ -s protocol.json",
    "Build the protocol from the protocol.json generated with the extract command."
  )
  .showHelpOnFail(false, "whoops, something went wrong! run with --help").argv;

const tasks: Listr.ListrTask[] = [];
const path = join(homedir(), "DofusInvoker.swf");

let protocol: IProtocol;

if (!args.src) {
  tasks.push(Downloader.getDownloadTask(path));
}

if (args._[0] === "extract") {
  tasks.push({
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
    },
    title: "Extract protocol"
  });
} else if (args._[0] === "build") {
  if (args.src) {
    protocol = JSON.parse(fs.readFileSync(args.src, { encoding: "utf8" }));
  } else {
    // TODO: Refactor this to add createExtractTask method
    tasks.push({
      task: (ctxx, taskk) => {
        return new Promise<void>(resolvee => {
          const reader = new SwfReader(args.src || path);
          const file = reader.getFile();
          const doAbc = file.tags.find(
            tag => tag.code === TagCode.DoABC
          ) as ITagDoAbc;
          const abcFile = doAbc.abcFile;

          protocol = extract(abcFile);

          resolvee();
        });
      },
      title: "Extract protocol"
    });
  }

  tasks.push({
    task: (ctx, task) => {
      return new Promise<void>(resolve => {
        build(protocol, args.out);
        resolve();
      });
    },
    title: "Build protocol"
  });
} else {
  console.log("whoops, something went wrong! run with --help");
  process.exit();
}

const listr = new Listr(tasks, {
  concurrent: false,
  renderer: "default"
});

listr.run().then(() => {
  if (!args.src && path) {
    fs.unlinkSync(path);
  }
});
