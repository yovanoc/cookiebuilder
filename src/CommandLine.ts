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
  .usage("Usage: $0 --src [filePath] [--out [filePath]]")
  .demandOption(["out"])
  .alias("src", "s")
  .alias("out", "o")
  .describe(
    "src",
    "Path to the DofusInvoker.swf (Not required: could download the latest)"
  )
  .describe("out", "Where to save the generated protocol")
  .epilog("Copyright © 2018 DevChris & Aegis").argv;

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

      // fs.writeFileSync(args.out, JSON.stringify(extract(abcFile), null, 2));
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
