description('Tests value and testObject');
const value = 'value';
const badValue = 1;
shouldBeEqualToString("value", 'value');
shouldNotBe("value.length", "badValue");
let testObject = {
  property: true
};

<<<<<<< HEAD
debug('tested value');
=======
>>>>>>> c6fbcd0fcbfb8c5448f004a6630b96fe493a4600
description('This part tests testObject but this is a bad description!');
shouldBeDefined("testObject.property");
shouldBeTrue("testObject.property");