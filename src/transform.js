'use strict';
const b =  require('@babel/core'); 
const fs = require('fs');

// addSetupNode adds the setup() call to the beginning of the script.
function addSetupNode() {
  const setupNode = b.template.statement(`
    setup({single_test: true, explicit_done: false});
  `)();
  return {
    visitor: {
      Program(path) {
        path.node.body.unshift(setupNode);
      }
    }
  }
}

const transformBoolMap = {
  "shouldBeTrue": "assert_true",
  "shouldBeFalse": "assert_false",

}

function transformShouldBeBool() {
  return {
    visitor: {
      CallExpression(path) {
        if (transformBoolMap.hasOwnProperty(path.node.callee.name)) {
          path.node.callee.name = transformBoolMap[path.node.callee.name];
          const newArgument = b.template.expression(path.node.arguments[0].value)();
          path.node.arguments[0] = newArgument;
        }
      },
    },
  };
}

const transformValueMap = {
  "shouldBeNaN": { name: "assert_equals", value: b.types.identifier("NaN") },

  "shouldBeNull": { name: "assert_equals", value: b.types.nullLiteral() },
  "shouldBeNonNull": { name: "assert_not_equals", value: b.types.nullLiteral() },


  "shouldBeUndefined": { name: "assert_equals", value: b.types.identifier("undefined") },
  "shouldBeDefined": { name: "assert_not_equals", value: b.types.identifier("undefined") },

  "shouldBeZero": { name: "assert_equals", value: b.types.numericLiteral(0) }, 
  "shouldBeNonZero": { name: "assert_not_equals", value: b.types.numericLiteral(0) }, 

  "shouldBeEmptyString": { name: "assert_equals", value: b.types.stringLiteral("") },
}

function transformShouldBeValue() {
  return {
    visitor: {
      CallExpression(path) {
        if (transformValueMap.hasOwnProperty(path.node.callee.name)) {
          const newArgument1 = transformValueMap[path.node.callee.name].value;

          path.node.callee.name = transformValueMap[path.node.callee.name].name;

          const newArgument0 = b.template.expression(path.node.arguments[0].value)();
          path.node.arguments = [newArgument0, newArgument1];
        }
      },
    },
  };
}

const transformComparatorMap = {
  "shouldBe": "assert_equals",
  "shouldNotBe": "assert_not_equals",
  "shouldBeGreaterThan": "assert_greater_than",
  "shouldBeGreaterThanOrEqualTo": "assert_greater_than_equal",
}

function transformShouldBeComparator() {
  return {
    visitor: {
      CallExpression(path) {
        if (transformComparatorMap.hasOwnProperty(path.node.callee.name)) {
          path.node.callee.name = transformComparatorMap[path.node.callee.name];
          const newArgument0 = b.template.expression(path.node.arguments[0].value)();
          const newArgument1 = b.template.expression(path.node.arguments[1].value)();
          path.node.arguments = [newArgument0, newArgument1];
        }
      },
    },
  };
}


const transformEqualToMap = {
  "shouldBeEqualToString": "assert_equals",
  "shouldBeEqualToNumber": "assert_equals",
}

function transformShouldBeEqualToSpecific() {
  return {
    visitor: {
      CallExpression(path) {
        if (transformEqualToMap.hasOwnProperty(path.node.callee.name)) {
          path.node.callee.name = transformEqualToMap[path.node.callee.name];
          const newArgument0 = b.template.expression(path.node.arguments[0].value)();
          path.node.arguments[0] = newArgument0;
        }
      },
    },
  };
}

function transformSourceCodeString(sourceCode, addSetup=true) {
  const pluginArray = [
      transformShouldBeBool,
      transformShouldBeValue,
      transformShouldBeComparator,
      transformShouldBeEqualToSpecific,
  ];

  if (addSetup) {
    pluginArray.unshift(addSetupNode);
  }

  const output = b.transformSync(sourceCode, {
    plugins: pluginArray,
  });
  return output.code;
}

function transformFile(filePath) {
  const sourceCode = fs.readFileSync(filePath);
  return transformSourceCodeString(sourceCode);
}

module.exports = { transformSourceCodeString, transformFile };