'use strict';
const debug = require('debug');
const fs = require('fs');

const log = debug('verify');

function isBaselineAllPass(file) {
  const lines = fs.readFileSync(file, 'utf-8').split('\r?\n');
  let allPass = true;
  lines.forEach((line) => {
    if (line.startsWith('FAIL') || line.startsWith('WARN')) {
      allPass = false;
    }
  });
  return allPass;
}

// transformedFile is a path to an html test
function verifyTransformation(transformedFile) {
  const baselineFile = transformedFile.replace('\.html', '-expected.txt');
  const allPass = isBaselineAllPass(baselineFile);
  if (!allPass) {
    log(transformedFile + ' baseline was not all PASS, skipping verification').
    return false;
  }
}