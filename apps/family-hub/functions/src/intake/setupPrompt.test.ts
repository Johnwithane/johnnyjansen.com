import { describe, expect, it } from "vitest";
import { SetupFound, condense, setupPrompt, toFoundProposals } from "./setupPrompt";

describe("condense", () => {
  it("collapses repeats of the same sender and subject shape, most frequent first", () => {
    const lines = condense([
      { from: "Netflix <info@netflix.com>", subject: "Your Netflix bill for $16.49", day: "2026-07-05" },
      { from: "Netflix <info@netflix.com>", subject: "Your Netflix bill for $16.49", day: "2026-08-05" },
      { from: "Netflix <info@netflix.com>", subject: "Your Netflix bill for $18.99", day: "2026-09-05" },
      { from: "Dentist <hi@smile.ca>", subject: "Reminder: Oct 3 2:30", day: "2026-09-18" },
    ]);
    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe("2026-07-05 (x3: 2026-08-05, 2026-09-05) | Netflix <info@netflix.com> | Your Netflix bill for $16.49");
  });
});

describe("setupPrompt + schema", () => {
  it("names what is already set up and tolerates a sloppy response", () => {
    expect(setupPrompt("2026-09-20", ["x"], { bills: ["Netflix"], accounts: [] })).toContain("do not repeat: bills Netflix");
    const f = SetupFound.parse({ bills: [{ name: "Hydro", amount: "$92", cadence: null, day: "15" }], accounts: null, bookings: [{}], clients: "x" });
    expect(f.bills[0]).toMatchObject({ amount: 92, cadence: "", day: 15 });
    expect(f.accounts).toEqual([]);
    expect(f.clients).toEqual([]);
  });
});

describe("toFoundProposals", () => {
  const today = "2026-09-20";
  it("maps each group, computes a next due day, and skips what exists or is past", () => {
    const out = toFoundProposals(
      {
        bills: [
          { name: "Netflix", amount: 16.49, cadence: "monthly", day: 5, sender: "info@netflix.com" },
          { name: "FortisBC", amount: 0, cadence: "Monthly", day: 25, sender: "" },
          { name: "netflix", amount: 16.49, cadence: "monthly", day: 5, sender: "" },
          { name: "", amount: 1, cadence: "monthly", day: 1, sender: "" },
        ],
        accounts: [{ name: "TD chequing", type: "Chequing", sender: "td.com" }, { name: "Amex", type: "card", sender: "" }],
        bookings: [
          { title: "Dentist", date: "2026-10-03", time: "14:30", location: "Smile Dental", sender: "hi@smile.ca" },
          { title: "Old thing", date: "2026-09-01", time: "", location: "", sender: "" },
          { title: "No date", date: "", time: "", location: "", sender: "" },
        ],
        clients: [{ name: "Acme Co", email: "ap@acme.com" }],
      },
      today,
      { bills: ["Fortis BC"], accounts: [] },
    );
    expect(out.map((p) => `${p.kind}:${p.summary}`)).toEqual([
      "bill:Netflix, $16.49 monthly, around the 5th",
      "account:TD chequing (chequing)",
      "account:Amex (chequing)",
      "event:Dentist, 2026-10-03 at 14:30",
      "contact:Acme Co, ap@acme.com (client)",
    ]);
    expect(out[0].payload).toMatchObject({ nextDue: "2026-10-05", cadence: "monthly", category: "subscriptions" });
    expect(out[3].payload).toMatchObject({ start: "2026-10-03T14:30", allDay: false, location: "Smile Dental" });
  });
  it("a due day still ahead this month stays in this month", () => {
    const out = toFoundProposals({ bills: [{ name: "Rent", amount: 1850, cadence: "monthly", day: 28, sender: "" }], accounts: [], bookings: [], clients: [] }, today, { bills: [], accounts: [] });
    expect(out[0].payload.nextDue).toBe("2026-09-28");
  });
});
