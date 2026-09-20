import { describe, expect, it } from "vitest";
import { feedbackIdsFrom } from "./trailers";

describe("feedbackIdsFrom", () => {
  it("finds trailers across commits, deduped, ignoring prose", () => {
    const log = `Phase 2: fix grocery swipe

The swipe handler dropped the second item.

Feedback-Id: abc123
Feedback-Id: def-456

Other commit mentions Feedback-Id: in a sentence but not as a trailer.
feedback-id: lowercase does not count
Feedback-Id: abc123
`;
    expect(feedbackIdsFrom(log)).toEqual(["abc123", "def-456"]);
  });
  it("returns nothing for a log with no trailers", () => {
    expect(feedbackIdsFrom("just a commit\n")).toEqual([]);
  });
});
