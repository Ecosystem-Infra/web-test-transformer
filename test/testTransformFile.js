'use strict';
const assert = require('assert');
const fs = require('fs');
const tmp = require('tmp');
tmp.setGracefulCleanup();

const {transformFile} = require('../src/transformFile.js');

describe('#transformFile', function() {
  let tmpDir;
  before(function() {
    tmpDir = tmp.dirSync({tmpdir: '.', unsafeCleanup: true});
  });

  after(function() {
    tmpDir.removeCallback();
  });
  context('transform HTML test end-to-end', function() {
    it('should transform file-list-test.html and write output file', function() {
      const inputFile = './test/testdata/input/file-list-test.html';
      const referenceFile = './test/testdata/reference/transformed_file-list-test.html';
      transformFile(inputFile, tmpDir.name);
      const actual = fs.readFileSync(tmpDir.name + '/file-list-test.html', 'utf-8');
      const expected = fs.readFileSync(referenceFile, 'utf-8');
      assert.equal(actual, expected);
    });

    it('should transform canvas-description-and-role.html and write output file', function() {
      const inputFile = './test/testdata/input/canvas-description-and-role.html';
      const referenceFile = './test/testdata/reference/transformed_canvas-description-and-role.html';
      transformFile(inputFile, tmpDir.name);
      const actual = fs.readFileSync(tmpDir.name + '/canvas-description-and-role.html', 'utf-8');
      const expected = fs.readFileSync(referenceFile, 'utf-8');
      assert.equal(actual, expected);
    });
  });
});
