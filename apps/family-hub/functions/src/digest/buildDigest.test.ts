import { describe, expect, it } from "vitest";
import { buildDigest, senderName, type DigestInput } from "./buildDigest";

const base: DigestInput = {
  dayLabel: "Saturday, September 19",
  timeZone: "America/Vancouver",
  events: [],
  unread: [],
  unreadTotal: 0,
  tasks: [],
  googleConnected: true,
  portalUrl: "https://example.com/app",
};

describe("buildDigest", () => {
  it("says so when there is nothing, rather than printing empty lists", () => {
    const d = buildDigest(base);
    expect(d.subject).toBe("Saturday, September 19: 0 events, 0 unread, 0 tasks");
    expect(d.text).toContain("Nothing on the calendar.");
    expect(d.text).toContain("Inbox zero.");
    expect(d.text).toContain("No open tasks.");
    expect(d.counts).toEqual({ events: 0, unread: 0, tasks: 0 });
  });

  it("lists events with local times, all-day first", () => {
    const d = buildDigest({
      ...base,
      events: [
        { id: "1", calendarId: "primary", title: "Standup", start: "2026-09-19T16:30:00Z", end: "2026-09-19T17:00:00Z", allDay: false, location: "Zoom" },
        { id: "2", calendarId: "primary", title: "Kelowna", start: "2026-09-19", end: "2026-09-20", allDay: true },
      ],
    });
    expect(d.text).toContain("- All day: Kelowna");
    expect(d.text).toContain("- 9:30 a.m. to 10:00 a.m.: Standup (Zoom)");
    expect(d.subject).toContain("2 events");
  });

  it("is honest when more is unread than it shows", () => {
    const d = buildDigest({
      ...base,
      unreadTotal: 23,
      unread: [
        { id: "a", threadId: "a", from: "Jane Doe <jane@example.com>", subject: "Invoice", snippet: "Hi Johnny", date: "" },
      ],
    });
    expect(d.text).toContain("INBOX (23 unread, newest 1)");
    expect(d.text).toContain("- Jane Doe: Invoice");
    expect(d.subject).toContain("23 unread");
  });

  it("escapes HTML from mail subjects", () => {
    const d = buildDigest({
      ...base,
      unreadTotal: 1,
      unread: [{ id: "a", threadId: "a", from: "x@y.z", subject: "<script>alert(1)</script>", snippet: "", date: "" }],
    });
    expect(d.html).not.toContain("<script>");
    expect(d.html).toContain("&lt;script&gt;");
  });

  it("tells the truth when Google is not connected", () => {
    const d = buildDigest({ ...base, googleConnected: false });
    expect(d.text).toContain("Google not connected yet.");
    expect(d.text).not.toContain("Inbox zero.");
  });

  it("shows due dates on tasks", () => {
    const d = buildDigest({
      ...base,
      tasks: [
        { id: "t1", title: "Call the bank", due: "2026-09-20", createdAt: "" },
        { id: "t2", title: "Renew passport", createdAt: "" },
      ],
    });
    expect(d.text).toContain("- Call the bank (due 2026-09-20)");
    expect(d.text).toContain("- Renew passport");
    expect(d.subject).toContain("2 tasks");
  });
});

describe("senderName", () => {
  it("strips the address", () => {
    expect(senderName("Jane Doe <jane@example.com>")).toBe("Jane Doe");
    expect(senderName('"Doe, Jane" <jane@example.com>')).toBe("Doe, Jane");
    expect(senderName("jane@example.com")).toBe("jane@example.com");
  });
});
