import { describe, expect, it } from "vitest";
import { ago, dueLabel, senderName } from "./format";

describe("format", () => {
  it("senderName strips the address", () => {
    expect(senderName("Jane Doe <jane@example.com>")).toBe("Jane Doe");
    expect(senderName("jane@example.com")).toBe("jane@example.com");
  });

  it("dueLabel is blank for no date", () => {
    expect(dueLabel(null)).toBe("");
    expect(dueLabel("2026-09-20")).toMatch(/Sep/);
  });

  it("ago rounds sensibly", () => {
    const now = new Date("2026-09-19T12:00:00Z");
    expect(ago(new Date("2026-09-19T11:59:50Z"), now)).toBe("just now");
    expect(ago(new Date("2026-09-19T11:56:00Z"), now)).toBe("4 min ago");
    expect(ago(new Date("2026-09-19T09:00:00Z"), now)).toBe("3 h ago");
    expect(ago(new Date("2026-09-17T12:00:00Z"), now)).toBe("2 d ago");
    expect(ago(null, now)).toBe("");
  });
});
