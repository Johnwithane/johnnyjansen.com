import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { logger } from "firebase-functions/v2";
import { db } from "../lib/admin";
import { dayBounds, dayKey } from "../lib/dates";
import { googleClientsFor } from "../google/client";
import { listEvents } from "../google/calendar";
import { listUnread } from "../google/gmail";
import type { EventItem, MailItem, SnapshotDoc, TaskDoc, TaskItem } from "../types";

export interface Person {
  uid: string;
  hid: string;
  timeZone: string;
  calendarIds: string[];
  familyCalendarIds: string[];
  name: string;
  colour: string;
}

export interface Collected {
  dayKey: string;
  timeZone: string;
  events: EventItem[];
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

/** One pull of everything "today" is made of for one person. */
export async function collectToday(p: Person, now: Date): Promise<Collected> {
  const key = dayKey(now, p.timeZone);
  const { start, end } = dayBounds(now, p.timeZone);
  const tasks = await openTasksFor(p);

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

  return { dayKey: key, timeZone: p.timeZone, events, unread, unreadTotal, tasks, sources: { google } };
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
