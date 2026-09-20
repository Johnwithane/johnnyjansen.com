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
    expect(d.counts).toEqual({ events: 0, unread: 0, tasks: 0, bills: 0, review: 0 });
    expect(d.text).not.toContain("MONEY");
    expect(d.text).not.toContain("REVIEW");
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

describe("family section", () => {
  it("lists household events with wall-clock times and kinds", () => {
    const d = buildDigest({
      ...base,
      family: [
        { title: "Rent", start: "2026-09-22", allDay: true, kind: "bill" },
        { title: "Dentist, Forest", start: "2026-09-22T14:30", allDay: false, kind: "event" },
      ],
    });
    expect(d.text).toContain("FAMILY");
    expect(d.text).toContain("- All day: Rent (bill)");
    expect(d.text).toContain("- 2:30 p.m.: Dentist, Forest");
  });
  it("omits the section when nothing is on", () => {
    expect(buildDigest({ ...base, family: [] }).text).not.toContain("FAMILY");
  });

  it("lists bills due this week with who carries them, and counts what waits on Review", () => {
    const d = buildDigest({
      ...base,
      today: "2026-09-19",
      money: [
        { name: "Rent", amount: 1850, nextDue: "2026-09-19", who: "Sam" },
        { name: "Hydro", amount: 92.4, nextDue: "2026-09-23", who: "" },
        { name: "Swim fee", amount: 60, nextDue: "2026-09-10", who: "Ali" },
      ],
      reviewCount: 3,
    });
    expect(d.subject).toContain("3 bills due, 3 to review");
    expect(d.text).toContain("MONEY (due this week)");
    expect(d.text).toContain("- today: Rent $1850.00 (Sam)");
    expect(d.text).toContain("- 09/23: Hydro $92.40");
    expect(d.text).toContain("- overdue: Swim fee $60.00 (Ali)");
    expect(d.text).toContain("REVIEW: 3 waiting at");
    expect(d.html).toContain("/review");
    expect(d.counts.bills).toBe(3);
  });
});

