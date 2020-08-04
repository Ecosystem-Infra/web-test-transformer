'use strict';
const debug = require('debug');
const flags = require('flags');
const fs = require('fs');

// The order of operation is to extract each js script from HTML, transform it,
// then inject it back into HTML.
const {extractScriptsFromHTML} = require('./src/extractScripts.js');
const {transformSourceCodeString} = require('./src/transform.js');
const {injectScriptsIntoHTML} = require('./src/injectScripts.js');

const FILE_FLAG = 'file';
const DIR_FLAG = 'dir';
const QUIET_FLAG = 'quiet';

const HTML = 'html';

// This regex isn't perfect, but it is a really close filter to make sure we
// are only transforming tests that have js-test.js src'ed within script tests,
// without making it too specific to miss matches.
const SRC_JS_TEST_REGEX = new RegExp('<script src=.*/resources/js-test\\.js.></script>');

// Specify exactly one of --file or --dir.
flags.defineString(FILE_FLAG, null, 'Path to test file to transform');
flags.defineString(DIR_FLAG, null, 'Path to dir of test files to transform');
flags.defineBoolean(QUIET_FLAG, false, 'Disable logging');
// TODO: flag for output path
flags.parse();

const log = debug('index.js');
const error = debug('index.js:ERROR');
// For some reason 1 is RED
error.color = 1;

// babel npm package has very verbose debug usage
debug.enable('* -babel');
if (flags.get(QUIET_FLAG)) {
  // disables all namespaces
  debug.disable();
}

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
  try {
    // Only support .html tests, don't want to 'transform' something else.
    // This checks the file extension.
    if (filePath.split('.').pop() !== HTML) {
      error('Not a .html test, skipping transformation on', filePath);
      return;
    }

    const htmlSource = fs.readFileSync(filePath);
    // Only transform tests that src js-test.js in scripts.
    if (!SRC_JS_TEST_REGEX.test(htmlSource)) {
      error('Test does not src js-test.js, skipping transformation on', filePath);
      return;
    }

    log('Starting transformation on', filePath);
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
      error('originalScripts length', originalScripts.length);
      error('transformedScripts length', transformedScripts.length);
      throw Error('originalScripts and transformedScripts differ in length');
    }

    // If the title is still undefined after searching scripts for definitions,
    // use the filepath.
    if (title === '') {
      log('Title empty after transformation, using', filepath);
      title = filePath;
    }
    const outputPath = './t_play.html';
    injectScriptsIntoHTML(filePath, transformedScripts, title, outputPath);
    log('Completed transformation, wrote', outputPath);
  } catch (err) {
    error('Error while transforming', filePath);
    error(err);
  }
}

main().catch((reason) => {
  error(reason);
  process.exit(1);
});
