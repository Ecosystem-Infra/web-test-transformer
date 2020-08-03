description('Tests value and testObject');
const value = 'value';
const badValue = 1;
shouldBeEqualToString("value", 'value');
shouldNotBe("value.length", "badValue");
let testObject = {
  property: true
};

debug('tested value');
description('This part tests testObject but this is a bad description!');
shouldBeDefined("testObject.property");
shouldBeTrue("testObject.property");