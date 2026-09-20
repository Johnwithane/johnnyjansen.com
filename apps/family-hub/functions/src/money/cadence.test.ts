import { describe, expect, it } from "vitest";
import { advanceDue, rollForward } from "./cadence";

describe("advanceDue", () => {
  it("keeps the day of month and clamps to short months", () => {
    expect(advanceDue("2026-01-31", "monthly")).toBe("2026-02-28");
    expect(advanceDue("2026-03-15", "monthly")).toBe("2026-04-15");
    expect(advanceDue("2026-11-30", "quarterly")).toBe("2027-02-28");
    expect(advanceDue("2024-02-29", "yearly")).toBe("2025-02-28");
  });
  it("weekly adds seven days across a month end; once never moves", () => {
    expect(advanceDue("2026-09-28", "weekly")).toBe("2026-10-05");
    expect(advanceDue("2026-09-28", "once")).toBe("2026-09-28");
  });
});

describe("rollForward", () => {
  it("advances a past due day to the first on or after today", () => {
    expect(rollForward("2026-06-01", "monthly", "2026-09-20")).toBe("2026-10-01");
    expect(rollForward("2026-09-20", "monthly", "2026-09-20")).toBe("2026-09-20");
    expect(rollForward("2025-01-01", "yearly", "2026-09-20")).toBe("2027-01-01");
  });
  it("a one-off stays overdue rather than moving", () => {
    expect(rollForward("2026-09-01", "once", "2026-09-20")).toBe("2026-09-01");
  });
});
