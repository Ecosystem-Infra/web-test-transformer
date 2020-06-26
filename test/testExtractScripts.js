let assert = require("assert");
let fs     = require("fs");
let tmp    = require("tmp");
let extractScriptsFromHTML = require("../extractScripts.js");
const { Parser } = require("htmlparser2");

// IMPORTANT: if file naming convention changes in file, change this function. 
function expectedFiles(fileName, dirName, numberOfScriptTags) {
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
        console.log("running before")
        tempDir = tmp.dirSync({name: "testing1", prefix: "testTemp", unsafeCleanup: false, tmpdir: "."});
        console.log(tempDir.name)
    });

    after(function() {
        console.log("running after")
        //tempDir.removeCallback();
    });

    context("2 sets of <script> tags- file-list-test.html", function() {
        const testPath = "./example_legacy_tests/file-list-test.html";

        //it("should return correct list of files", function() {
            //let actualFileList = extractScriptsFromHTML(testPath, tempDir);
            //let expected = expectedFiles("file-list-test", "./testing1", 2);
            //assert.deepEqual(actualFileList, expected.fileList);
        //});

        it("should write files with the correct javascript inside", function () {
            let actualFileList = extractScriptsFromHTML(testPath, tempDir);
            let expected = expectedFiles("file-list-test", "./testing1", 2);
            for (let i = 0; i < actualFileList.length; i++) {
                console.log("reading from : ", actualFileList[i])
                let actualContents = fs.readFileSync(actualFileList[i], "utf-8");
                console.log("actual: " + actualContents)
                let expectedContents = fs.readFileSync(expected.references[i], "utf-8");
                assert.equal(actualContents, expectedContents);
            }
        });
    });
});