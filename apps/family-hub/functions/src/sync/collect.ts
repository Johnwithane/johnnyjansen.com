import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { logger } from "firebase-functions/v2";
import { db } from "../lib/admin";
import { dayBounds, dayKey } from "../lib/dates";
import { googleClientsFor } from "../google/client";
import { listEvents } from "../google/calendar";
import { listUnread } from "../google/gmail";
import type { EventDoc, EventItem, MailItem, SnapshotDoc, TaskDoc, TaskItem } from "../types";

export interface Person {
  uid: string;
  hid: string;
  timeZone: string;
  calendarIds: string[];
  familyCalendarIds: string[];
  name: string;
  colour: string;
}

export interface HouseholdEventItem {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  kind: EventDoc["kind"];
  memberIds: string[];
  location?: string;
}

export interface Collected {
  dayKey: string;
  timeZone: string;
  events: EventItem[];
  /** The household's own calendar for the day (bills, birthdays, intake events). */
  household: HouseholdEventItem[];
  unread: MailItem[];
  unreadTotal: number;
  tasks: TaskItem[];
  sources: SnapshotDoc["sources"];
}

/**
 * Open tasks this person can see: the household's shared ones plus their own
 * private ones. Two queries because Firestore has no OR across fields; the
 * rules enforce the same split for the browser.
 */
export async function openTasksFor(p: Person): Promise<TaskItem[]> {
  const col = db.collection("households").doc(p.hid).collection("tasks");
  const [shared, mine] = await Promise.all([
    col.where("done", "==", false).where("visibility", "==", "household").limit(100).get(),
    col.where("done", "==", false).where("ownerUid", "==", p.uid).where("visibility", "==", "private").limit(100).get(),
  ]);
  const items: TaskItem[] = [...shared.docs, ...mine.docs].map((d) => {
    const t = d.data() as TaskDoc;
    return {
      id: d.id,
      title: t.title,
      due: t.due ?? null,
      visibility: t.visibility,
      assigneeUid: t.assigneeUid ?? null,
      createdAt: t.createdAt?.toDate?.().toISOString() ?? "",
    };
  });
  // Oldest first: the ones that have waited longest lead.
  return items.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** Household events whose start falls on `key` (lexical on the day prefix). */
export async function householdEventsOn(hid: string, key: string): Promise<HouseholdEventItem[]> {
  const snap = await db
    .collection("households")
    .doc(hid)
    .collection("events")
    .where("start", ">=", key)
    .where("start", "<", `${key}~`)
    .limit(100)
    .get();
  return snap.docs
    .map((d) => {
      const e = d.data() as EventDoc;
      return { id: d.id, title: e.title, start: e.start, end: e.end, allDay: e.allDay, kind: e.kind, memberIds: e.memberIds ?? [], ...(e.location ? { location: e.location } : {}) };
    })
    .sort((a, b) => (a.allDay !== b.allDay ? (a.allDay ? -1 : 1) : a.start.localeCompare(b.start)));
}

/** One pull of everything "today" is made of for one person. */
export async function collectToday(p: Person, now: Date): Promise<Collected> {
  const key = dayKey(now, p.timeZone);
  const { start, end } = dayBounds(now, p.timeZone);
  const [tasks, household] = await Promise.all([openTasksFor(p), householdEventsOn(p.hid, key)]);

  let events: EventItem[] = [];
  let unread: MailItem[] = [];
  let unreadTotal = 0;
  let google: SnapshotDoc["sources"]["google"] = "unconfigured";

  const clients = await googleClientsFor(p.uid);
  if (clients) {
    try {
      events = await listEvents(clients.calendar, start, end, p.calendarIds);
      const mail = await listUnread(clients.gmail, 15);
      unread = mail.items;
      unreadTotal = mail.total;
      google = "ok";
    } catch (err) {
      logger.error("collect: google failed", { uid: p.uid, err });
      google = "error";
    }
  }

  return { dayKey: key, timeZone: p.timeZone, events, household, unread, unreadTotal, tasks, sources: { google } };
}

/**
 * Write the person's private snapshot, and their slice of the family agenda:
 * only events from calendars they marked as family. Their private calendars
 * never leave users/{uid}.
 */
export async function storeSnapshot(p: Person, c: Collected): Promise<void> {
  const doc: Omit<SnapshotDoc, "generatedAt"> & { generatedAt: FieldValue | Timestamp } = {
    ...c,
    generatedAt: FieldValue.serverTimestamp(),
  };
  const family = c.events.filter((e) => p.familyCalendarIds.includes(e.calendarId));
  const batch = db.batch();
  batch.set(db.collection("users").doc(p.uid).collection("snapshots").doc("today"), doc);
  batch.set(db.collection("households").doc(p.hid).collection("agenda").doc(p.uid), {
    uid: p.uid,
    name: p.name,
    colour: p.colour,
    dayKey: c.dayKey,
    events: family,
    generatedAt: FieldValue.serverTimestamp(),
  });
  await batch.commit();
}
