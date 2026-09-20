import { describe, expect, it } from "vitest";
import { addDays, clockOf, dayKeyOf, dayOf, localIso } from "./localTime";

describe("localTime", () => {
  it("formats without zone", () => {
    const d = new Date(2026, 8, 22, 14, 5);
    expect(dayKeyOf(d)).toBe("2026-09-22");
    expect(localIso(d)).toBe("2026-09-22T14:05");
  });
  it("reads the day and clock back out of a stored start", () => {
    expect(dayOf("2026-09-22T14:30")).toBe("2026-09-22");
    expect(clockOf("2026-09-22T14:30")).toBe("2:30 PM");
    expect(clockOf("2026-09-22T00:10")).toBe("12:10 AM");
    expect(clockOf("2026-09-22")).toBe("");
  });
  it("adds days across a month end", () => {
    expect(addDays("2026-09-29", 3)).toBe("2026-10-02");
  });
});
