setup({
  single_test: true,
  explicit_done: false
});

console.log("Start");

function onInputFileChange(files) {
  window.files = files;
  assert_true(files instanceof FileList);
  assert_equals(files.length, 2);
  assert_true(files.item(0) instanceof File);
  assert_equals(files.item(0).name, "UTF8.txt");
  assert_true(files.item(1) instanceof File);
  assert_equals(files.item(1).name, "UTF8-2.txt");
  assert_equals(files.item(2), null);
  assert_equals(files.item(-1), null);
  assert_true(files.item(0) === files.item(4294967296));
  assert_true(files.item(1) === files.item(4294967297));
  assert_true(files.item(2) === files.item(4294967298));
  assert_true(files.item(-1) === files.item(4294967295));
  assert_true(files.item(-4294967295) === files.item(1));
  assert_true(files.item(-4294967296) === files.item(0));
  assert_true(files.item(null) === files.item(0));
  assert_true(files.item(undefined) === files.item(0));
}

eventSender.beginDragWithFiles(["resources/UTF8.txt", "resources/UTF8-2.txt"]);
eventSender.mouseMoveTo(10, 10);
eventSender.mouseUp();
