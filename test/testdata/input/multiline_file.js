const value = 'value';
const badValue = 1;
shouldBeEqualToString("value", 'value');
shouldNotBe("value.length", "badValue");
let testObject = {
  property: true
};

shouldBeDefined("testObject.property");
shouldBeTrue("testObject.property");