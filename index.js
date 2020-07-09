'use strict';
const flags = require('flags');
const fs = require('fs');
const tmp = require('tmp');

const extractScriptsFromHTML = require('./src/extractScripts.js');

const FILE_FLAG = 'file';
const DIR_FLAG = 'dir';
const KEEP_TEMP_FLAG = 'keepTemp';

// Specify exactly one of --file or --dir.
flags.defineString(FILE_FLAG, null, 'Path to test file to transform');
flags.defineString(DIR_FLAG, null, 'Path to dir of test files to transform');
flags.defineBoolean(KEEP_TEMP_FLAG, false,
    'If true, keep the temporary directories of extracted scripts upon exit.');
// TODO: flag for output dir
flags.parse();

async function main() {
  const file = flags.get(FILE_FLAG);
  const dir = flags.get(DIR_FLAG);

  if ((file && dir) || (!file && !dir)) {
    throw new Error('Specify exactly one of --file or --dir');
  }

  if (file) {
    return transformFile(file);
  }

  const fileNames = fs.readdirSync(dir);
  fileNames.forEach((fileName) => {
    transformFile(dir + fileName);
  });
}

function transformFile(filePath) {
  console.log('Starting transformation on', filePath);
  const tempDir = tmp.dirSync({
    prefix: 'tempJsScripts',
    unsafeCleanup: true,
    tmpdir: '.',
  });

  try {
    const scripts = extractScriptsFromHTML(filePath, tempDir);
    console.log('Wrote temporary scripts:', scripts);
    // TODO: make/write to output dir here?
    // TODO: call transforming script when it exists
  } catch (err) {
    if (!flags.get(KEEP_TEMP_FLAG)) {
      tempDir.removeCallback();
    }
    console.log('Error while transforming', filePath);
    console.log(err);
  }

  if (!flags.get(KEEP_TEMP_FLAG)) {
    tempDir.removeCallback();
  }
}

main().catch((reason) => {
  console.error(reason);
  process.exit(1);
});
