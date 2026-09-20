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
  /** Intake (PLAN.md 4.20): senders this person approved for the inbox scan. Addresses or domains. */
  intake?: { senders: string[]; lastScanAt?: Timestamp | null };
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
  household: { id: string; title: string; start: string; end: string; allDay: boolean; kind: EventKind; memberIds: string[]; location?: string }[];
  bills?: { id: string; name: string; amount: number; currency: string; nextDue: string; cadence: BillCadence; who: string }[];
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
  counts: { events: number; unread: number; tasks: number; bills?: number; review?: number };
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

export type EventKind = "event" | "bill" | "birthday" | "renewal" | "trip" | "school";

/**
 * households/{hid}/events/{id}: the household's own calendar. `start`/`end`
 * are YYYY-MM-DD for all-day, else YYYY-MM-DDTHH:mm in the HOUSEHOLD's zone
 * with no offset, so a lexical range on the day key works and the family
 * reads one wall clock.
 */
export interface EventDoc {
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
export type SuggestionSource = "gemini" | "laptop" | "rule" | "scan" | "forward";

/** households/{hid}/suggestions/{id}: machines propose, people confirm. */
export interface SuggestionDoc {
  kind: SuggestionKind;
  source: SuggestionSource;
  /** One line for the Review screen. */
  summary: string;
  /** Kind-specific; the client applies it through the normal service on accept. */
  payload: Record<string, unknown>;
  status: "pending" | "accepted" | "dismissed";
  visibility: Visibility;
  ownerUid: string;
  createdAt: Timestamp;
  resolvedAt: Timestamp | null;
  resolvedBy: string | null;
}

export type AccountType = "chequing" | "savings" | "credit" | "cash" | "loan";

/** households/{hid}/accounts/{id} */
export interface AccountDoc {
  name: string;
  type: AccountType;
  currency: string;
  visibility: Visibility;
  ownerUid: string;
  /** Last known balance, entered or imported. Optional. */
  balance?: number | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** households/{hid}/transactions/{id}. amount is positive; direction says which way. */
export interface TransactionDoc {
  amount: number;
  direction: "expense" | "income";
  /** YYYY-MM-DD */
  date: string;
  merchant: string;
  category: string;
  taxCategory: string;
  accountId: string | null;
  businessId: string | null;
  receiptPath: string | null;
  notes: string;
  visibility: Visibility;
  ownerUid: string;
  source: "portal" | "receipt" | "import" | "cli";
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** households/{hid}/settings/budget */
export interface BudgetDoc {
  /** category -> monthly amount */
  envelopes: Record<string, number>;
  updatedAt: Timestamp;
}

export type BillCadence = "weekly" | "monthly" | "quarterly" | "yearly" | "once";

/**
 * households/{hid}/bills/{id}: recurring money out, subscriptions included
 * (PLAN.md 4.5). `responsibleUid` is the load ledger (4.23): which adult
 * carries it. `nextDue` rolls forward by cadence once it has passed.
 */
export interface BillDoc {
  name: string;
  amount: number;
  currency: string;
  cadence: BillCadence;
  /** YYYY-MM-DD */
  nextDue: string;
  accountId: string | null;
  category: string;
  responsibleUid: string | null;
  autopay: boolean;
  notes: string;
  visibility: Visibility;
  ownerUid: string;
  source: "portal" | "cli" | "intake";
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
