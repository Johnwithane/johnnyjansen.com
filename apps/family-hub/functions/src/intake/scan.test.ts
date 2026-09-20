import { describe, expect, it } from "vitest";
import { scanQuery } from "./scan";

describe("scanQuery", () => {
  it("ORs approved senders and keeps to the last week, never trash or spam", () => {
    expect(scanQuery(["school@example.org", "kelownaswim.ca"])).toBe("(from:school@example.org OR from:kelownaswim.ca) newer_than:7d -in:trash -in:spam");
  });
  it("strips characters that could alter the query", () => {
    expect(scanQuery(["a@b.co OR is:anything"])).toBe("(from:a@b.coORis:anything) newer_than:7d -in:trash -in:spam".replace("from:a@b.coORis:anything", "from:a@b.coORisanything"));
  });
});
