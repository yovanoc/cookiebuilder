#!/usr/bin/env node

import * as fs from "fs";
import * as yargs from "yargs";

import { SwfReader } from "xswf";
import { ITagDoAbc, TagCode } from "xswf/dist/Types";
import { extract } from "./extractor";

const args = yargs
  .usage("Usage: $0 --src [filePath] --out [filePath]")
  .demandOption(["src", "out"])
  .alias("src", "s")
  .alias("out", "o")
  .describe("src", "Path to the DofusInvoker.swf")
  .describe("out", "Where to save the generated protocol")
  .epilog("Copyright © 2018 DevChris & Aegis").argv;

const start = process.hrtime();

const reader = new SwfReader(args.src);
const file = reader.getFile();
const doAbc = file.tags.find(tag => tag.code === TagCode.DoABC) as ITagDoAbc;
const abcFile = doAbc.abcFile;

fs.writeFileSync(args.out, JSON.stringify(extract(abcFile), null, 2));

const NS_PER_SEC = 1e9;
const diff = process.hrtime(start);

console.log(`Protocol generated in ${diff[0] * NS_PER_SEC + diff[1]} ns :D`);
