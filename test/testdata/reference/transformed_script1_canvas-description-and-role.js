
if (window.testRunner && window.accessibilityController) {
    testRunner.dumpAsText();

    document.getElementById('container').focus();
    var axContainer = accessibilityController.focusedElement;

    assert_equals(axContainer.childrenCount, 2);

    var axCanvas1 = axContainer.childAtIndex(0);

    var axCanvas2 = axContainer.childAtIndex(1);
}
