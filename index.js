'use strict';
const debug = require('debug');
const flags = require('flags');
const fs = require('fs');

const {transformHTMLFile, transformJsFile, transformResult} = require('./src/transformFile.js');
const {verifyTransformation} = require('./src/verify.js');

const FILE_FLAG = 'file';
const DIR_FLAG = 'dir';
const OUTPUT_DIR_FLAG = 'output_dir';
const QUIET_FLAG = 'quiet';
const TARGET_BUILD_FLAG = 'target_build';
const VERIFY_FLAG = 'verify';

// If flags are added, deleted, or modified, UPDATE README.

// Specify exactly one of --file or --dir.
flags.defineString(FILE_FLAG, null, 'Path to test file to transform');
flags.defineString(DIR_FLAG, null, 'Path to dir of test files and directories to recursively transform');
flags.defineString(OUTPUT_DIR_FLAG, null, 'Path to dir where output files should be written. If null, will overwrite input files.');
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
  let dir = flags.get(DIR_FLAG);
  let outputDir = flags.get(OUTPUT_DIR_FLAG);
  const targetBuild = flags.get(TARGET_BUILD_FLAG);
  const verify = flags.get(VERIFY_FLAG);

  if ((file && dir) || (!file && !dir)) {
    throw new Error('Specify exactly one of --file or --dir');
  }

  // Removes the trailing / from directory, if present
  // Ex: fast/files/ -> fath/files
  if (outputDir && outputDir.endsWith('/')) {
    outputDir = outputDir.slice(0, -1);
  }

  if (file) {
    if (file.endsWith('.html')) {
      if (verify && transformHTMLFile(file, outputDir) === transformResult.SUCCESS) {
        verifyTransformation(file, targetBuild);
      }
    } else if (file.endsWith('.js')) {
      transformJsFile(file, outputDir);
    } else {
      error('Tool can only transform HTML tests or JS scripts, got:', file);
    }
    return;
  }


  // The code below is for processing a directory (if --dir specified).
  // The tool outputs a summary output on transformation and verification
  // results.

  // Removes the trailing / from directory, if present
  // Ex: fast/files/ -> fath/files
  if (dir.endsWith('/')) {
    dir = dir.slice(0, -1);
  }

  const jsFiles = [];
  const htmlFiles = [];
  getFilesRecursive(dir, jsFiles, htmlFiles);

  const completedTransformations = [];
  const skippedTransformations = [];
  const failedTransformations = [];
  const successfulVerifications = [];
  const failedVerifications = [];

  jsFiles.forEach((filePath) => {
    const result = transformJsFile(filePath, outputDir);
    if (result === transformResult.SUCCESS) {
      completedTransformations.push(filePath);
    } else if (result === transformResult.FAIL) {
      failedTransformations.push(filePath);
    } else if (result === transformResult.SKIP) {
      skippedTransformations.push(filePath);
    }
  });

  htmlFiles.forEach((filePath) => {
    const result = transformFile(filePath, outputDir);
    if (result === transformResult.SUCCESS) {
      completedTransformations.push(filePath);
      if (!verify) {
        return;
      }
      if (verifyTransformation(filePath, targetBuild)) {
        successfulVerifications.push(filePath);
      } else {
        failedVerifications.push(filePath);
      }
    } else if (result === transformResult.FAIL) {
      failedTransformations.push(filePath);
    } else if (result === transformResult.SKIP) {
      skippedTransformations.push(filePath);
    }
  });

  log('Transformation Results:');
  log('Completed Transformations:');
  console.log(completedTransformations.join('\n'));
  log('Skipped Transformations:');
  console.log(skippedTransformations.join('\n'));
  log('Failed Transformations:');
  console.log(failedTransformations.join('\n'));

  log('\nVerification Results:');
  log('Succesful Verifications:');
  console.log(successfulVerifications.join('\n'));
  log('Failed Verifications:');
  console.log(failedVerifications.join('\n'));
}

// getFilesRecursive traverses the file tree starting from
// dir and recursing downward into subdirectories,
// MODIFYING THE PARAMETER ARRAYS with .js files and .html
// files it finds along the way.
function getFilesRecursive(dir, jsFiles, htmlFiles) {
  const fileNames = fs.readdirSync(dir);
  fileNames.forEach((file) => {
    const path = dir + '/' + file;
    if (fs.statSync(path).isDirectory()) {
      return getFilesRecursive(path, jsFiles, htmlFiles);
    } else if (file.endsWith('.js')) {
      jsFiles.push(path);
    } else if (file.endsWith('.html')) {
      htmlFiles.push(path);
    }
  });
}

main().catch((reason) => {
  error(reason);
  process.exit(1);
});
