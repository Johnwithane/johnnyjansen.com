import { describe, expect, it } from "vitest";
import { detectColumns, guessCategory, importKey, parseAmount, parseCsv, parseDate, rowsToImport } from "./csvImport";

describe("parseCsv", () => {
  it("handles quotes, embedded commas, CRLF and a BOM", () => {
    expect(parseCsv('﻿a,"b, c","d ""e"""\r\n1,2,3\n')).toEqual([
      ["a", "b, c", 'd "e"'],
      ["1", "2", "3"],
    ]);
  });
});

describe("dates and amounts", () => {
  it("reads the formats Canadian banks export", () => {
    expect(parseDate("2026-09-18")).toBe("2026-09-18");
    expect(parseDate("09/18/2026")).toBe("2026-09-18");
    expect(parseDate("18/09/2026")).toBe("2026-09-18");
    expect(parseDate("Sep 18, 2026")).toBe("2026-09-18");
    expect(parseDate("18 Sep")).toBe("");
  });
  it("signs by minus or parentheses and ignores currency symbols", () => {
    expect(parseAmount("-$1,234.56")).toBe(-1234.56);
    expect(parseAmount("(12.00)")).toBe(-12);
    expect(parseAmount("45.10")).toBe(45.1);
    expect(parseAmount("")).toBeNull();
  });
});

describe("detectColumns + rowsToImport", () => {
  it("RBC style: header with a signed amount column", () => {
    const rows = parseCsv('"Account Type","Account Number","Transaction Date","Cheque Number","Description 1","Description 2","CAD$","USD$"\nChequing,123,9/18/2026,,"SAVE ON FOODS #2211",,-68.40,\nChequing,123,9/19/2026,,"PAYROLL DEPOSIT",,2500.00,\n');
    const map = detectColumns(rows);
    expect(map).toMatchObject({ date: 2, merchant: 4, amount: 6, hasHeader: true });
    const out = rowsToImport(rows, map!);
    expect(out).toEqual([
      { date: "2026-09-18", merchant: "SAVE ON FOODS #2211", amount: 68.4, direction: "expense", category: "groceries" },
      { date: "2026-09-19", merchant: "PAYROLL DEPOSIT", amount: 2500, direction: "income", category: "income" },
    ]);
  });
  it("TD style: no header, date, description, debit, credit, balance", () => {
    const rows = parseCsv("09/15/2026,NETFLIX.COM,18.99,,1200.50\n09/16/2026,E-TRANSFER RECEIVED,,300.00,1500.50\n09/17/2026,PETRO-CANADA,72.10,,1428.40\n");
    const map = detectColumns(rows);
    expect(map).toMatchObject({ date: 0, merchant: 1, amount: -1, debit: 2, credit: 3, hasHeader: false });
    const out = rowsToImport(rows, map!);
    expect(out.map((r) => [r.direction, r.amount, r.category])).toEqual([
      ["expense", 18.99, "subscriptions"],
      ["income", 300, "transfer"],
      ["expense", 72.1, "car"],
    ]);
  });
  it("returns null when nothing looks like a statement", () => {
    expect(detectColumns(parseCsv("name,age\nSam,4\n"))).toBeNull();
  });
});

describe("helpers", () => {
  it("guesses a category and builds a stable dedupe key", () => {
    expect(guessCategory("TIM HORTONS #4412", "expense")).toBe("eating_out");
    expect(guessCategory("MYSTERY SHOP", "expense")).toBe("other");
    expect(importKey({ date: "2026-09-18", amount: 68.4, merchant: "Save On Foods #2211" })).toBe("2026-09-18|68.40|saveonfoods2211");
  });
});
