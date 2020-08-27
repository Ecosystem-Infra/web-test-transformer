# Web Test Transformer

- [Web Test Transformer](#web-test-transformer)
  - [Introduction](#introduction)
  - [Setup](#setup)
  - [Usage](#usage)
    - [Dry Run](#dry-run)
    - [CLI Flags](#cli-flags)
      - [Required Flags](#required-flags)
    - [Examples](#examples)
  - [Functional Overview](#functional-overview)
  - [Things to Look Out For](#things-to-look-out-for)
  - [Verification](#verification)
    - [All PASS Requirement](#all-pass-requirement)
  - [Issues](#issues)

## Introduction
Web Test Transformer is designed to transform HTML tests in Chromium source from the legacy
[js-test.js](https://source.chromium.org/chromium/chromium/src/+/master:third_party/blink/web_tests/resources/js-test.js)
framework to the current
[testharness.js](https://source.chromium.org/chromium/chromium/src/+/master:third_party/blink/web_tests/resources/testharness.js)
framework.


View the design document at [go/web-test-transformer](http://go/web-test-transformer) (internal Google access 
only).

## Setup

```bash
git clone https://github.com/Ecosystem-Infra/web-test-transformer.git
cd web-test-transformer
npm install
```

## Usage

Requirements:
- You are **not** running the tool on Windows (no path separator support, see https://github.com/Ecosystem-Infra/web-test-transformer/issues/11). 
- You must be in `chromium/src/third_party/blink/web_tests` within the Chromium source tree (for verification)
- You must have content_shell built. (for verification)


Here are the high level steps for using the tool to update tests:
1. Run the tool on some tests
2. Make note of the summary output: particularly transformation and verification failures
3. Manually review: restore failures, make adjustments on tests
4. Commit any transformations you wish to keep.
5. Send a CL for review and CQ run


### Dry Run
By default, the tool overwrites the original file and changes can be viewed using `git diff`.
Sometimes that output can be hard to read and understand the full context.
If you would like to write the transformed file to a different path to compare the files, 
create a directory and pass the path to the `--output_dir` flag. The transformed files will
appear in that directory with their original names.

**Dry Run Example**

`$mkdir transformed_temp`

`$node ~/web-test-transformer/index.js --dir=./fast/dom/SelectorAPI --output_dir=./transformed_temp`

*review the transformations or diffs:*
`$diff ./fast/dom/SelectorAPI/caseID.html ./transformed_temp/caseID.html`

`$rm -r transformed_temp`

### CLI Flags
`$node index.js --help`

```
Options:
  --file: Path to test file to transform
    (default: null)
  --dir: Path to dir of test files and directories to recursively transform
    (default: null)
  --output_dir: Path to dir where output files should be written. If 
    null, will overwrite input files. 
    (default: null)
  --target_build: Target build used in -t parameter for run_web_tests.py
    (default: "Default")
  --[no]quiet: Disable logging
    (default: false)
  --[no]verify: Runs web test after transforming.
    (default: true)
```

#### Required Flags
You must specify **exactly one** of `--file` or `--dir`.

### Examples

See an [example CL in linked bug](https://bugs.chromium.org/p/chromium/issues/detail?id=1120356).

Transforming a directory of tests, running verification with a build called out/Debug

`$node ~/web-test-transfomer/index.js --dir=fast/dom/SelectorAPI --target_build=Debug`

Transforming a single file fast/files/file-list-test.html, skipping verification 

`$node ~/web-test-transformer/index.js --file=fast/files/file-list-test.html --noverify`

<details><summary><b>Example Output Per File:</b></summary>

```
$node ~/webTestTransfomer/index.js --file=fast/files/file-list-test.html
  transformFile Starting transformation on fast/files/file-list-test.html +0ms
  transformFile Completed transformation, wrote fast/files/file-list-test.html +243ms
  verify Running web test fast/files/file-list-test.html +0ms
Collecting tests ...
Parsing expectations ...
Checking build ...
Clobbering excess archived results in /usr/local/google/home/dmorejon/chromium/src/out/Default
Checking system dependencies ...
Sharding tests ...
Starting 1 worker ...

Looking for new crash logs ...
Summarizing results ...
The test ran as expected.
```
This is for one file, but for a directory you will see a similar output for each file in the directory tree.
At the end of the run for a directory, you will see an output similar to that below. You can then
search the output for the file paths that fail transformation or verification to see the associated error.
</details>

<details><summary><b>Example Summary Output:</b></summary>

Note that the real output has color so it's a bit easier to read!

```
index.js Transformation Results: +0ms
  index.js Completed Transformations: +0ms
fast/files/blob-parts-slice-test.html
fast/files/blob-slice-test.html
fast/files/file-list-test.html
fast/files/xhr-response-blob.html
  index.js Skipped Transformations: +2ms
fast/files/apply-blob-url-to-img.html
fast/files/apply-blob-url-to-xhr.html
  index.js Failed Transformations: +0ms
fast/files/blob-constructor.html
  index.js 
  index.js Verification Results: +1ms
  index.js Succesful Verifications: +0ms
fast/files/blob-parts-slice-test.html
fast/files/blob-slice-test.html
fast/files/file-list-test.html
  index.js Failed Verifications: +0ms
fast/files/xhr-response-blob.html
```
</details>

## Functional Overview
This tool does its best job to meaningfully log all of the major actions it takes, as well as any 
problems or errors it encounters along the way. For a large directory there will be a lot of output,
but it should be easily searchable. 

For a file, the tool will attempt to transform that file
and then attempt to verify that file. No summary output is provided since all the output is related to the single
file.

For a directory, the tool will iterate through the files in that directory (recursively), transforming all the .
js files then all the .html files. Each file is handled like a single file above (transformed then verified). It 
is not
batch-transformed then batch-verified. This could lead to problems if files depend on each other, since the
dependent file might be transformed first and verification would fail.
After running on a directory, the tool provides summary output detailing the transformations that completed 
(does __NOT__ guarantee correctness, just completion of the transformation code), failed, and
files that were skipped. The skipping reason is logged, for example the test does not src `js-test.js`.
The tool also lists whether transformed files succeeded or failed verification.
With this summary output, you can manually check files failed transformations/verifications to see if the
problem is easily fixed by a human, report bugs with this tool if the transformation should have worked, or just 
`git checkout` those files and commit the succesful transformations to Gerrit.

## Things to Look Out For
For manual review of the transformed tests there are a few common issues that arise.
- Check the contents of the `<title>` tag, especially if there are helper scripts involved.
- Style, particularly indentation. 
- In .js helper scripts, checking whether the file needs `setup()` and `done()` calls if the helper file is
  the test and not just helper functions


## Verification

The tool attempts to provide automated verification of the transformation unless `--noverify` or `--verify=false` is passed. This is done by running the [Chromium web tests](https://chromium.googlesource.com/chromium/src/+/master/docs/testing/web_tests.md) on the transformed tests and verifying the test still produces the same results.

Some `run_web_tests.py` output will be shown when running verification, and you will see failures prefixed 
by `verify:ERROR`.



### All PASS Requirement
Since comparing failures within a test from the different frameworks (`js-test.js` and `testharness.js`) is hard, the tool __only__ verifies tests whose baseline file ({test name}-expected.txt) is all PASS. 
The tool will still attempt to transform all files, but will only verify a subset. 

If a test does not contain all PASS, verification is immediately reported as failed without running the web 
tests. You can manually review the transformed file, run the web tests, and commit the transformation and the
new baseline if they seem correct.

Once a baseline file is deemed all PASS, it is deleted. This is because the `testharness.js` framework does
not generate a baseline file if the test has no failures. If you commit a sucessfully transformed file, 
also commit the deletion of the baseline file.


## Issues
If you encounter a problem with this tool, or have a question/suggestion: file an 
[issue](https://github.com/Ecosystem-Infra/web-test-transformer/issues) or contact the 
[Ecosystem Infra team](mailto:ecosystem-infra@chromium.org).