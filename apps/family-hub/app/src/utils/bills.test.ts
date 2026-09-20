import { describe, expect, it } from "vitest";
import type { Bill, WithId } from "@/firebase/interfaces";
import { advanceDue, daysUntil, detectCreep, dueLabel, loadSplit, merchantKey, monthlyCost, yearlyCost } from "./bills";

const bill = (over: Partial<WithId<Bill>>): WithId<Bill> =>
  ({ id: "b", name: "Netflix", amount: 16.49, currency: "CAD", cadence: "monthly", nextDue: "2026-10-01", accountId: null, category: "subscriptions", responsibleUid: null, autopay: true, notes: "", visibility: "household", ownerUid: "u", source: "portal", ...over }) as WithId<Bill>;

describe("costs and dates", () => {
  it("annualises by cadence", () => {
    expect(yearlyCost({ amount: 10, cadence: "monthly" })).toBe(120);
    expect(monthlyCost({ amount: 120, cadence: "yearly" })).toBe(10);
    expect(yearlyCost({ amount: 50, cadence: "once" })).toBe(0);
  });
  it("advances and labels due days", () => {
    expect(advanceDue("2026-01-31", "monthly")).toBe("2026-02-28");
    expect(daysUntil("2026-09-25", "2026-09-20")).toBe(5);
    expect(dueLabel("2026-09-20", "2026-09-20")).toBe("Today");
    expect(dueLabel("2026-09-18", "2026-09-20")).toBe("2 days overdue");
    expect(dueLabel("2026-10-15", "2026-09-20")).toBe("Oct 15");
  });
});

describe("creep detection", () => {
  const tx = (merchant: string, amount: number, date: string) => ({ merchant, amount, date, direction: "expense" as const });
  it("matches bank-mangled merchant names to the bill", () => {
    expect(merchantKey("TD*NETFLIX.COM 1234")).toBe("netflix");
    expect(merchantKey("Spotify AB")).toBe("spotify");
  });
  it("flags a charge that went up and a monthly bill with no charge in 90 days", () => {
    const flags = detectCreep(
      [bill({ id: "nf" }), bill({ id: "sp", name: "Spotify", amount: 11.99 }), bill({ id: "rent", name: "Rent", amount: 1850 })],
      [tx("NETFLIX.COM", 18.99, "2026-09-15"), tx("SPOTIFY", 11.99, "2026-05-02"), tx("RENT E-TRANSFER", 1850, "2026-09-01")],
      "2026-09-20",
    );
    expect(flags).toEqual([
      { billId: "nf", kind: "up", detail: "Charged $18.99 on 2026-09-15, up from $16.49" },
      { billId: "sp", kind: "unused", detail: "No charge seen since 2026-05-02. Still using it?" },
    ]);
  });
  it("ignores one-offs and bills with no charges at all", () => {
    expect(detectCreep([bill({ id: "x", cadence: "once" }), bill({ id: "y", name: "Gym" })], [tx("NETFLIX", 30, "2026-09-01")], "2026-09-20")).toEqual([]);
  });
});

describe("loadSplit", () => {
  it("counts recurring items per adult and the unowned ones", () => {
    expect(loadSplit([bill({ responsibleUid: "a" }), bill({ responsibleUid: "a" }), bill({ responsibleUid: "b" }), bill({}), bill({ cadence: "once" })])).toEqual({ byUid: { a: 2, b: 1 }, unowned: 1 });
  });
});
