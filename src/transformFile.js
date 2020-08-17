'use strict';

const debug = require('debug');
const fs = require('fs');

// The order of operation is to extract each js script from HTML, transform it,
// then inject it back into HTML.
const {extractScriptsFromHTML} = require('./extractScripts.js');
const {transformSourceCodeString} = require('./transformScript.js');
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

// This is meant to be an enum for the possible values for the
// result of the transformation, used in other files
// to act according to result.
const transformResult = {
  SUCCESS: 'success',
  FAIL: 'fail',
  SKIP: 'skip',
};

/**
 * transformFile performs the full end-to-end transformation of a
 * legacy js-test.js HTML test file to use the testharness.js framework.
 * It extracts scripts, transforms them, then puts them back into the HTML,
 * while handling context surrounding the test title and setup() calls.
 *
 * @param {string} filePath - full path to HTML test file to transform
 * @param {string} outputDir - full path to an existing directory where
 *  transformed files should be written. If null, overwrites the original
 *  file. Files in outputDir will have the same name as the original file.
 *
 * @returns {string (enum from transformResult)} - SUCCESS, SKIP, or FAIL
 */
function transformFile(filePath, outputDir=null) {
  try {
    // Only support .html tests, don't want to 'transform' something else.
    // This checks the file extension.
    if (filePath.split('.').pop() !== HTML) {
      error('Not a .html test, skipping transformation on', filePath);
      return transformResult.SKIP;
    }

    let outputPath;
    if (outputDir) {
      const fileName = filePath.split('/').pop();
      outputPath = outputDir + '/' + fileName;
    } else {
      outputPath = filePath;
    }

    const htmlSource = fs.readFileSync(filePath);
    // Only transform tests that src js-test.js in scripts.
    if (!SRC_JS_TEST_REGEX.test(htmlSource)) {
      error('Test does not src js-test.js, skipping', filePath);
      return transformResult.SKIP;
    }

    log('Starting transformation on', filePath);
    const transformedScripts = [];
    let addSetup = true;
    let title = '';
    const originalScripts = extractScriptsFromHTML(filePath);
    for (let i=0; i < originalScripts.length; i++) {
      const script = originalScripts[i];
      // Handles the <script src="js-test.js"></script> tags
      if (script === '') {
        transformedScripts.push(script);
        continue;
      }
      // Only add done() call to the last script.
      const addDone = i === originalScripts.length - 1;
      const transformation =
        transformSourceCodeString(script, addSetup, addDone);
      // Only add setup() once, to the first non-empty script.
      if (addSetup) {
        addSetup = false;
      }
      transformedScripts.push(transformation.code);
      // Use the first title description that appears in the old file.
      if (title === '') {
        title = transformation.title;
      }
    }

    // This is a defensive check to ensure the transformation didn't lose
    // or gain any scripts.
    if (originalScripts.length != transformedScripts.length) {
      error('originalScripts length', originalScripts.length);
      error('transformedScripts length', transformedScripts.length);
      throw Error('originalScripts and transformedScripts differ in length');
    }

    // If the title is still undefined after searching scripts for definitions,
    // use the filepath.
    if (title === '') {
      log('Title empty after transformation, using', filePath);
      title = filePath;
    }
    injectScriptsIntoHTML(filePath, transformedScripts, title, outputPath);

    log('Completed transformation, wrote', outputPath);
    return transformResult.SUCCESS;
  } catch (err) {
    error('Error while transforming', filePath);
    error(err);
    return transformResult.FAIL;
  }
}


module.exports = {transformFile, transformResult};
