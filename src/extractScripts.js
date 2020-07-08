'use strict';
const fs = require('fs');
const htmlparser2 = require('htmlparser2');
const tmp = require('tmp');

const SCRIPT = 'script';
// IMPORTANT: if file naming convention changes,
// update corresponding strings in testExtractScripts.js
const TEMP_DIR = 'tempJsScripts';

/**
 * extractScriptsFromHTML extracts the javascript from within <script>
 * tags in the HTML test provided and writes each script to a .js file.
 * It creates a directory "tempJsScripts-{tmp numbers}" in the current
 * working directory, then puts the .js scripts extracted in the new dir,
 * named script{number}_{test filename}.js
 * @param {string} filePath - path to the HTML test file to extract
 * javascript from within <script> tags.
 * @param {tmp object} [tempDir=null] - OPTIONAL directory to put
 * new .js files in. If null, will create one in the cwd with prefix TEMP_DIR.
 * @returns {[string]} - the full path of the files that were written.
 */
function extractScriptsFromHTML(filePath, tempDir=null) {
  let scriptCount = 0;
  let inScript = false;
  let currentFile = '';
  const files = [];
  // Creates a temporary directory to hold all of
  // the JS scripts in this HTML test file.
  if (!tempDir) {
    tempDir = tmp.dirSync({prefix: TEMP_DIR, tmpdir: '.'});
  }

  const parser = new htmlparser2.Parser(
      {
        onopentag(tagname, attribs) {
          if (tagname === SCRIPT) {
            inScript = true;
            const newFileName = '/script' +
                scriptCount + '_' + fileNameFromPath(filePath) + '.js';
            currentFile = tempDir.name + newFileName;
            files.push(currentFile);
            // Creates file, overwriting an existing file, with empty contents.
            fs.writeFileSync(currentFile, '');
          }
        },

        ontext(text) {
          if (inScript) {
            fs.appendFileSync(currentFile, text);
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
  return files;
}

/**
 * Given a string path to a file,
 * returns the name of the file without the file extension.
 * @param {string} filePath
 * @returns {string}
 */
function fileNameFromPath(filePath) {
  const directorySplit = filePath.split('/');
  const fileNameWithExtension = directorySplit[directorySplit.length - 1];
  // Return the name without the extension
  return fileNameWithExtension.split('.')[0];
}

module.exports = extractScriptsFromHTML;
