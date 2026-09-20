import { describe, expect, it } from "vitest";
import { CATEGORIES, TAX_CATEGORIES, TAX_LINES, isCategory, isTaxCategory } from "./categories";

describe("categories", () => {
  it("every tax category except none has a CRA line", () => {
    for (const t of TAX_CATEGORIES) if (t !== "none") expect(TAX_LINES[t].line).toMatch(/^\d{5}$/);
  });
  it("guards accept only the vocabulary", () => {
    expect(isCategory("groceries")).toBe(true);
    expect(isCategory("Groceries")).toBe(false);
    expect(isTaxCategory("medical")).toBe(true);
    expect(isTaxCategory(42)).toBe(false);
    expect(CATEGORIES.length).toBeGreaterThan(10);
  });
});
