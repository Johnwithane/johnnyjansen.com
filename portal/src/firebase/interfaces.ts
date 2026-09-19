import type { Timestamp } from "firebase/firestore";

// Mirrors functions/src/types.ts. Keep both in step.

export type WithId<T> = T & { id: string };

export type TaskSource = "portal" | "cli" | "digest";

export interface Task {
  title: string;
  done: boolean;
  doneAt?: Timestamp | null;
  due?: string | null;
  notes?: string;
  source: TaskSource;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface EventItem {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  location?: string;
  link?: string;
}

export interface MailItem {
  id: string;
  threadId: string;
  from: string;
  subject: string;
  snippet: string;
  date: string;
}

export interface TaskItem {
  id: string;
  title: string;
  due?: string | null;
  createdAt: string;
}

export interface Snapshot {
  dayKey: string;
  timeZone: string;
  events: EventItem[];
  unread: MailItem[];
  unreadTotal: number;
  tasks: TaskItem[];
  sources: { google: "ok" | "unconfigured" | "error" };
  generatedAt: Timestamp;
}

export interface Digest {
  dayKey: string;
  subject: string;
  text: string;
  html: string;
  counts: { events: number; unread: number; tasks: number };
  emailed: boolean;
  emailError?: string;
  generatedAt: Timestamp;
}
