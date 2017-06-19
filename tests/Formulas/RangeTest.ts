import {
  FREQUENCY
} from "../../src/Formulas/Range";
import {
  assertArrayEquals,
  catchAndAssertEquals,
  test
} from "../Utils/Asserts";
import * as ERRORS from "../../src/Errors";



test("FREQUENCY", function(){
  assertArrayEquals(FREQUENCY([10, 2, 3, 44, 1, 2], 22), [5, 1]);
  assertArrayEquals(FREQUENCY([10, 2, 3, 44, 1, 2], [22]), [5, 1]);
  assertArrayEquals(FREQUENCY([10, [2, 3, 44, 1], 2], [22]), [5, 1]);
  assertArrayEquals(FREQUENCY([18, 30, 90, 91, 35, 27, 75, 28, 58], [25, 50, 75]), [1, 4, 2, 2]);
  assertArrayEquals(FREQUENCY([18, 30, 90, 91, 35, 27, 75, 28, 58], [50, 25, 75]), [1, 4, 2, 2]);
  catchAndAssertEquals(function() {
    FREQUENCY.apply(this, [10, 10, 10]);
  }, ERRORS.NA_ERROR);
  catchAndAssertEquals(function() {
    FREQUENCY.apply(this, [10]);
  }, ERRORS.NA_ERROR);
  catchAndAssertEquals(function() {
    FREQUENCY([10, 2, 3, 44, 1, [], 2], 22);
  }, ERRORS.REF_ERROR);
});