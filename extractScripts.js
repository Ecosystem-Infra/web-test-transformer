"use strict";
const fs          = require("fs");
const htmlparser2 = require("htmlparser2");
const tmp         = require("tmp");

const SCRIPT = "script";
// IMPORTANT: if file naming convention changes, update corresponding strings in testExtractScripts.js
const TEMP_DIR = "tempJsScripts";

// extractScriptsFromHTML takes a string filePath: a path to the HTML test
// file that you want to extract the javascript from within <script> tags.
// It creates a directory "tempJsScripts" in the same directory as this file,
// then puts the .js scripts extracted in the new dir, named/numbered script{0}_{test filename}.js 
function extractScriptsFromHTML(filePath, tempDir=null) {
    let scriptCount = 0;
    let inScript = false;
    let currentFile = '';
    let files = [];
    // Creates a temporary directory to hold all of the JS scripts in this HTML test file. 
    if (!tempDir) {
        tempDir = tmp.dirSync({prefix: TEMP_DIR, tmpdir: "."})
    }

    const parser = new htmlparser2.Parser(
        {
            onopentag(tagname, attribs) {
                if (tagname === SCRIPT) {
                    inScript = true;
                    let newFileName = "/script" + scriptCount + "_" + fileNameFromPath(filePath) + ".js";
                    currentFile = tempDir.name + newFileName; 
                    files.push(currentFile);
                    // Creates a file, overwriting any existing file, with empty contents.
                    fs.writeFile(currentFile, '', function (err) {
                        if (err) { throw err; }
                    });
                }
            },

            ontext(text) {
                if (inScript) {
                    fs.appendFile(currentFile, text, function (err) {
                        if (err) { throw err; }
                    });
                }
            },

            onclosetag(tagname) {
                if (tagname === SCRIPT) {
                    inScript = false;
                    scriptCount++;
                }
            }
        }
    );

    let data = fs.readFileSync(filePath, "utf8");
    parser.write(data);
    parser.end();
    return files;
}

// Given a string path to a file,
// returns the name of the file without the file extension.
function fileNameFromPath(filePath) {
    let directorySplit = filePath.split("/")
    let fileNameWithExtension = directorySplit[directorySplit.length - 1]
    // Return the name without the extension
    return fileNameWithExtension.split(".")[0] 
}

//let filePath = "./example_legacy_tests/file-list-test.html";
//let filesWritten = extractScriptsFromHTML(filePath);
//console.log("Wrote ", filesWritten);

module.exports = extractScriptsFromHTML;