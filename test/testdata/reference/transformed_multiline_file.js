setup({
  single_test: true,
  explicit_done: false
});
const value = 'value';
const badValue = 1;
assert_equals(value, 'value');
assert_not_equals(value.length, badValue);
let testObject = {
  property: true
};
console.log('tested value');
assert_not_equals(testObject.property, undefined);
assert_true(testObject.property);