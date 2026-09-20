import { describe, expect, it } from "vitest";
import { money, monthOf, spendByCategory, totalSpend } from "./money";

describe("money", () => {
  it("formats CAD", () => {
    expect(money(1234.5)).toBe("$1,234.50");
  });
  it("sums expenses per category for one month, skipping income and transfers", () => {
    const by = spendByCategory(
      [
        { amount: 100, direction: "expense", date: "2026-09-01", category: "groceries" },
        { amount: 42.18, direction: "expense", date: "2026-09-19", category: "groceries" },
        { amount: 500, direction: "expense", date: "2026-09-02", category: "transfer" },
        { amount: 2000, direction: "income", date: "2026-09-15", category: "income" },
        { amount: 30, direction: "expense", date: "2026-08-31", category: "groceries" },
      ],
      "2026-09",
    );
    expect(by).toEqual({ groceries: 142.18 });
    expect(totalSpend(by)).toBe(142.18);
    expect(monthOf("2026-09-19")).toBe("2026-09");
  });
});
