setup({ single_test: true });


var root = document.createElement("div");
for (var i = 0; i < 12; i++) {
  var child = document.createElement("span");
  if (i == 11)
  child.id = "pass";
  root.appendChild(child);
}

assert_equals(root.querySelector(":nth-child(12)").id, "pass");
done();
