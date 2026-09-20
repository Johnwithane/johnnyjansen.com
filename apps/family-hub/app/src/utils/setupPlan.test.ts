import { describe, expect, it } from "vitest";
import { planSetup } from "./setupPlan";

describe("planSetup", () => {
  it("founder with Google gets the full path", () => {
    expect(planSetup({ role: "adult", founder: true, googleConnected: true }).map((s) => s.id)).toEqual(["people", "google", "found", "money", "done"]);
  });
  it("an invited adult skips the household questions; no Google skips the scan", () => {
    expect(planSetup({ role: "adult", founder: false, googleConnected: false }).map((s) => s.id)).toEqual(["google", "money", "done"]);
  });
  it("a child never sees the wizard", () => {
    expect(planSetup({ role: "child", founder: false, googleConnected: true })).toEqual([]);
  });
});
