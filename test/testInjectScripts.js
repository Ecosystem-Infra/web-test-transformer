'use strict';
const assert = require('assert');
const fs = require('fs');
const tmp = require('tmp');
tmp.setGracefulCleanup();

const {injectScriptsIntoHTML} = require('../src/injectScripts.js');


describe('#injectScriptsIntoHTML', function() {
  context('Inject 2 Scripts', function() {
    const tmpFile = tmp.fileSync();
    const testFile = './test/testdata/input/file-list-test.html';
    const scripts = [];
    scripts.push(fs.readFileSync('./test/testdata/reference/transformed_script0_file-list-test.js', 'utf-8'));
    scripts.push(fs.readFileSync('./test/testdata/reference/transformed_script1_file-list-test.js', 'utf-8'));

    const actualHTML = injectScriptsIntoHTML(testFile, scripts, tmpFile.name);
    const expectedHTML = fs.readFileSync('./test/testdata/reference/transformed_file-list-test.html', 'utf-8');

    it('should return the correct HTML', function() {
      assert.equal(actualHTML, expectedHTML);
    });

    it('should write a file with the html', function() {
      const actualFileContents = fs.readFileSync(tmpFile.name, 'utf-8');
      assert.equal(actualFileContents, expectedHTML);
    });
  });
});
