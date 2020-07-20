'use strict';

const fs = require('fs');
const posthtml = require('posthtml');
const { newNameFromPath } = require('./extractScripts');

const SCRIPT = 'script';

function injectScriptsPlugin(params) {
  return function(tree) {
    let scriptCount = 0;
    tree.walk((node) => {
      if (node.tag === SCRIPT) {
        if (node.attrs) {
          console.log(node.attrs);
        }
        if (node.content && node.content.length > 0) {
          const newScriptFile = newNameFromPath(params.filePath, scriptCount);
          const newScript = fs.readFileSync(params.tempDir + newScriptFile, 'utf-8');
          node.content[0] = newScript;
        }
        scriptCount++;
      }
      return node;
    });
  };
}

function changeSrcPlugin() {
  return function(tree) {
    console.log("plugin 2");
  }
}

const filePath = './test/testdata/input/file-list-test.html';
const tempDir = './test/testdata/reference'
injectScriptsIntoHTML(filePath, tempDir);

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
