let assert = require("assert");
let extractScriptsFromHTML = require("../extractScripts.js");

// IMPORTANT: if file naming convention changes in file, change this function. 
function expectedFiles(fileName, numberOfScriptTags) {
    const base = "./tempJsScripts/script";
    let files = [];
    for (let i = 0; i < numberOfScriptTags; i++) {
        files.push(base + i + "_" + fileName + ".js");
    }
    return files;
}

describe("#extractScriptsFromHTML()", function() {

    context("2 sets of <script> tags- file-list-test.html", function() {
        it('should return correct list of files files', function() {
            let actual = extractScriptsFromHTML("./example_legacy_tests/file-list-test.html");
            let expected = expectedFiles("file-list-test", 2);
            assert.deepEqual(actual, expected);
        });
    });
});