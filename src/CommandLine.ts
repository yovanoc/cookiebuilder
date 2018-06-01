#!/usr/bin/env node

import * as yargs from 'yargs';
import * as fs from 'fs';

import { SwfReader } from 'xswf';
import { ITagDoAbc, TagCode } from 'xswf/dist/Types';
import { extractD2Enums } from './D2EnumExtractor';

yargs
  .usage('Usage: $0 --src [filePath] --out [filePath]')
  .demandOption(['src', 'out'])
  .alias('src', 's')
  .alias('out', 'o')
  .describe('src', 'Path to the DofusInvoker.swf')
  .describe('out', 'Where to save the generated protocol')
  .epilog('Copyright © 2018 DevChris & Aegis')
  .argv

const reader = new SwfReader(yargs.argv.src);
const file = reader.getFile();
const doAbc = file.tags.find((tag) => tag.code === TagCode.DoABC) as ITagDoAbc;
const abcFile = doAbc.abcFile;

fs.writeFileSync(
  yargs.argv.out,
  JSON.stringify(extractD2Enums(abcFile), null, 2)
);

console.log('Protocol generated!');
