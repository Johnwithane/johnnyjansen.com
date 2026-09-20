import type { Timestamp } from "firebase/firestore";

// Mirrors functions/src/types.ts. Keep both in step.

export type WithId<T> = T & { id: string };
export type Role = "adult" | "child";
export type Visibility = "household" | "private";
export type TaskSource = "portal" | "cli" | "digest";

export const PERSON_COLOURS = ["#37ff8b", "#7fd0ff", "#f5c56b", "#d3a5ff", "#ff9ab5", "#9ee8d0"] as const;
export type PersonColour = (typeof PERSON_COLOURS)[number];

export interface Member {
  role: Role;
  name: string;
  colour: string;
  email: string | null;
  uid: string | null;
  birthDate: string | null;
}

export interface Household {
  name: string;
  timeZone: string;
  currency: string;
  country: string;
  plan: "free" | "pro";
  limits: { aiCallsPerDay: number; members: number };
  members: Record<string, Member>;
  memberUids: string[];
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface UserProfile {
  hid?: string;
  role?: Role;
  name: string;
  colour: string;
  email: string;
  timeZone?: string;
  digest?: { enabled: boolean; hour: number; minute: number };
  google?: { connected: boolean; email?: string | null; calendarIds: string[]; familyCalendarIds: string[] };
  setup?: { done: boolean };
  legal?: { version: number; acceptedAt?: Timestamp };
}

export interface Task {
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

export interface Snapshot {
  dayKey: string;
  timeZone: string;
  events: EventItem[];
  household?: { id: string; title: string; start: string; end: string; allDay: boolean; kind: EventKind; memberIds: string[]; location?: string }[];
  unread: MailItem[];
  unreadTotal: number;
  tasks: TaskItem[];
  sources: { google: "ok" | "unconfigured" | "error" };
  generatedAt: Timestamp;
}

export interface Agenda {
  uid: string;
  name: string;
  colour: string;
  dayKey: string;
  events: EventItem[];
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

export type FeedbackType = "bug" | "idea" | "improvement";
export type FeedbackStatus = "open" | "triaged" | "in_progress" | "shipped" | "wontfix";

export interface Feedback {
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
  shippedAt?: Timestamp | null;
  shippedVersion?: string | null;
}

export type EventKind = "event" | "bill" | "birthday" | "renewal" | "trip" | "school";

/** households/{hid}/events. start/end are wall-clock strings: YYYY-MM-DD or YYYY-MM-DDTHH:mm. */
export interface HouseholdEvent {
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  kind: EventKind;
  memberIds: string[];
  location?: string;
  notes?: string;
  source: "portal" | "cli" | "intake" | "rule";
  ownerUid: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type SuggestionKind = "event" | "task" | "bill" | "transaction" | "contact" | "document" | "recipe" | "pantry";

export interface Suggestion {
  kind: SuggestionKind;
  source: "gemini" | "laptop" | "rule" | "scan" | "forward";
  summary: string;
  payload: Record<string, unknown>;
  status: "pending" | "accepted" | "dismissed";
  visibility: Visibility;
  ownerUid: string;
  createdAt: Timestamp;
  resolvedAt: Timestamp | null;
  resolvedBy: string | null;
}
