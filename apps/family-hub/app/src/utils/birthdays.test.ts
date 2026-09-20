import { describe, expect, it } from "vitest";
import { birthdayLine, upcomingBirthdays } from "./birthdays";

const members = {
  a: { role: "adult" as const, name: "Carly", colour: "#7fd0ff", email: null, uid: null, birthDate: "1985-09-26" },
  b: { role: "child" as const, name: "Forest", colour: "#f5c56b", email: null, uid: null, birthDate: "2017-02-06" },
  c: { role: "adult" as const, name: "Nobody", colour: "#fff", email: null, uid: null, birthDate: null },
};

describe("upcomingBirthdays", () => {
  it("finds the next occurrence within the window, soonest first", () => {
    const now = new Date(2026, 8, 20); // Sep 20 2026
    const list = upcomingBirthdays(members, now, 30);
    expect(list.map((b) => b.name)).toEqual(["Carly"]);
    expect(list[0]).toMatchObject({ inDays: 6, turning: 41, on: "2026-09-26" });
  });
  it("rolls into next year and counts today as 0", () => {
    const now = new Date(2026, 8, 26);
    expect(upcomingBirthdays(members, now, 200).map((b) => [b.name, b.inDays])).toEqual([["Carly", 0], ["Forest", 133]]);
  });
  it("writes a plain line", () => {
    expect(birthdayLine({ name: "Carly", colour: "", inDays: 6, turning: 41, on: "2026-09-26" })).toBe("Carly's birthday in 6 days, turning 41");
    expect(birthdayLine({ name: "Emery", colour: "", inDays: 0, turning: 6, on: "2026-05-17" })).toBe("Emery's birthday today, turning 6");
  });
});
