import {
  ExcelDate
} from "../../src/ExcelDate";
/**
 * Assert two params are equal using strict equality testing.
 * @param actual value
 * @param expected value
 */
function assertEquals(actual, expected) {
  if (actual instanceof ExcelDate && expected instanceof ExcelDate) {
    if (!actual.equals(expected)) {
      console.log("expected:", expected.toString(), " actual:", actual.toString());
      console.trace();
    }
  } else {
    if (expected !== actual) {
      console.log("expected:", expected, " actual:", actual);
      console.trace();
    }
  }
}

/**
 * Assert two arrays are equal using strict equality testing on individual items.
 * @param actual value
 * @param expected value
 */
function assertArrayEquals(actual: Array<any>, expected: Array<any>, ) {
  if (expected.length != actual.length) {
    console.log("expected: ", expected, " actual:", actual);
    console.trace();
  }
  for (var index in expected) {
    if (expected[index] != actual[index]) {
      console.log("expected: ", expected, " actual:", actual);
      console.trace();
    }
  }
}

/**
 * Catch exceptions, check their name for an expected value
 * @param toExecute function to execute
 * @param expected error message
 */
function catchAndAssertEquals(toExecute : Function, expected) {
  var toThrow = null;
  try {
    toExecute();
    toThrow = true;
  } catch (actualError) {
    if (actualError.name !== expected) {
      console.log("expected:", expected, " actual:", actualError.name, actualError.message);
      console.trace();
    }
  }
  if (toThrow) {
    console.log("expected error: " + expected);
    console.trace();
  }
}

function test(description: string, toRun: Function) {
  console.log("Test:", description);
  toRun();
}


export {
  assertEquals,
  assertArrayEquals,
  catchAndAssertEquals,
  test
}