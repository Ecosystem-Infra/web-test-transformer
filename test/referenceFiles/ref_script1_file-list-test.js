
description("Test the attribute of FileList.");

debug("Start");

function onInputFileChange(files)
{
    window.files = files;
    shouldBeTrue("files instanceof FileList");
    shouldBe("files.length", "2");
    shouldBeTrue("files.item(0) instanceof File");
    shouldBeEqualToString("files.item(0).name", "UTF8.txt");
    shouldBeTrue("files.item(1) instanceof File");
    shouldBeEqualToString("files.item(1).name", "UTF8-2.txt");
    shouldBeNull("files.item(2)");
    shouldBeNull("files.item(-1)");
    shouldBeTrue("files.item(0) === files.item(4294967296)");
    shouldBeTrue("files.item(1) === files.item(4294967297)");
    shouldBeTrue("files.item(2) === files.item(4294967298)");
    shouldBeTrue("files.item(-1) === files.item(4294967295)");
    shouldBeTrue("files.item(-4294967295) === files.item(1)");
    shouldBeTrue("files.item(-4294967296) === files.item(0)");
    shouldBeTrue("files.item(null) === files.item(0)");
    shouldBeTrue("files.item(undefined) === files.item(0)");
}

eventSender.beginDragWithFiles(["resources/UTF8.txt", "resources/UTF8-2.txt"]);
eventSender.mouseMoveTo(10, 10);
eventSender.mouseUp();

