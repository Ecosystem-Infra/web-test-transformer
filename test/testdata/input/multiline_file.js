const value = 'value';
shouldBeEqualToString("value", 'value');
shouldNotBe("value.length", "badValue");
let testObject = {
  property: true
};

shouldBeDefined("testObject.property");
shouldBeTrue("testObject.property");