'use strict';
const assert = require('assert');
const fs = require('fs');

const {transformSourceCodeString} = require('../src/transformScript.js');

describe('#testTransformSourceCode()', function() {
  context('Single Function Transformations', function() {
    it('should NOT transform non js-test.js functions', function() {
      const inputString = 'const x = myHelperMethod(param1);';
      const expected = 'const x = myHelperMethod(param1);';
      const actual = transformSourceCodeString(inputString, false, false).code;
      assert.equal(actual, expected);
    });

    it('should transform shouldBeTrue()', function() {
      const inputString = 'shouldBeTrue("foo()");';
      const expected = 'assert_true(foo());';
      const actual = transformSourceCodeString(inputString, false, false).code;
      assert.equal(actual, expected);
    });

    it('should transform shouldBeFalse()', function() {
      const inputString = 'shouldBeFalse("foo(param1, param2) && fakeBool");';
      const expected = 'assert_false(foo(param1, param2) && fakeBool);';
      const actual = transformSourceCodeString(inputString, false, false).code;
      assert.equal(actual, expected);
    });

    it('should transform shouldBeNull()', function() {
      const inputString = 'shouldBeNull("fakeArray[0].value");';
      const expected = 'assert_equals(fakeArray[0].value, null);';
      const actual = transformSourceCodeString(inputString, false, false).code;
      assert.equal(actual, expected);
    });

    it('should transform shouldBeNaN()', function() {
      const inputString = 'shouldBeNaN("zero / 0");';
      const expected = 'assert_equals(zero / 0, NaN);';
      const actual = transformSourceCodeString(inputString, false, false).code;
      assert.equal(actual, expected);
    });

    it('should transform shouldBeZero()', function() {
      const inputString = 'shouldBeZero("1 - 1");';
      const expected = 'assert_equals(1 - 1, 0);';
      const actual = transformSourceCodeString(inputString, false, false).code;
      assert.equal(actual, expected);
    });

    it('should transform shouldBeEmptyString()', function() {
      const inputString = 'shouldBeEmptyString("component.Name");';
      const expected = 'assert_equals(component.Name, "");';
      const actual = transformSourceCodeString(inputString, false, false).code;
      assert.equal(actual, expected);
    });

    it('should transform shouldBeUndefined()', function() {
      const inputString = 'shouldBeUndefined("typeof badVariable");';
      const expected = 'assert_equals(typeof badVariable, undefined);';
      const actual = transformSourceCodeString(inputString, false, false).code;
      assert.equal(actual, expected);
    });

    it('should transform shouldBeNonZero()', function() {
      const inputString = 'shouldBeNonZero("nested[1][index] % 3");';
      const expected = 'assert_not_equals(nested[1][index] % 3, 0);';
      const actual = transformSourceCodeString(inputString, false, false).code;
      assert.equal(actual, expected);
    });

    it('should transform shouldBeNonNull()', function() {
      const inputString = 'shouldBeNonNull("Library.call()");';
      const expected = 'assert_not_equals(Library.call(), null);';
      const actual = transformSourceCodeString(inputString, false, false).code;
      assert.equal(actual, expected);
    });

    it('should transform shouldBeDefined()', function() {
      const inputString = 'shouldBeDefined("obj.property.good.valid.defined");';
      const expected = 'assert_not_equals(obj.property.good.valid.defined, undefined);';
      const actual = transformSourceCodeString(inputString, false, false).code;
      assert.equal(actual, expected);
    });

    it('should transform shouldBe()', function() {
      const inputString = 'shouldBe("first_expression1()", "expectedResult.evaluate().name");';
      const expected = 'assert_equals(first_expression1(), expectedResult.evaluate().name);';
      const actual = transformSourceCodeString(inputString, false, false).code;
      assert.equal(actual, expected);
    });

    it('should transform shouldNotBe()', function() {
      const inputString = 'shouldNotBe("file instanceof \'number\'", "true === true");';
      const expected = 'assert_not_equals(file instanceof \'number\', true === true);';
      const actual = transformSourceCodeString(inputString, false, false).code;
      assert.equal(actual, expected);
    });

    it('should transform shouldBeGreaterThan()', function() {
      const inputString = 'shouldBeGreaterThan("testValue", "smallValue");';
      const expected = 'assert_greater_than(testValue, smallValue);';
      const actual = transformSourceCodeString(inputString, false, false).code;
      assert.equal(actual, expected);
    });

    it('should transform shouldBeGreaterThanOrEqualTo()', function() {
      const inputString = 'shouldBeGreaterThanOrEqualTo("test().function()()()", "smallerValue");';
      const expected = 'assert_greater_than_equal(test().function()()(), smallerValue);';
      const actual = transformSourceCodeString(inputString, false, false).code;
      assert.equal(actual, expected);
    });

    it('should transform shouldBeEqualToString()', function() {
      const inputString = 'shouldBeEqualToString("\'string\' + \'string\'", "stringstring");';
      const expected = 'assert_equals(\'string\' + \'string\', "stringstring");';
      const actual = transformSourceCodeString(inputString, false, false).code;
      assert.equal(actual, expected);
    });

    it('should transform shouldBeEqualToNumber()', function() {
      const inputString = 'shouldBeEqualToNumber("pixel.location - 1", 25);';
      const expected = 'assert_equals(pixel.location - 1, 25);';
      const actual = transformSourceCodeString(inputString, false, false).code;
      assert.equal(actual, expected);
      assert.equal(actual, expected);
    });

    it('should transform debug()', function() {
      const inputString = 'debug("debug string");';
      const expected = 'console.log("debug string");';
      const actual = transformSourceCodeString(inputString, false, false).code;
      assert.equal(actual, expected);
    });
  });

  context('File-Level Transformations', function() {
    it('should transform short file, adding setup()', function() {
      const inputFile = './test/testdata/input/short_file.js';
      const sourceCode = fs.readFileSync(inputFile, 'utf-8');
      const expectedCode = fs.readFileSync('./test/testdata/reference/transformed_short_file.js', 'utf-8');
      const expectedTitle = 'Makes sure typeof works';
      const actual = transformSourceCodeString(sourceCode);
      assert.equal(actual.code, expectedCode);
      assert.equal(actual.title, expectedTitle);
    });

    it('should transform multi-line file with varying parameter expressions', function() {
      const inputFile = './test/testdata/input/multiline_file.js';
      const sourceCode = fs.readFileSync(inputFile, 'utf-8');
      const expectedCode = fs.readFileSync('./test/testdata/reference/transformed_multiline_file.js', 'utf-8');
      const expectedTitle = 'Tests value and testObject';
      const actual = transformSourceCodeString(sourceCode);
      assert.equal(actual.code, expectedCode);
      assert.equal(actual.title, expectedTitle);
    });
  });
});
