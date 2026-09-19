// Firestore document shapes. Mirrored in portal/src/firebase/interfaces.ts
// (the browser can't import from functions/). Keep both in step.

export type TaskSource = "portal" | "cli" | "digest";

export interface TaskDoc {
  title: string;
  done: boolean;
  doneAt?: FirebaseFirestore.Timestamp | null;
  /** YYYY-MM-DD, optional. */
  due?: string | null;
  notes?: string;
  source: TaskSource;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

/** A calendar event as the digest and the portal see it. */
export interface EventItem {
  id: string;
  title: string;
  /** ISO instant, or YYYY-MM-DD when allDay. */
  start: string;
  end: string;
  allDay: boolean;
  location?: string;
  link?: string;
}

/** An unread email thread, trimmed to what a digest needs. */
export interface MailItem {
  id: string;
  threadId: string;
  from: string;
  subject: string;
  snippet: string;
  /** ISO instant. */
  date: string;
}

export interface TaskItem {
  id: string;
  title: string;
  due?: string | null;
  createdAt: string;
}

/** What one sync of Google + tasks produced. Stored at snapshots/today. */
export interface SnapshotDoc {
  dayKey: string;
  timeZone: string;
  events: EventItem[];
  unread: MailItem[];
  unreadTotal: number;
  tasks: TaskItem[];
  /** Which sources actually answered. Google is null until its secrets are set. */
  sources: { google: "ok" | "unconfigured" | "error" };
  generatedAt: FirebaseFirestore.Timestamp;
}

/** One day's digest. Stored at digests/{dayKey}. */
export interface DigestDoc {
  dayKey: string;
  subject: string;
  text: string;
  html: string;
  counts: { events: number; unread: number; tasks: number };
  emailed: boolean;
  emailError?: string;
  generatedAt: FirebaseFirestore.Timestamp;
}
