'use strict';
const flags = require('flags');
const fs = require('fs');

// The order of operation is to extract each js script from HTML, transform it,
// then inject it back into HTML.
const {extractScriptsFromHTML} = require('./src/extractScripts.js');
const {transformSourceCodeString} = require('./src/transform.js');
const {injectScriptsIntoHTML} = require('./src/injectScripts.js');

const FILE_FLAG = 'file';
const DIR_FLAG = 'dir';

// Specify exactly one of --file or --dir.
flags.defineString(FILE_FLAG, null, 'Path to test file to transform');
flags.defineString(DIR_FLAG, null, 'Path to dir of test files to transform');
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

  try {
    const transformedScripts = [];
    const originalScripts = extractScriptsFromHTML(filePath);
    originalScripts.forEach((script) => {
      const newScript = transformSourceCodeString(script);
      transformedScripts.push(newScript);
    });
    injectScriptsIntoHTML(filePath, transformedScripts, outputPath);
    console.log('Completed transformation, wrote', outputPath);
  } catch (err) {
    console.log('Error while transforming', filePath);
    console.log(err);
  }
}

main().catch((reason) => {
  console.error(reason);
  process.exit(1);
});
