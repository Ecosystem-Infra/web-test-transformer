const assert = require('assert');
const fs = require('fs');
const tmp = require('tmp');

const extractScriptsFromHTML = require('../src/extractScripts.js');

// IMPORTANT: if file naming convention changes in file, change this function.
function expectedResults(fileName, dirName, numberOfScriptTags) {
  const referenceBase = './test/referenceFiles/ref_';
  const files = [];
  const referenceFiles = [];
  for (let i = 0; i < numberOfScriptTags; i++) {
    const newFileName = 'script' + i + '_' + fileName + '.js';
    files.push(dirName + '/' + newFileName);
    referenceFiles.push(referenceBase + newFileName);
  }
  return {fileList: files, references: referenceFiles};
}

describe('#extractScriptsFromHTML()', function() {
  let tempDir = null;
  before(function() {
    tempDir = tmp.dirSync({prefix: 'testTmp', unsafeCleanup: true, tmpdir: '.'});
  });

  after(function() {
    tempDir.removeCallback();
  });

  context('2 sets of <script> tags- file-list-test.html', function() {
    const testPath = './example_legacy_tests/file-list-test.html';
    const testFileName = 'file-list-test';
    const testScriptCount = 2;

    it('should return correct list of files', function() {
      const actualFileList = extractScriptsFromHTML(testPath, tempDir);
      const expected = expectedResults(testFileName, tempDir.name, testScriptCount);
      assert.deepEqual(actualFileList, expected.fileList);
    });

    it('should write files with the correct javascript inside', function() {
      const actualFileList = extractScriptsFromHTML(testPath, tempDir);
      const expected = expectedResults(testFileName, tempDir.name, testScriptCount);
      for (let i = 0; i < actualFileList.length; i++) {
        const actualContents = fs.readFileSync(actualFileList[i], 'utf-8');
        const expectedContents = fs.readFileSync(expected.references[i], 'utf-8');
        assert.equal(actualContents, expectedContents);
      }
    });
  });
});
