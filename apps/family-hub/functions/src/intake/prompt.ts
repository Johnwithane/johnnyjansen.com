import { z } from "zod";

// What the inbox scan may propose (PLAN.md 4.20). The vocabulary is the
// app's own, so the model can only propose things the app can hold. Pure:
// no Firestore, no Gmail. The scan feeds it text and writes what comes back
// to the suggestions queue.

export const INTAKE_KINDS = ["event", "task", "bill", "contact", "document"] as const;
export type IntakeKind = (typeof INTAKE_KINDS)[number];

const nstr = z.preprocess((v) => (typeof v === "string" ? v : ""), z.string());
const nnum = z.preprocess((v) => {
  if (typeof v === "number" && isFinite(v)) return v;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(/[^0-9.\-]/g, ""));
    return isFinite(n) ? n : 0;
  }
  return 0;
}, z.number());

export const IntakeItem = z.object({
  kind: nstr,
  title: nstr,
  /** YYYY-MM-DD for events and due days. */
  date: nstr,
  /** HH:MM, events only. */
  time: nstr,
  endTime: nstr,
  amount: nnum,
  cadence: nstr,
  /** A household member's first name, or "". */
  forWhom: nstr,
  location: nstr,
  notes: nstr,
});
export type IntakeItem = z.infer<typeof IntakeItem>;

export const IntakeOut = z.object({
  items: z.preprocess((v) => (Array.isArray(v) ? v.filter((x) => x && typeof x === "object") : []), z.array(IntakeItem)),
});

export interface MemberRef {
  id: string;
  name: string;
  role: "adult" | "child";
}

export function intakePrompt(today: string, members: MemberRef[]): string {
  return [
    "You read ONE email a family forwarded or approved for their planner. Propose what it contains, nothing more.",
    "Return ONLY compact minified JSON of exactly this shape:",
    '{"items":[{"kind":"event|task|bill|contact|document","title":string,"date":"YYYY-MM-DD","time":"HH:MM","endTime":"HH:MM","amount":number,"cadence":"once|monthly|yearly","forWhom":string,"location":string,"notes":string}]}',
    `- Today is ${today}. Dates in the email that name only a weekday or a month and day are the NEXT such date. Unknown: "".`,
    "- event: something at a time or on a day (a field trip, a concert, a dentist appointment, a deadline day). date required; time and endTime only if given.",
    "- task: something the family must DO (sign a form, bring boots, RSVP, register). date = the day it is due, or \"\".",
    "- bill: money owed with an amount (hot lunch $5, a $120 registration fee, an invoice). amount required; date = due day; cadence once unless the email says it repeats.",
    "- contact: a NEW person with a role worth saving (a new teacher, a coach, a sitter). title = name, notes = role and how to reach them.",
    "- document: an attachment or record worth filing (a report card, a permission form, a policy). title = what it is.",
    `- forWhom: the household member it is about, exactly one of: ${members.map((m) => m.name).join(", ") || "(none)"}; else "".`,
    "- title: under 12 words, plain, no quotes around it. notes: one short sentence, or \"\".",
    "- Skip greetings, newsletters with nothing to do, ads, and anything already in the past. An email may yield zero items: return {\"items\":[]}.",
    "- Never invent a date, a time or an amount that is not in the email.",
  ].join("\n");
}

export interface MailRef {
  messageId: string;
  from: string;
  subject: string;
  /** ISO instant the message arrived. */
  date: string;
}

export interface Proposal {
  kind: IntakeKind;
  summary: string;
  payload: Record<string, unknown>;
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^\d{2}:\d{2}$/;

function dayLabel(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-CA", { month: "short", day: "numeric", timeZone: "UTC" });
}

function memberFor(name: string, members: MemberRef[]): MemberRef | null {
  const n = name.trim().toLowerCase();
  if (!n) return null;
  return members.find((m) => m.name.toLowerCase() === n) ?? members.find((m) => m.name.toLowerCase().startsWith(n) || n.startsWith(m.name.toLowerCase())) ?? null;
}

/** One model item → one suggestion, or null when it is not usable (no title, an event with no date, a bill with no amount). */
export function toProposal(item: IntakeItem, mail: MailRef, members: MemberRef[]): Proposal | null {
  const kind = item.kind.trim().toLowerCase();
  const title = item.title.trim().replace(/^["']|["']$/g, "").slice(0, 200);
  if (!title || !(INTAKE_KINDS as readonly string[]).includes(kind)) return null;
  const date = DAY.test(item.date) ? item.date : "";
  const time = TIME.test(item.time) ? item.time : "";
  const endTime = TIME.test(item.endTime) ? item.endTime : "";
  const who = memberFor(item.forWhom, members);
  const notes = item.notes.trim().slice(0, 500);
  // Headers are attacker-controlled (any sender on an approved domain) and
  // travel into payloads a person and a Claude Code session both read: cut
  // to a line, bounded, with link syntax flattened.
  const clean = (v: string, n: number) => v.replace(/[\r\n\t]+/g, " ").replace(/[\[\]()<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, n);
  const origin = { messageId: mail.messageId.slice(0, 64), from: clean(mail.from, 120), subject: clean(mail.subject, 200) };
  const whoTag = who ? ` (${who.name})` : "";

  switch (kind) {
    case "event": {
      if (!date) return null;
      const start = time ? `${date}T${time}` : date;
      const end = time ? `${date}T${endTime && endTime > time ? endTime : time}` : date;
      return {
        kind: "event",
        summary: `${title}, ${dayLabel(date)}${time ? ` at ${time}` : ""}${whoTag}`,
        payload: { title, start, end, allDay: !time, kind: who?.role === "child" ? "school" : "event", memberIds: who ? [who.id] : [], location: item.location.trim().slice(0, 300), notes, ...origin },
      };
    }
    case "task":
      return { kind: "task", summary: `${title}${date ? `, by ${dayLabel(date)}` : ""}${whoTag}`, payload: { title, due: date || null, notes, visibility: "household", ...origin } };
    case "bill": {
      const amount = Math.round(Math.abs(item.amount) * 100) / 100;
      if (!amount) return null;
      const cadence = ["monthly", "yearly"].includes(item.cadence.trim().toLowerCase()) ? item.cadence.trim().toLowerCase() : "once";
      return {
        kind: "bill",
        summary: `${title}, $${amount.toFixed(2)}${date ? ` due ${dayLabel(date)}` : ""}${cadence !== "once" ? ` (${cadence})` : ""}${whoTag}`,
        payload: { name: title, amount, nextDue: date, cadence, notes, ...origin },
      };
    }
    case "contact":
      return { kind: "contact", summary: `${title}${notes ? `, ${notes}` : ""}`, payload: { name: title, notes, ...origin } };
    case "document":
      return { kind: "document", summary: `${title}${whoTag}`, payload: { title, notes, memberIds: who ? [who.id] : [], ...origin } };
  }
  return null;
}
