'use strict';

const debug = require('debug');
const fs = require('fs');

// The order of operation is to extract each js script from HTML, transform it,
// then inject it back into HTML.
const {extractScriptsFromHTML} = require('./extractScripts.js');
const {transformSourceCodeString} = require('./transformJS.js');
const {injectScriptsIntoHTML} = require('./injectScripts.js');

const HTML = 'html';

// This regex isn't perfect, but it is a really close filter to make sure we
// are only transforming tests that have js-test.js src'ed within script tests,
// without making it too specific to miss matches.
// injectScripts.js verifies that the src change is actually made and throws
// if not, so this is just to fail faster.
// eslint-disable-next-line max-len
const SRC_JS_TEST_REGEX = new RegExp('<script src=.*/resources/js-test\\.js.></script>');

const log = debug('transformFile');
const error = debug('transformFile:ERROR');
// For some reason 1 is RED
error.color = 1;

// TODO: function documentation
function transformFile(filePath, outputDir) {
  try {
    // Only support .html tests, don't want to 'transform' something else.
    // This checks the file extension.
    if (filePath.split('.').pop() !== HTML) {
      error('Not a .html test, skipping transformation on', filePath);
      return;
    }

    let outputPath;
    if (outputDir) {
      const fileName = filePath.split('/').pop();
      // TODO: might need to add a '/'.
      outputPath = outputDir + '/' + fileName;
    } else {
      outputPath = filePath;
    }

    const htmlSource = fs.readFileSync(filePath);
    // Only transform tests that src js-test.js in scripts.
    if (!SRC_JS_TEST_REGEX.test(htmlSource)) {
      error('Test does not src js-test.js, skipping', filePath);
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
    injectScriptsIntoHTML(filePath, transformedScripts, title, outputPath);

    log('Completed transformation, wrote', outputPath);
  } catch (err) {
    error('Error while transforming', filePath);
    throw Error(err);
  }
}


module.exports = {transformFile};
