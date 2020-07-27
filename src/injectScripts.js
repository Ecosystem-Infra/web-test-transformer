'use strict';
const fs = require('fs');
const posthtml = require('posthtml');

const DOCTYPE = '!DOCTYPE';
const HEAD = 'head';
const HTML = 'html';
const SCRIPT = 'script';
const TITLE = 'title';

const JS_TEST = 'js-test.js';
const TEST_HARNESS = 'testharness.js';
const TEST_HARNESS_REPORT = 'testharnessreport.js';

const INDENTATION_REGEX = new RegExp('^\n[ ]*$');

function replaceScriptsPlugin(params) {
  return function(tree) {
    let scriptCount = 0;
    tree.match({tag: SCRIPT}, (node) => {
      if (node.content && node.content.length > 0) {
        // Updates the script content
        node.content[0] = params.scripts[scriptCount];
        // Adds a newline before so we don't get <script>functionCallHere()
        node.content.unshift('\n');
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
      attrs: {src: srcPath.replace(TEST_HARNESS, TEST_HARNESS_REPORT)},
    };

    addNode(tree, newSrcNode, (node) => {
      return node.tag === SCRIPT && node.attrs && node.attrs.src === srcPath;
    });
  };
}

// insertTitlePlugin will add <title>description</title> in the following
// order of precedence if present:
// will not add if a <title> exists already,
// immediately after the <head> tag,
// immediately after the <html> tag,
// immediately after the <!DOCTYPE html> tag,
// at the beginning of the document.
function insertTitlePlugin(description) {
  return function(tree) {
    let foundTitle = false;
    tree.match({tag: TITLE}, (node) => {
      console.log('WARNING: existing <title>, not using description paramter.');
      foundTitle = true;
      return node;
    });
    if (foundTitle) {
      return;
    }
    const newTitleNode = {
      tag: TITLE,
      content: [description],
    };

    if (addNodeWithinTag(tree, newTitleNode, (node) => {
      return node.tag === HEAD;
    })) {
      return;
    }
    if (addNodeWithinTag(tree, newTitleNode, (node) => {
      return node.tag === HTML;
    })) {
      return;
    }
    if (addNode(tree, newTitleNode, (node) => {
      return typeof node === 'string' && node.includes(DOCTYPE);
    })) {
      return;
    }
    // Default: add title to beginning of document
    addNode(tree, newTitleNode, () => {
      return true;
    });
  };
}

// Adds node after the first node that returns true on conditionTest
// This function is based on posthtml's traverse() function.
// https://github.com/posthtml/posthtml/blob/master/lib/api.js#L102
// returns true if node was added, false if not.
function addNode(tree, node, conditionTest) {
  let indentation = '\n';
  if (Array.isArray(tree)) {
    for (let i = 0; i < tree.length; i++) {
      if (typeof tree[i] === 'string' && INDENTATION_REGEX.test(tree[i])) {
        indentation = tree[i];
      }
      if (conditionTest(tree[i])) {
        tree.splice(i+1, 0, indentation);
        tree.splice(i+2, 0, node);
        return true;
      }
      if (addNode(tree[i], node, conditionTest)) {
        return true;
      }
    }
  } else if (typeof tree === 'object' && tree.hasOwnProperty('content')) {
    return addNode(tree.content, node, conditionTest);
  }

  return false;
}

// Adds node after the first node that returns true on conditionTest
// This function is based on posthtml's traverse() function.
// https://github.com/posthtml/posthtml/blob/master/lib/api.js#L102
// returns true if node was added, false if not.
function addNodeWithinTag(tree, node, conditionTest) {
  let indentation = '\n';
  if (Array.isArray(tree)) {
    for (let i = 0; i < tree.length; i++) {
      if (typeof tree[i] === 'string' && INDENTATION_REGEX.test(tree[i])) {
        indentation = tree[i];
      }
      if (conditionTest(tree[i])) {
        if (typeof tree[i] === 'object') {
          const content = tree[i].content ? tree[i].content : [];
          if (tree[i].content.length > 0 && typeof tree[i].content[0] === 'string' && INDENTATION_REGEX.test(tree[i].content[0])) {
            indentation = tree[i].content[0];
          }
          content.unshift(node);
          content.unshift(indentation);
          tree[i].content = content;
          return true;
        }
        tree.splice(i+1, 0, indentation);
        tree.splice(i+2, 0, node);
        return true;
      }
      if (addNodeWithinTag(tree[i], node, conditionTest)) {
        return true;
      }
    }
  } else if (typeof tree === 'object' && tree.hasOwnProperty('content')) {
    return addNodeWithinTag(tree.content, node, conditionTest);
  }

  return false;
}

function injectScriptsIntoHTML(filePath, scripts, description, outputPath) {
  const oldHTML = fs.readFileSync(filePath, 'utf-8');

  const newHTML = posthtml([
    replaceScriptsPlugin({filePath: filePath, scripts: scripts}),
    changeSrcPlugin(),
    insertTitlePlugin(description),
  ])
      .process(oldHTML, {sync: true})
      .html;

  fs.writeFileSync(outputPath, newHTML);
  return newHTML;
}
module.exports = {injectScriptsIntoHTML};
