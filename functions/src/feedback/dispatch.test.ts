import { describe, expect, it } from "vitest";
import { issueBody } from "./dispatch";

describe("issueBody", () => {
  it("carries the trailer instruction and the environment as a details block", () => {
    const b = issueBody({ reportId: "r1", type: "bug", description: "Swipe drops items", route: "/tasks", environment: "iPhone 15\nSafari", appVersion: "abc123", notes: "", reporterName: "Carly" });
    expect(b).toContain("Feedback-Id: r1");
    expect(b).toContain("<details>");
    expect(b).toContain("reported by Carly on `/tasks`");
    expect(b).not.toContain("Triage notes");
  });
});
