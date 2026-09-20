// Firestore document shapes. Mirrored in portal/src/firebase/interfaces.ts
// (the browser can't import from functions/). Keep both in step.

import type { Timestamp } from "firebase-admin/firestore";

export type Role = "adult" | "child";
export type Visibility = "household" | "private";
export type TaskSource = "portal" | "cli" | "digest";

export interface MemberDoc {
  role: Role;
  name: string;
  colour: string;
  /** Adults only; null for a child record. */
  email: string | null;
  /** Adults who signed in; null for a child record until they do. */
  uid: string | null;
  /** YYYY-MM-DD or null. */
  birthDate: string | null;
}

export interface HouseholdDoc {
  name: string;
  timeZone: string;
  currency: string;
  country: string;
  plan: "free" | "pro";
  limits: { aiCallsPerDay: number; members: number };
  /** Keyed by uid for adults, `child_<id>` for children. */
  members: Record<string, MemberDoc>;
  memberUids: string[];
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface UserDoc {
  hid?: string;
  role?: Role;
  name: string;
  colour: string;
  email: string;
  timeZone?: string;
  digest?: { enabled: boolean; hour: number; minute: number };
  google?: { connected: boolean; email?: string | null; calendarIds: string[]; familyCalendarIds: string[] };
  setup?: { done: boolean };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface TaskDoc {
  title: string;
  done: boolean;
  doneAt?: Timestamp | null;
  due?: string | null;
  notes?: string;
  visibility: Visibility;
  ownerUid: string;
  assigneeUid?: string | null;
  source: TaskSource;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface EventItem {
  id: string;
  calendarId: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  location?: string;
  link?: string;
}

/**
 * One person's contribution to the family agenda: their events from the
 * calendars they marked as family. households/{hid}/agenda/{uid}. Readable
 * by the whole household, written by the sync only.
 */
export interface AgendaDoc {
  uid: string;
  name: string;
  colour: string;
  dayKey: string;
  events: EventItem[];
  generatedAt: Timestamp;
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
  visibility: Visibility;
  assigneeUid?: string | null;
  createdAt: string;
}

/** One person's pull of today. users/{uid}/snapshots/today. */
export interface SnapshotDoc {
  dayKey: string;
  timeZone: string;
  events: EventItem[];
  unread: MailItem[];
  unreadTotal: number;
  tasks: TaskItem[];
  sources: { google: "ok" | "unconfigured" | "error" };
  generatedAt: Timestamp;
}

/** One person's digest for a day. users/{uid}/digests/{dayKey}. */
export interface DigestDoc {
  dayKey: string;
  subject: string;
  text: string;
  html: string;
  counts: { events: number; unread: number; tasks: number };
  emailed: boolean;
  emailError?: string;
  generatedAt: Timestamp;
}

export type FeedbackType = "bug" | "idea" | "improvement";
export type FeedbackStatus = "open" | "triaged" | "in_progress" | "shipped" | "wontfix";

/** households/{hid}/feedback/{id}. reportId mirrors the doc id so CI can find it by collection group. */
export interface FeedbackDoc {
  reportId: string;
  type: FeedbackType;
  description: string;
  route: string;
  url: string;
  environment: string;
  appVersion: string;
  screenshotPaths: string[];
  status: FeedbackStatus;
  notes: string;
  reporterUid: string;
  reporterName: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  githubIssueNumber?: number | null;
  githubIssueUrl?: string | null;
  dispatchedAt?: Timestamp | null;
  shippedAt?: Timestamp | null;
  shippedVersion?: string | null;
}
