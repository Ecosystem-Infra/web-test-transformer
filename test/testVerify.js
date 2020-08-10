'use strict';
const assert = require('assert');

const {isBaselineAllPass} = require('../src/verify.js');

describe('#testIsBaselineAllPass()', function() {
  context('All PASS file', function() {
    it('should return true', function() {
      const actual = isBaselineAllPass('./test/testdata/input/file-list-test-expected.txt');
      assert.equal(actual, true);
    });
  });

  context('Contains line starting with FAIL', function() {
    it('should return false', function() {
      const actual = isBaselineAllPass('./test/testdata/input/jstest-test-expected.txt');
      assert.equal(actual, false);
    });
  });

  context('FAIL within line, not at beginning', function() {
    it('should return true', function() {
      const actual = isBaselineAllPass('./test/testdata/input/assign-expected.txt');
      assert.equal(actual, true);
    });
  });

  context('Contains line starting with WARN:', function() {
    it('should return false', function() {
      const actual = isBaselineAllPass('./test/testdata/input/css-namespace-rule-expected.txt');
      assert.equal(actual, false);
    });
  });
});
