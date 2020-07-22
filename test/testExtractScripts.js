'use strict';
const assert = require('assert');
const fs = require('fs');

const {extractScriptsFromHTML} = require('../src/extractScripts.js');

function referenceScripts(fileName, numberOfScriptTags) {
  const referenceBase = './test/testdata/reference/ref_';
  const referenceScripts = [];
  for (let i = 0; i < numberOfScriptTags; i++) {
    const referenceFileName = referenceBase + 'script' + i + '_' + fileName + '.js';
    referenceScripts.push(fs.readFileSync(referenceFileName, 'utf-8'));
  }
  return referenceScripts;
}

describe('#extractScriptsFromHTML()', function() {
  context('2 sets of <script> tags- file-list-test.html', function() {
    const testPath = './test/testdata/input/file-list-test.html';
    const testFileName = 'file-list-test';
    const testScriptCount = 2;

    it('should return array with the correct javascript inside', function() {
      const actualScripts = extractScriptsFromHTML(testPath);
      const expectedScripts = referenceScripts(testFileName, testScriptCount);

      assert.equal(actualScripts.length, expectedScripts.length);

      for (let i = 0; i < actualScripts.length; i++) {
        const actual = actualScripts[i];
        const expected = expectedScripts[i];
        assert.equal(actual, expected);
      }
    });
  });
});
