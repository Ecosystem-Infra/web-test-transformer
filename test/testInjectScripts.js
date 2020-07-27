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
    const testDescription = 'This test tests some stuff in the browser';
    const scripts = [];
    scripts.push(fs.readFileSync('./test/testdata/reference/transformed_script0_file-list-test.js', 'utf-8'));
    scripts.push(fs.readFileSync('./test/testdata/reference/transformed_script1_file-list-test.js', 'utf-8'));

    const actualHTML = injectScriptsIntoHTML(testFile, scripts, testDescription, tmpFile.name);
    const expectedHTML = fs.readFileSync('./test/testdata/reference/transformed_file-list-test.html', 'utf-8');

    it('should return the correct HTML', function() {
      assert.equal(actualHTML, expectedHTML);
    });

    it('should write a file with the html', function() {
      const actualFileContents = fs.readFileSync(tmpFile.name, 'utf-8');
      assert.equal(actualFileContents, expectedHTML);
    });
  });


  context('Insert <title> tags in the correct place', function() {
    it('should insert <title> after <head>', function() {
      const tmpFile = tmp.fileSync();
      const testFile = './test/testdata/input/indented-head-tag.html';
      const testDescription = 'Testing to see if title indented in transformed HTML';
      const scripts = ['', ''];
      const actualHTML = injectScriptsIntoHTML(testFile, scripts, testDescription, tmpFile.name);
      const expectedHTML = fs.readFileSync('./test/testdata/reference/transformed_indented-head-tag.html', 'utf-8');
      assert.equal(actualHTML, expectedHTML);
    });

    it('should insert <title> after <html>', function() {
      const tmpFile = tmp.fileSync();
      const testFile = './test/testdata/input/canvas-description-and-role.html';
      const testDescription = 'This test makes sure that a canvas with and without fallback content each has the right role and description.';
      const scripts = [''];
      scripts.push(fs.readFileSync('./test/testdata/reference/transformed_script1_canvas-description-and-role.js', 'utf-8'));
      const actualHTML = injectScriptsIntoHTML(testFile, scripts, testDescription, tmpFile.name);
      const expectedHTML = fs.readFileSync('./test/testdata/reference/transformed_canvas-description-and-role.html', 'utf-8');
      assert.equal(actualHTML, expectedHTML);
    });

    it('should insert <title> after <!DOCTYPE html>', function() {
      const tmpFile = tmp.fileSync();
      const testFile = './test/testdata/input/doctype-title.html';
      const testDescription = 'Testing to see if title under DOCTYPE in transformed HTML';
      const scripts = ['', ''];
      const actualHTML = injectScriptsIntoHTML(testFile, scripts, testDescription, tmpFile.name);
      const expectedHTML = fs.readFileSync('./test/testdata/reference/transformed_doctype-title.html');
      assert.equal(actualHTML, expectedHTML);
    });

    it('should insert <title> at beginning of document', function() {
      const tmpFile = tmp.fileSync();
      const testFile = './test/testdata/input/module-script.html';
      const testDescription = 'Test basic module execution.';
      const scripts = ['', '', '', ''];
      const actualHTML = injectScriptsIntoHTML(testFile, scripts, testDescription, tmpFile.name);
      const expectedHTML = fs.readFileSync('./test/testdata/reference/transformed_module-script.html', 'utf-8');
      assert.equal(actualHTML, expectedHTML);
    });

    it('should NOT insert <title> if already present', function() {
      const tmpFile = tmp.fileSync();
      const testFile = './test/testdata/input/file-writer-truncate-extend.html';
      const testDescription = 'description that should NOT be present';
      const scripts = ['', '', ''];
      const actualHTML = injectScriptsIntoHTML(testFile, scripts, testDescription, tmpFile.name);
      const expectedHTML = fs.readFileSync('./test/testdata/reference/transformed_file-writer-truncate-extend.html', 'utf-8');
      assert.equal(actualHTML, expectedHTML);
    });
  });
});
