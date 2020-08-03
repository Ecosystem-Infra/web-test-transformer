'use strict';
const debug = require('debug')('index');
const flags = require('flags');
const fs = require('fs');

// The order of operation is to extract each js script from HTML, transform it,
// then inject it back into HTML.
const {extractScriptsFromHTML} = require('./src/extractScripts.js');
const {transformSourceCodeString} = require('./src/transform.js');
const {injectScriptsIntoHTML} = require('./src/injectScripts.js');

const FILE_FLAG = 'file';
const DIR_FLAG = 'dir';

const HTML = 'html';

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
    const extension = fileName.split('.').pop();
    // Only support .html tests, don't want to 'transform' something else.
    if (extension === HTML) {
      transformFile(dir + fileName);
    }
  });
}

function transformFile(filePath) {
  debug('Starting transformation on', filePath);

  try {
    const transformedScripts = [];
    let addSetup = true;
    let title = '';
    const originalScripts = extractScriptsFromHTML(filePath);
    originalScripts.forEach((script) => {
      // Handles the <script src="js-test.js"></script> tags
      if (script === '') {
        transformedScripts.push(script);
        return;
      }
      const transformation = transformSourceCodeString(script, addSetup);
      // Only add setup() once, to the first non-empty script.
      if (addSetup) {
        addSetup = false;
      }
      transformedScripts.push(transformation.code);
      // Use the first title description that appears in the old file.
      if (title === '') {
        title = transformation.title;
      }
    });

    if (originalScripts.length != transformedScripts.length) {
      debug.error('originalScripts length', originalScripts.length);
      debug.error('transformedScripts length', transformedScripts.length);
      throw Error('originalScripts and transformedScripts differ in length');
    }

    // If the title is still undefined after searching scripts for definitions,
    // use the filepath.
    if (title === '') {
      debug('Title empty after transformation, using', filepath);
      title = filePath;
    }

    injectScriptsIntoHTML(filePath, transformedScripts, title, outputPath);
    debug('Completed transformation, wrote', outputPath);
  } catch (err) {
    debug('Error while transforming', filePath);
    debug(err);
  }
}

main().catch((reason) => {
  debug.error(reason);
  process.exit(1);
});
