'use strict';
const fs = require('fs');
const htmlparser2 = require('htmlparser2');

const SCRIPT = 'script';

/**
 * extractScriptsFromHTML extracts the javascript from within <script>
 * tags in the HTML test provided and writes each script to a .js file.
 * It creates a directory "tempJsScripts-{tmp numbers}" in the current
 * working directory, then puts the .js scripts extracted in the new dir,
 * named script{number}_{test filename}.js
 * @param {string} filePath - path to the HTML test file to extract
 * javascript from within <script> tags.
 * @returns {[string]} - the full path of the files that were written.
 */
function extractScriptsFromHTML(filePath, tempDir=null) {
  let inScript = false;
  let scriptCount = 0;
  const outputScripts = [];

  const parser = new htmlparser2.Parser(
      {
        onopentag(tagname, attribs) {
          if (tagname === SCRIPT) {
            inScript = true;
            // This accounts for script tags that have no text, but we want
            // an accurate count.
            // Ex: <script src='../resources/js-test.js'></script>
            outputScripts.push('');
          }
        },

        ontext(text) {
          if (inScript) {
            outputScripts[scriptCount] += text;
          }
        },

        onclosetag(tagname) {
          if (tagname === SCRIPT) {
            inScript = false;
            scriptCount++;
          }
        },
      },
  );

  const data = fs.readFileSync(filePath, 'utf8');
  parser.write(data);
  parser.end();
  return outputScripts;
}

module.exports = {extractScriptsFromHTML};
