import { describe, expect, it } from "vitest";
import { ME_ACTIONS, MeBody } from "./schema";

describe("MeBody", () => {
  it("lists every action once", () => {
    expect(new Set(ME_ACTIONS).size).toBe(ME_ACTIONS.length);
    expect(ME_ACTIONS).toContain("today");
    expect(ME_ACTIONS).toContain("tasks.add");
    expect(ME_ACTIONS).toContain("digest.run");
    expect(ME_ACTIONS).toContain("feedback.triage");
  });

  it("fills defaults", () => {
    expect(MeBody.parse({ action: "calendar" })).toEqual({ action: "calendar", days: 7 });
    expect(MeBody.parse({ action: "tasks.list" })).toEqual({ action: "tasks.list", done: false });
  });

  it("rejects a blank task title and a malformed due date", () => {
    expect(() => MeBody.parse({ action: "tasks.add", title: "   " })).toThrow();
    expect(() => MeBody.parse({ action: "tasks.add", title: "x", due: "tomorrow" })).toThrow();
    expect(MeBody.parse({ action: "tasks.add", title: "  Call bank ", due: "2026-09-20" })).toEqual({
      action: "tasks.add",
      title: "Call bank",
      due: "2026-09-20",
      visibility: "household",
    });
  });

  it("rejects unknown actions", () => {
    expect(() => MeBody.parse({ action: "rm -rf" })).toThrow();
  });
});
