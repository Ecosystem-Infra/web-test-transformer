'use strict';
const debug = require('debug');
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
const GC = 'gc.js';

const INDENTATION_REGEX = /^\n\s*$/g;

const log = debug('injectScripts');

function replaceScriptsPlugin(params) {
  return function(tree) {
    let scriptCount = 0;
    tree.match({tag: SCRIPT}, (node) => {
      if (node.content && node.content.length > 0) {
        const script = params.scripts[scriptCount];
        // Updates the script content
        node.content[0] = script;

        // if the new script is empty, we will just have
        // <script></script>
        if (script !== '') {
          // Adds a newline before so we don't get <script>functionCallHere()
          node.content.unshift('\n');

          // Ensure ending newline so we don't get functionCall()Here</script>
          if (node.content[node.content.length-1] !== '\n') {
            node.content.push('\n');
          }
        }
      }
      scriptCount++;
      return node;
    });
  };
}

function changeSrcPlugin(srcInfo) {
  let srcPath = '';
  return function(tree) {
    tree.match({tag: SCRIPT}, (node) => {
      if (node.attrs && node.attrs.src && node.attrs.src.endsWith(JS_TEST)) {
        node.attrs.src = node.attrs.src.replace(JS_TEST, TEST_HARNESS);
        srcPath = node.attrs.src;
        srcInfo.changedSrc = true;
      }
      return node;
    });

    const testharnessreportPath =
      srcPath.replace(TEST_HARNESS, TEST_HARNESS_REPORT);
    const newSrcNode = {
      tag: SCRIPT,
      attrs: {src: testharnessreportPath},
    };

    // Add testharnessreport.js src after testharness.js src
    addNode(tree, newSrcNode, (node) => {
      return node.tag === SCRIPT && node.attrs && node.attrs.src === srcPath;
    });

    if (!srcInfo.srcGC) {
      return;
    }

    const newSrcGCNode = {
      tag: SCRIPT,
      attrs: {src: srcPath.replace(TEST_HARNESS, GC)},
    };

    // Add gc.js src after testharnessreport.js src
    addNode(tree, newSrcGCNode, (node) => {
      return node.tag === SCRIPT &&
             node.attrs &&
             node.attrs.src === testharnessreportPath;
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
// description is a string.
function insertTitlePlugin(description) {
  return function(tree) {
    let foundTitle = false;
    tree.match({tag: TITLE}, (node) => {
      foundTitle = true;
      return node;
    });
    // <title> exists, don't add a new one.
    if (foundTitle) {
      log('WARNING: existing <title>, not using description parameter');
      return;
    }
    const newTitleNode = {
      tag: TITLE,
      content: [description],
    };

    // Within <head> tag
    if (addNodeWithinTag(tree, newTitleNode, (node) => node.tag === HEAD)) {
      return;
    }
    // Within <html> tag
    if (addNodeWithinTag(tree, newTitleNode, (node) => node.tag === HTML)) {
      return;
    }
    // After <!DOCTYPE html> tag
    if (addNode(tree, newTitleNode, (node) =>
      typeof node === 'string' && node.includes(DOCTYPE))
    ) {
      return;
    }
    // Default: add title to beginning of document
    addNode(tree, newTitleNode, () => true);
  };
}

// This function is necessary because the PostHTML parser
// breaks the script into 2 strings
// if '<' is used within a script since it violates
// this code's assumption that a node's content attribute
// has one string containing the script.
// https://github.com/Ecosystem-Infra/web-test-transformer/issues/8
function concatContentPlugin() {
  return function(tree) {
    tree.match({tag: SCRIPT}, (node) => {
      if (node.content) {
        node.content = [node.content.join()];
      }
      return node;
    });
  };
}

// Adds node after the first node that returns true on conditionTest
// This function is based on posthtml's traverse() function.
// https://github.com/posthtml/posthtml/blob/master/lib/api.js#L102
// returns true if node was added, false if not.
// Attempts to match the indentation of previous node.
// If you wish to add a node within tags (e.g within <head>),
// see addNodeWithinTag below.
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

// Adaptation of addNode above. See that function first.
// Assumes conditionTest returns true on an open tag like
// <head>, <html>, etc.
// addNodeWithinTag will add node within the tag matched if it is
// an object, if not it will add the node after the match.
// Attempts to match indentation within the tag for new node.
function addNodeWithinTag(tree, node, conditionTest) {
  let indentation = '\n';
  if (Array.isArray(tree)) {
    for (let i = 0; i < tree.length; i++) {
      if (typeof tree[i] === 'string' && INDENTATION_REGEX.test(tree[i])) {
        indentation = tree[i];
      }
      if (conditionTest(tree[i])) {
        // Copy indentation within node if it exists.
        if (typeof tree[i] === 'object') {
          const content = tree[i].content ? tree[i].content : [];
          // Indentation is usually set as the first string within a tree array
          if (tree[i].content.length > 0 &&
              typeof tree[i].content[0] === 'string' &&
              INDENTATION_REGEX.test(tree[i].content[0])) {
            indentation = tree[i].content[0];
          }
          content.unshift(node);
          content.unshift(indentation);
          tree[i].content = content;
          return true;
        }
        // If matching node is not an object, default behavior is add node after
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

function injectScriptsIntoHTML(filePath,
    scripts,
    description,
    outputPath,
    srcGC) {
  const oldHTML = fs.readFileSync(filePath, 'utf-8');
  const srcInfo = {changedSrc: false, srcGC: srcGC};

  const newHTML = posthtml([
    concatContentPlugin(),
    replaceScriptsPlugin({filePath: filePath, scripts: scripts}),
    changeSrcPlugin(srcInfo),
    insertTitlePlugin(description),
  ])
      .process(oldHTML, {sync: true})
      .html;

  if (!srcInfo.changedSrc) {
    throw Error('injectScripts did not find js-test.js srced');
  }

  fs.writeFileSync(outputPath, newHTML);
  return newHTML;
}
module.exports = {injectScriptsIntoHTML};
