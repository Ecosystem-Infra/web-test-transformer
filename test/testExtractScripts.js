let assert = require("assert");
let fs     = require("fs");
let tmp    = require("tmp");

let extractScriptsFromHTML = require("../extractScripts.js");

// IMPORTANT: if file naming convention changes in file, change this function. 
function expectedResults(fileName, dirName, numberOfScriptTags) {
    const referenceBase = "./test/referenceFiles/ref_";
    let files = [];
    let referenceFiles = [];
    for (let i = 0; i < numberOfScriptTags; i++) {
        let newFileName = "script" + i + "_" + fileName + ".js";
        files.push(dirName + "/" + newFileName);
        referenceFiles.push(referenceBase + newFileName);
    }
    return {fileList: files, references: referenceFiles}
}

describe("#extractScriptsFromHTML()", function() {
    let tempDir = null;
    before(function() {
        tempDir = tmp.dirSync({prefix: "testTemp", unsafeCleanup: true, tmpdir: "."});
    });

    after(function() {
        tempDir.removeCallback();
    });

    context("2 sets of <script> tags- file-list-test.html", function() {
        const testPath = "./example_legacy_tests/file-list-test.html";
        const testFileName = "file-list-test";
        const testScriptCount = 2;

        it("should return correct list of files", function() {
            let actualFileList = extractScriptsFromHTML(testPath, tempDir);
            let expected = expectedResults(testFileName, tempDir.name, testScriptCount);
            assert.deepEqual(actualFileList, expected.fileList);
        });

        it("should write files with the correct javascript inside", function () {
            let actualFileList = extractScriptsFromHTML(testPath, tempDir);
            let expected = expectedResults(testFileName, tempDir.name, testScriptCount);
            for (let i = 0; i < actualFileList.length; i++) {
                let actualContents = fs.readFileSync(actualFileList[i], "utf-8");
                let expectedContents = fs.readFileSync(expected.references[i], "utf-8");
                assert.equal(actualContents, expectedContents);
            }
        });
    });
});