import type { calendar_v3 } from "googleapis";
import type { EventItem } from "../types";

/**
 * Events from every calendar the account has selected, in [timeMin, timeMax).
 * Primary first, then the others, each sorted by start; declined events are
 * dropped because they are not the day.
 */
export async function listEvents(
  calendar: calendar_v3.Calendar,
  timeMin: Date,
  timeMax: Date,
  calendarIds: string[] = [],
): Promise<EventItem[]> {
  const list = await calendar.calendarList.list({ minAccessRole: "reader" });
  // The person's pick from setCalendars wins; with no pick, whatever they
  // have ticked in Google Calendar itself.
  const calendars = (list.data.items ?? []).filter((c) =>
    c.id && (calendarIds.length ? calendarIds.includes(c.id) : c.selected !== false),
  );
  const out: EventItem[] = [];
  for (const cal of calendars) {
    const res = await calendar.events.list({
      calendarId: cal.id!,
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 50,
    });
    for (const e of res.data.items ?? []) {
      if (e.status === "cancelled") continue;
      const me = (e.attendees ?? []).find((a) => a.self);
      if (me?.responseStatus === "declined") continue;
      const allDay = !!e.start?.date;
      out.push({
        id: e.id ?? `${cal.id}:${e.start?.dateTime ?? e.start?.date}`,
        calendarId: cal.id!,
        title: e.summary?.trim() || "(no title)",
        start: e.start?.dateTime ?? e.start?.date ?? "",
        end: e.end?.dateTime ?? e.end?.date ?? "",
        allDay,
        ...(e.location ? { location: e.location } : {}),
        ...(e.htmlLink ? { link: e.htmlLink } : {}),
      });
    }
  }
  // All-day first, then by start instant.
  return out.sort((a, b) => {
    if (a.allDay !== b.allDay) return a.allDay ? -1 : 1;
    return a.start.localeCompare(b.start);
  });
}
