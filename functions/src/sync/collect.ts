import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { logger } from "firebase-functions/v2";
import { db } from "../lib/admin";
import { dayBounds, dayKey } from "../lib/dates";
import { googleClients } from "../google/client";
import { listEvents } from "../google/calendar";
import { listUnread } from "../google/gmail";
import type { EventItem, MailItem, SnapshotDoc, TaskDoc, TaskItem } from "../types";

export interface Collected {
  dayKey: string;
  timeZone: string;
  events: EventItem[];
  unread: MailItem[];
  unreadTotal: number;
  tasks: TaskItem[];
  sources: SnapshotDoc["sources"];
}

/** Open tasks, oldest first (the ones that have waited longest lead). */
export async function openTasks(): Promise<TaskItem[]> {
  const snap = await db.collection("tasks").where("done", "==", false).orderBy("createdAt", "asc").limit(100).get();
  return snap.docs.map((d) => {
    const t = d.data() as TaskDoc;
    return {
      id: d.id,
      title: t.title,
      due: t.due ?? null,
      createdAt: t.createdAt?.toDate?.().toISOString() ?? "",
    };
  });
}

/**
 * One pull of everything "today" is made of: calendar, unread inbox, open
 * tasks. Google is optional; when its secrets are missing the snapshot still
 * writes with `sources.google = "unconfigured"` so the portal can say so.
 */
export async function collectToday(now: Date, timeZone: string): Promise<Collected> {
  const key = dayKey(now, timeZone);
  const { start, end } = dayBounds(now, timeZone);
  const tasks = await openTasks();

  let events: EventItem[] = [];
  let unread: MailItem[] = [];
  let unreadTotal = 0;
  let google: SnapshotDoc["sources"]["google"] = "unconfigured";

  const clients = googleClients();
  if (clients) {
    try {
      events = await listEvents(clients.calendar, start, end);
      const mail = await listUnread(clients.gmail, 15);
      unread = mail.items;
      unreadTotal = mail.total;
      google = "ok";
    } catch (err) {
      logger.error("collect: google failed", { err });
      google = "error";
    }
  }

  return { dayKey: key, timeZone, events, unread, unreadTotal, tasks, sources: { google } };
}

/** Write the collected day to snapshots/today for the portal. */
export async function storeSnapshot(c: Collected): Promise<void> {
  const doc: Omit<SnapshotDoc, "generatedAt"> & { generatedAt: FieldValue | Timestamp } = {
    ...c,
    generatedAt: FieldValue.serverTimestamp(),
  };
  await db.collection("snapshots").doc("today").set(doc);
}
