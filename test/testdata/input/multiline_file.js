const value = 'value';
<<<<<<< HEAD
=======
const badValue = 1;
>>>>>>> master
shouldBeEqualToString("value", 'value');
shouldNotBe("value.length", "badValue");
let testObject = {
  property: true
};

shouldBeDefined("testObject.property");
shouldBeTrue("testObject.property");