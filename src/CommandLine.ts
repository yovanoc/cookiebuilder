#!/usr/bin/env node

import { alias, argv, demandOption, describe, epilog, usage } from 'yargs';

usage('Usage: $0 --src [filePath] --out [filePath]');
demandOption(['src', 'out']);
alias('src', 's');
alias('out', 'o');
describe('src', 'Path to the DofusInvoker.swf');
describe('out', 'Where to save the generated protocol');
epilog('Copyright © 2018 DevChris');

console.log('Protocol generated!');
