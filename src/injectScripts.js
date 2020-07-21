'use strict';

const fs = require('fs');
const posthtml = require('posthtml');
const { newNameFromPath } = require('./extractScripts');

const SCRIPT = 'script';
const TEST_HARNESS = 'testharness.js';
const TEST_HARNESS_REPORT = 'testharnessreport.js'
const JS_TEST = 'js-test.js';

function injectScriptsPlugin(params) {
  return function(tree) {
    let scriptCount = 0;
    tree.match({tag: SCRIPT}, (node) => {
      if (node.content && node.content.length > 0) {
        const newScriptFile = newNameFromPath(params.filePath, scriptCount);
        const newScript = fs.readFileSync(params.tempDir + newScriptFile, 'utf-8');
        node.content[0] = newScript;
      }
      scriptCount++;
      return node;
    });
  };
}

function changeSrcPlugin() {
  let srcPath = '';
  return function(tree) {
    tree.match({tag: SCRIPT}, (node) => {
      if (node.attrs && node.attrs.src && node.attrs.src.endsWith(JS_TEST)) {
        node.attrs.src = node.attrs.src.replace(JS_TEST, TEST_HARNESS);

        srcPath = node.attrs.src;
      }
      return node;
    });

    const newSrcNode = {
      tag: SCRIPT, 
      attrs: {src: srcPath.replace(TEST_HARNESS, TEST_HARNESS_REPORT)}
    }

    addNode(tree, newSrcNode, (node) => {
      return node.tag == SCRIPT && node.attrs && node.attrs.src == srcPath;
    });
  };
}

// Adds node after the first node that returns true on conditionTest
// This function is based on posthtml's traverse() function.
// returns true if node was added, false if not.
function addNode(tree, node, conditionTest) {
  if (Array.isArray(tree)) {
    for (let i = 0; i < tree.length; i++) {
      if (typeof tree[i] == 'object' && conditionTest(tree[i])) {
        tree.splice(i+1, 0, '\n');
        tree.splice(i+2, 0, node);
        return true;
      }
      if (addNode(tree[i], node, conditionTest)) {
        return true;
      }
    }
  } else if (typeof tree === 'object' && tree.hasOwnProperty('content')) {
    addNode(tree.content, node, conditionTest); 
  }

  return false;
}

const filePath = './test/testdata/input/file-list-test.html';
const tempDir = './test/testdata/reference';
const outputPath = './t_play.html';
injectScriptsIntoHTML(filePath, tempDir, outputPath);

function injectScriptsIntoHTML(filePath, tempDir, outputPath) {
  const oldHTML = fs.readFileSync(filePath, 'utf-8');

  const result = posthtml([
    injectScriptsPlugin({filePath: filePath, tempDir: tempDir}), 
    changeSrcPlugin(),
  ])
  .process(oldHTML)
  .then((result) => {
    console.log(result.html)
    fs.writeFileSync(outputPath, result.html);
  });
}
