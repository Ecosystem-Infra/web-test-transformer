'use strict';
const babel = require('@babel/core');

// addSetupNode adds the setup() call to the beginning of the script.
function addSetupNode() {
  const setupNode = babel.template.statement.ast(`
    setup({single_test: true, explicit_done: false});
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
            babel.template.expression(path.node.arguments[0].value)();
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
            babel.template.expression(path.node.arguments[0].value)();
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
            babel.template.expression(path.node.arguments[0].value)();
          const newExpected =
            babel.template.expression(path.node.arguments[1].value)();
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
            babel.template.expression(path.node.arguments[0].value)();
          path.node.arguments[0] = newActual;
        }
      },
    },
  };
}

// Returns a closure that modifies the parameter, transformInfo
// so that information gathered during traversal can be used in
// the outer scope.
function removeDescription(transformInfo) {
  return function() {
    return {
      visitor: {
        CallExpression(path) {
          if (path.node.callee.name === 'description') {
            // TODO: this currently will overwrite with the last description.
            // Later, we might only want the first or a concatenation.
            transformInfo.description = path.node.arguments[0].value;
            path.remove();
          }
        },
      },
    };
  };
}

// TODO: maybe change debug() to console.log() instead of deleting?
function removeDebug() {
  return {
    visitor: {
      CallExpression(path) {
        if (path.node.callee.name === 'debug') {
          path.remove();
        }
      },
    },
  };
}

// Applies transformations in pluginArray to sourceCode (string)
// If addSetup is true, will add setup() test call at the beginning of
// the script.
// Returns an object with the transformed source code and the test title,
// if one was parsed from description() calls.
function transformSourceCodeString(sourceCode, addSetup=true) {
  const transformInfo = {};
  // Upon visiting a node, babel runs each plugin in order.
  const pluginArray = [
    transformShouldBeBool,
    transformShouldBeValue,
    transformShouldBeComparator,
    transformShouldBeEqualToSpecific,
    removeDescription(transformInfo),
    removeDebug,
  ];

  if (addSetup) {
    pluginArray.unshift(addSetupNode);
  }

  const output = babel.transformSync(sourceCode, {
    plugins: pluginArray,
  });

  return {code: output.code, title: transformInfo.description};
}

module.exports = {transformSourceCodeString};
