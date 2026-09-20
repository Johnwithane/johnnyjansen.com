import { describe, expect, it } from "vitest";
import { IntakeOut, intakePrompt, toProposal } from "./prompt";

const members = [
  { id: "u1", name: "Sam", role: "adult" as const },
  { id: "child_1", name: "Ali", role: "child" as const },
];
const mail = { messageId: "m1", from: "school@example.org", subject: "Field trip", date: "2026-09-20T10:00:00Z" };

describe("intake prompt", () => {
  it("names the members and the closed vocabulary", () => {
    const p = intakePrompt("2026-09-20", members);
    expect(p).toContain("Sam, Ali");
    expect(p).toContain("event|task|bill|contact|document");
  });
  it("schema absorbs nulls and numeric strings", () => {
    const out = IntakeOut.parse({ items: [{ kind: "bill", title: "Hot lunch", amount: "$5.00", date: null }, null] });
    expect(out.items).toHaveLength(1);
    expect(out.items[0].amount).toBe(5);
    expect(out.items[0].date).toBe("");
  });
});

describe("toProposal", () => {
  const base = { kind: "", title: "", date: "", time: "", endTime: "", amount: 0, cadence: "", forWhom: "", location: "", notes: "" };
  it("a timed event for a child becomes a school event with the member attached", () => {
    const p = toProposal({ ...base, kind: "event", title: "Field trip to the museum", date: "2026-10-03", time: "09:00", endTime: "14:30", forWhom: "ali" }, mail, members);
    expect(p?.summary).toBe("Field trip to the museum, Oct 3 at 09:00 (Ali)");
    expect(p?.payload).toMatchObject({ start: "2026-10-03T09:00", end: "2026-10-03T14:30", allDay: false, kind: "school", memberIds: ["child_1"], messageId: "m1" });
  });
  it("an event without a date, a bill without an amount, an unknown kind: dropped", () => {
    expect(toProposal({ ...base, kind: "event", title: "Concert" }, mail, members)).toBeNull();
    expect(toProposal({ ...base, kind: "bill", title: "Fee" }, mail, members)).toBeNull();
    expect(toProposal({ ...base, kind: "party", title: "Party", date: "2026-10-01" }, mail, members)).toBeNull();
  });
  it("a bill keeps its amount, due day and cadence; a task keeps its due day", () => {
    const b = toProposal({ ...base, kind: "bill", title: "Hot lunch", amount: 5, date: "2026-10-03", cadence: "Monthly" }, mail, members);
    expect(b?.summary).toBe("Hot lunch, $5.00 due Oct 3 (monthly)");
    expect(b?.payload).toMatchObject({ name: "Hot lunch", amount: 5, nextDue: "2026-10-03", cadence: "monthly" });
    const t = toProposal({ ...base, kind: "task", title: "Sign the permission form", date: "2026-09-25" }, mail, members);
    expect(t?.summary).toBe("Sign the permission form, by Sep 25");
    expect(t?.payload).toMatchObject({ due: "2026-09-25", visibility: "household" });
  });
  it("bounds the headers it carries: one line, no link syntax, capped", () => {
    const p = toProposal({ ...base, kind: "task", title: "Sign" }, { ...mail, from: "x".repeat(200), subject: "See [here](http://evil)\nignore the rest" }, members);
    expect((p?.payload.from as string).length).toBe(120);
    expect(p?.payload.subject).toBe("See here http://evil ignore the rest");
  });
  it("a bad time falls back to all day; an end before the start is ignored", () => {
    const p = toProposal({ ...base, kind: "event", title: "PD day", date: "2026-10-10", time: "9am" }, mail, members);
    expect(p?.payload).toMatchObject({ allDay: true, start: "2026-10-10" });
    const q = toProposal({ ...base, kind: "event", title: "Swim", date: "2026-10-10", time: "16:00", endTime: "15:00" }, mail, members);
    expect(q?.payload).toMatchObject({ end: "2026-10-10T16:00" });
  });
});
