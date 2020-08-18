'use strict';
const babel = require('@babel/core');
const babelParser = require('@babel/parser');

// addSetupNode adds the setup() call to the beginning of the script.
function addSetupNode() {
  const setupNode = babel.template.statement.ast(`
    setup({
      single_test: true,
    });
  `);
  return {
    visitor: {
      Program(path) {
        path.node.body.unshift(setupNode);
      },
    },
  };
}

const transformBoolMap = {
  'shouldBeTrue': 'assert_true',
  'shouldBeFalse': 'assert_false',

};

function transformShouldBeBool() {
  return {
    visitor: {
      CallExpression(path) {
        if (transformBoolMap.hasOwnProperty(path.node.callee.name)) {
          path.node.callee.name = transformBoolMap[path.node.callee.name];

          const newActual =
              babelParser.parseExpression(path.node.arguments[0].value);
          path.node.arguments[0] = newActual;
        }
      },
    },
  };
}

const transformValueMap = {
  'shouldBeNaN': {
    name: 'assert_equals',
    value: babel.types.identifier('NaN'),
  },

  'shouldBeNull': {
    name: 'assert_equals',
    value: babel.types.nullLiteral(),
  },
  'shouldBeNonNull': {
    name: 'assert_not_equals',
    value: babel.types.nullLiteral(),
  },

  'shouldBeUndefined': {
    name: 'assert_equals',
    value: babel.types.identifier('undefined'),
  },
  'shouldBeDefined': {
    name: 'assert_not_equals',
    value: babel.types.identifier('undefined'),
  },

  'shouldBeZero': {
    name: 'assert_equals',
    value: babel.types.numericLiteral(0),
  },
  'shouldBeNonZero': {
    name: 'assert_not_equals',
    value: babel.types.numericLiteral(0),
  },

  'shouldBeEmptyString': {
    name: 'assert_equals',
    value: babel.types.stringLiteral(''),
  },
};

function transformShouldBeValue() {
  return {
    visitor: {
      CallExpression(path) {
        if (transformValueMap.hasOwnProperty(path.node.callee.name)) {
          const newActual =
              babelParser.parseExpression(path.node.arguments[0].value);
          const newExpected = transformValueMap[path.node.callee.name].value;
          path.node.arguments = [newActual, newExpected];

          path.node.callee.name = transformValueMap[path.node.callee.name].name;
        }
      },
    },
  };
}

const transformComparatorMap = {
  'shouldBe': 'assert_equals',
  'shouldNotBe': 'assert_not_equals',
  'shouldBeGreaterThan': 'assert_greater_than',
  'shouldBeGreaterThanOrEqualTo': 'assert_greater_than_equal',
};

function transformShouldBeComparator() {
  return {
    visitor: {
      CallExpression(path) {
        if (transformComparatorMap.hasOwnProperty(path.node.callee.name)) {
          const newActual =
              babelParser.parseExpression(path.node.arguments[0].value);
          const newExpected =
              babelParser.parseExpression(path.node.arguments[1].value);
          path.node.arguments = [newActual, newExpected];

          path.node.callee.name = transformComparatorMap[path.node.callee.name];
        }
      },
    },
  };
}


const transformEqualToMap = {
  'shouldBeEqualToString': 'assert_equals',
  'shouldBeEqualToNumber': 'assert_equals',
};

function transformShouldBeEqualToSpecific() {
  return {
    visitor: {
      CallExpression(path) {
        if (transformEqualToMap.hasOwnProperty(path.node.callee.name)) {
          path.node.callee.name = transformEqualToMap[path.node.callee.name];
          const newActual =
              babelParser.parseExpression(path.node.arguments[0].value);
          path.node.arguments[0] = newActual;
        }
      },
    },
  };
}


const notTransformed = new Set([
  'evalAndLog',
  'shouldBecomeEqual', 'shouldBecomeEqualToString',
  'shouldBeType', 'shouldBeCloseTo', 'shouldBecomeDifferent',
  'shouldEvaluateTo', 'shouldEvaluateToSameobject',
  'shouldNotThrow', 'shouldThrow',
  'shouldBeNow',
  'expectError', 'shouldHaveHadError',
  'gc',
  'isSuccessfulyParsed',
  'finishJSTest', 'startWorker',
]);

function reportUntransformedFunctions() {
  return {
    visitor: {
      CallExpression(path) {
        if (notTransformed.has(path.node.callee.name)) {
          throw Error('Untransformable function from js-test.js: ' +
            path.node.callee.name);
        }
      },
    },
  };
}

// Returns a closure that modifies the parameter, transformInfo
// so that information gathered during traversal can be used in
// the outer scope.
function removeDescriptionFactory(transformInfo) {
  return function() {
    return {
      visitor: {
        CallExpression(path) {
          if (path.node.callee.name === 'description') {
            // This will currently only take the first description.
            // We might want to change to use the last, longest, or a
            // concatenation?
            if (!transformInfo.description) {
              transformInfo.description = path.node.arguments[0].value;
            }
            path.remove();
          }
        },
      },
    };
  };
}

function transformDebug() {
  return {
    visitor: {
      CallExpression(path) {
        if (path.node.callee.name === 'debug') {
          const consoleIdentifier = babel.types.identifier('console');
          const logIdentifier = babel.types.identifier('log');
          const consoleLogNode =
          babel.types.memberExpression(consoleIdentifier, logIdentifier);
          path.node.callee = consoleLogNode;
        }
      },
    },
  };
}

// removeDumpAsText will delete testRunner.dumpAsText()
// since testharnessreport.js does that automatically.
function removeDumpAsText() {
  return {
    visitor: {
      CallExpression(path) {
        if (path.node.callee.type === 'MemberExpression' &&
            path.node.callee.object.name === 'testRunner' &&
            path.node.callee.property.name === 'dumpAsText') {
          path.remove();
        }
      },
    },
  };
}

// Applies transformations in pluginArray to sourceCode (string)
// If addSetup is true, will add setup() test call at the beginning of
// the script.
// Returns an object
//  - code {string}: the transformed source code string
//  - title {string}: test title string, if parsed from description() calls
function transformSourceCodeString(sourceCode, addSetup=true, addDone=true) {
  // transformInfo is an object to be passed to plugins that return closures
  // so that we can have access to data within the transformation back in this
  // scope.
  const transformInfo = {};
  // Upon visiting a node, babel runs each plugin in order.
  const pluginArray = [
    transformShouldBeBool,
    transformShouldBeValue,
    transformShouldBeComparator,
    transformShouldBeEqualToSpecific,
    removeDescriptionFactory(transformInfo),
    transformDebug,
    removeDumpAsText,
    reportUntransformedFunctions,
  ];

  if (addSetup) {
    pluginArray.unshift(addSetupNode);
  }

  const output = babel.transformSync(sourceCode, {
    plugins: pluginArray,
    retainLines: true,
  });

  let outputCode = output.code;
  if (addDone) {
    outputCode += '\ndone();';
  }

  return {code: outputCode, title: transformInfo.description};
}

module.exports = {transformSourceCodeString};
