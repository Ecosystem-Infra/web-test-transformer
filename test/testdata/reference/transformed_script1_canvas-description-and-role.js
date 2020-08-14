setup({ single_test: true });


if (window.testRunner && window.accessibilityController) {


  document.getElementById('container').focus();
  var axContainer = accessibilityController.focusedElement;

  assert_equals(axContainer.childrenCount, 2);

  var axCanvas1 = axContainer.childAtIndex(0);
  console.log('Canvas 1 description: ' + axCanvas1.name);
  console.log('Canvas 1 role: ' + axCanvas1.role);

  var axCanvas2 = axContainer.childAtIndex(1);
  console.log('Canvas 2 description: ' + axCanvas2.name);
  console.log('Canvas 2 role: ' + axCanvas2.role);
}
done();