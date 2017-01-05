import { Sheet } from "../src/Sheet"
import { assertEquals } from "./utils/Asserts"

// Test parsing math formulas
var sheet  = new Sheet();
sheet.setCell("A1", "=10 * 10");
var cell = sheet.getCell("A1");
assertEquals(100, cell.getValue());

var sheet  = new Sheet();
sheet.setCell("A1", "=SUM(10) + 12");
var cell = sheet.getCell("A1");
assertEquals(22, cell.getValue());
