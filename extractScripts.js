const fs          = require("fs");
const htmlparser2 = require("htmlparser2");

// extractScriptsFromHTML takes a string filePath: a path to the HTML test
// file that you want to extract the javascript from within <script> tags.
// It creates a directory "tempJsScripts" in the same directory as this file,
// then puts the .js scripts extracted in the new dir, named/numbered script{0}_{test filename}.js 
function extractScriptsFromHTML(filePath) {
    let scriptCount = 0;
    let inScript = false;
    let currentFile = '';
    // Creates a directory to hold all of the JS scripts in this HTML test file, 
    // {recursive: true} will ensure an error is not thrown if the directory exists.
    fs.mkdir("./tempJsScripts", {recursive: true}, function (err) {
        if (err) { throw err; }
    });
    const parser = new htmlparser2.Parser(
        {
            onopentag(name, attribs) {
                if (name === "script") {
                    inScript = true;
                    currentFile = "./tempJsScripts/script" + scriptCount + "_" + fileNameFromPath(filePath) + ".js";
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
                if (tagname === "script") {
                    inScript = false;
                    scriptCount++;
                    console.log("encountered script end.");
                }
            }
        }
    );

    fs.readFile(filePath, "utf8", function (err, data) {
        if (err) {
            return console.log(err);
        }
        parser.write(data);
        parser.end();
        
    });
}

// Given a string path to a file,
// returns the name of the file without the file extension.
function fileNameFromPath(filePath) {
    directorySplit = filePath.split("/")
    fileNameWithExtension = directorySplit[directorySplit.length - 1]
    // Return the name without the extension
    return fileNameWithExtension.split(".")[0] 
}

filePath = "./example_legacy_tests/file-list-test.html";
extractScriptsFromHTML(filePath);
