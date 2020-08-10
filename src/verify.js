'use strict';
const childProcess = require('child_process');
const debug = require('debug');
const fs = require('fs');

const log = debug('verify');
const error = debug('verify:ERROR');
// For some reason RED is 1.
error.color = 1;

function isBaselineAllPass(baselineFile) {
  const lines = fs.readFileSync(baselineFile, 'utf-8').split(/\r?\n/);
  let allPass = true;
  lines.forEach((line) => {
    if (line.startsWith('FAIL') || line.startsWith('WARN')) {
      allPass = false;
    }
  });
  return allPass;
}

// transformedFile is a path to an html test
// Assumes cwd is chromium/src/third_party/blink/web_tests/
// Assumes content_shell is built and up to date.
function verifyTransformation(transformedFile) {
  const baselineFile = transformedFile.replace('\.html', '-expected.txt');
  const allPass = isBaselineAllPass(baselineFile);
  if (!allPass) {
    log(transformedFile + ' baseline was not all PASS, skipping verification');
    return false;
  }
  try {
    log('Running web test', transformedFile);
    // This could likely be done better. Attempts to get path to the test
    // relative to the web_tests/ directory. If it is already a relative path,
    // this should work. If it is a full path, this should split and take the
    // end (relative) path.
    const relativePath = transformedFile.split('web_tests/').pop();
    const cmd = '../tools/run_web_tests.py -t Default ' + relativePath;
    const testOutput = childProcess.execSync(cmd).toString();
    log(testOutput);
    // Delete baseline file if all pass and successful transformation,
    // testharness.js does not have a baseline if the test is all pass.
    fs.unlinkSync(baselineFile);
    return true;
  } catch (err) {
    error(transformedFile + 'FAILED verification.');
    error('Status code:', error.status);
    error(err.message);
    error(err.stdout.toString());
    return false;
  }
}

module.exports = {isBaselineAllPass, verifyTransformation};
