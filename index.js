'use strict';
const debug = require('debug');
const flags = require('flags');
const fs = require('fs');

const {transformFile, transformResult} = require('./src/transformFile.js');
const {verifyTransformation} = require('./src/verify.js');

const FILE_FLAG = 'file';
const DIR_FLAG = 'dir';
const OUTPUT_DIR_FLAG = 'output_dir';
const QUIET_FLAG = 'quiet';
const TARGET_BUILD_FLAG = 'target_build';
const VERIFY_FLAG = 'verify';

// Specify exactly one of --file or --dir.
flags.defineString(FILE_FLAG, null, 'Path to test file to transform');
flags.defineString(DIR_FLAG, null, 'Path to dir of test files to transform');
// eslint-disable-next-line max-len
flags.defineString(OUTPUT_DIR_FLAG, null, 'Path to dir where output files should be written. If null, will overwrite input files.');
// eslint-disable-next-line max-len
flags.defineString(TARGET_BUILD_FLAG, 'Default', 'Target build used in -t parameter for run_web_tests.py');
flags.defineBoolean(QUIET_FLAG, false, 'Disable logging');
flags.defineBoolean(VERIFY_FLAG, true, 'Runs web test after transforming.');
flags.parse();

const log = debug('index.js');
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
  const targetBuild = flags.get(TARGET_BUILD_FLAG);
  const verify = flags.get(VERIFY_FLAG);

  if ((file && dir) || (!file && !dir)) {
    throw new Error('Specify exactly one of --file or --dir');
  }

  if (file) {
    if (transformFile(file, outputDir) === transformResult.SUCCESS && verify) {
      verifyTransformation(file, targetBuild);
    }
    return;
  }


  // The code below is for processing a directory (if --dir) specified.
  // The tool outputs a summary output on transformation and verification
  // results.

  const fileNames = fs.readdirSync(dir);
  const skippedTransformations = [];
  const failedTransformations = [];
  const failedVerifications = [];
  fileNames.forEach((fileName) => {
    if (fileName.split('.').pop() !== 'html') {
      return;
    }
    const filePath = dir + '/' + fileName;
    const result = transformFile(filePath, outputDir);
    if (result === transformResult.SUCCESS) {
      if (verify && !verifyTransformation(filePath, targetBuild)) {
        failedVerifications.push(filePath);
      }
    } else if (result === transformResult.FAIL) {
      failedTransformations.push(filePath);
    } else if (result === transformResult.SKIP) {
      skippedTransformations.push(filePath);
    }
  });
  log('Skipped Transformations:', skippedTransformations);
  log('Failed Transformations:', failedTransformations);
  log('Failed Verifications:', failedVerifications);
}

main().catch((reason) => {
  error(reason);
  process.exit(1);
});
