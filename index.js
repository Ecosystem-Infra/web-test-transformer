'use strict';
const debug = require('debug');
const flags = require('flags');
const fs = require('fs');

const {transformFile} = require('./src/transformFile.js');


const FILE_FLAG = 'file';
const DIR_FLAG = 'dir';
const OUTPUT_DIR_FLAG = 'output_dir';
const QUIET_FLAG = 'quiet';

// Specify exactly one of --file or --dir.
flags.defineString(FILE_FLAG, null, 'Path to test file to transform');
flags.defineString(DIR_FLAG, null, 'Path to dir of test files to transform');
// eslint-disable-next-line max-len
flags.defineString(OUTPUT_DIR_FLAG, null, 'Path to dir where output files should be written. If null, will overwrite input files.');
flags.defineBoolean(QUIET_FLAG, false, 'Disable logging');
flags.parse();

const error = debug('index.js:ERROR');
// For some reason 1 is RED
error.color = 1;

// babel npm package has very verbose debug usage, so enable all but babel.
debug.enable('* -babel');
if (flags.get(QUIET_FLAG)) {
  // disables all namespaces
  debug.disable();
}

async function main() {
  const file = flags.get(FILE_FLAG);
  const dir = flags.get(DIR_FLAG);
  const outputDir = flags.get(OUTPUT_DIR_FLAG);

  if ((file && dir) || (!file && !dir)) {
    throw new Error('Specify exactly one of --file or --dir');
  }

  if (file) {
    return transformFile(file, outputDir);
  }

  const fileNames = fs.readdirSync(dir);
  fileNames.forEach((fileName) => {
    transformFile(dir + fileName, outputDir);
  });
}

main().catch((reason) => {
  error(reason);
  process.exit(1);
});
