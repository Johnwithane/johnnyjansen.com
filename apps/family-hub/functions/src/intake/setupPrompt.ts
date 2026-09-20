import { z } from "zod";
import type { MailMeta } from "../google/gmail";

// The wizard's "What we found" (PLAN.md 4.19 step 4): one Gemini pass over
// 90 days of senders and subjects, grouped into what the app can hold.
// Pure. The callable feeds it metadata and writes what comes back to the
// suggestions queue; nothing is real until it is ticked.

const nstr = z.preprocess((v) => (typeof v === "string" ? v : ""), z.string());
const nnum = z.preprocess((v) => {
  if (typeof v === "number" && isFinite(v)) return v;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(/[^0-9.\-]/g, ""));
    return isFinite(n) ? n : 0;
  }
  return 0;
}, z.number());
const arr = <T extends z.ZodTypeAny>(item: T) => z.preprocess((v) => (Array.isArray(v) ? v.filter((x) => x && typeof x === "object") : []), z.array(item));

export const SetupFound = z.object({
  bills: arr(z.object({ name: nstr, amount: nnum, cadence: nstr, day: nnum, sender: nstr })),
  accounts: arr(z.object({ name: nstr, type: nstr, sender: nstr })),
  bookings: arr(z.object({ title: nstr, date: nstr, time: nstr, location: nstr, sender: nstr })),
  clients: arr(z.object({ name: nstr, email: nstr })),
});
export type SetupFound = z.infer<typeof SetupFound>;

/** Collapse the mailbox to one line per (sender, subject shape): the model sees patterns, not 800 lines. */
export function condense(items: MailMeta[], max = 350): string[] {
  const seen = new Map<string, { line: string; n: number; days: string[] }>();
  for (const m of items) {
    const subj = m.subject.replace(/\d[\d,.$#-]*/g, "#").replace(/\s+/g, " ").trim().slice(0, 80);
    const key = `${m.from.toLowerCase()}|${subj.toLowerCase()}`;
    const cur = seen.get(key);
    if (cur) {
      cur.n++;
      if (cur.days.length < 4) cur.days.push(m.day);
    } else seen.set(key, { line: `${m.from} | ${m.subject.slice(0, 80)}`, n: 1, days: [m.day] });
  }
  return [...seen.values()]
    .sort((a, b) => b.n - a.n)
    .slice(0, max)
    .map((v) => `${v.days[0]}${v.n > 1 ? ` (x${v.n}: ${v.days.slice(1).join(", ")})` : ""} | ${v.line}`);
}

export function setupPrompt(today: string, lines: string[], already: { bills: string[]; accounts: string[] }): string {
  return [
    "You read a LIST of email senders and subjects (no bodies) from a family's inbox over the last 90 days, one per line: day (repeat count and other days) | from | subject.",
    "Group what the family is paying for and dealing with. Return ONLY compact minified JSON of exactly this shape:",
    '{"bills":[{"name":string,"amount":number,"cadence":"monthly|yearly|weekly|quarterly","day":number,"sender":string}],"accounts":[{"name":string,"type":"chequing|savings|credit|cash|loan","sender":string}],"bookings":[{"title":string,"date":"YYYY-MM-DD","time":"HH:MM","location":string,"sender":string}],"clients":[{"name":string,"email":string}]}',
    `- Today is ${today}.`,
    "- bills: recurring services and subscriptions a bill or receipt arrives for (streaming, phone, hydro, internet, insurance, gym, rent, daycare, software). name = the service in plain words. amount only if a subject states it, else 0. day = the day of month it usually arrives (1-28) from the dates, else 0. cadence from how often it repeats.",
    "- accounts: banks and card issuers that send statements or alerts. name = bank + product in plain words (TD chequing, Amex card). type from the product.",
    "- bookings: upcoming appointments, flights, hotels, reservations, classes with a date in the FUTURE (after today). Skip anything past.",
    "- clients: people or companies this person has SENT invoices to, or who paid them, if the subjects show it. Else [].",
    already.bills.length ? `- Already set up, do not repeat: bills ${already.bills.join(", ")}.` : "",
    already.accounts.length ? `- Already set up, do not repeat: accounts ${already.accounts.join(", ")}.` : "",
    "- One entry per real thing: a service that emails weekly is ONE bill. Skip newsletters, marketing, shipping updates, social, and one-off purchases.",
    "- Never invent an amount or a date. Unknown: 0 or \"\". At most 25 bills, 10 accounts, 15 bookings, 10 clients.",
    "",
    lines.join("\n"),
  ]
    .filter((l) => l !== "")
    .join("\n");
}

export interface FoundProposal {
  kind: "bill" | "account" | "event" | "contact";
  summary: string;
  payload: Record<string, unknown>;
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const TYPES = ["chequing", "savings", "credit", "cash", "loan"];
const CADENCES = ["monthly", "yearly", "weekly", "quarterly"];

function nextDueFrom(today: string, dayOfMonth: number): string {
  const [y, m] = today.split("-").map(Number);
  const d = Math.min(Math.max(1, Math.round(dayOfMonth) || 1), 28);
  const thisMonth = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  if (thisMonth >= today) return thisMonth;
  const nm = m === 12 ? 1 : m + 1;
  const ny = m === 12 ? y + 1 : y;
  return `${ny}-${String(nm).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Model groups → suggestions. Drops empties, dupes and anything already set up. */
export function toFoundProposals(found: SetupFound, today: string, already: { bills: string[]; accounts: string[] }): FoundProposal[] {
  const out: FoundProposal[] = [];
  const seen = new Set<string>(already.bills.map((b) => `bill:${norm(b)}`).concat(already.accounts.map((a) => `account:${norm(a)}`)));
  const take = (key: string) => {
    if (!key.split(":")[1] || seen.has(key)) return false;
    seen.add(key);
    return true;
  };
  for (const b of found.bills.slice(0, 25)) {
    const name = b.name.trim().slice(0, 120);
    if (!take(`bill:${norm(name)}`)) continue;
    const cadence = CADENCES.includes(b.cadence.trim().toLowerCase()) ? b.cadence.trim().toLowerCase() : "monthly";
    const amount = Math.round(Math.abs(b.amount) * 100) / 100;
    out.push({
      kind: "bill",
      summary: `${name}${amount ? `, $${amount.toFixed(2)}` : ""} ${cadence}${b.day ? `, around the ${Math.round(b.day)}th` : ""}`,
      payload: { name, amount, cadence, nextDue: nextDueFrom(today, b.day), category: "subscriptions", notes: b.sender ? `From ${b.sender.slice(0, 120)}` : "", setupScan: true },
    });
  }
  for (const a of found.accounts.slice(0, 10)) {
    const name = a.name.trim().slice(0, 80);
    if (!take(`account:${norm(name)}`)) continue;
    const type = TYPES.includes(a.type.trim().toLowerCase()) ? a.type.trim().toLowerCase() : "chequing";
    out.push({ kind: "account", summary: `${name} (${type})`, payload: { name, type, setupScan: true } });
  }
  for (const e of found.bookings.slice(0, 15)) {
    const title = e.title.trim().slice(0, 200);
    if (!DAY.test(e.date) || e.date < today || !take(`event:${norm(title)}${e.date}`)) continue;
    const time = /^\d{2}:\d{2}$/.test(e.time) ? e.time : "";
    out.push({
      kind: "event",
      summary: `${title}, ${e.date}${time ? ` at ${time}` : ""}`,
      payload: { title, start: time ? `${e.date}T${time}` : e.date, end: time ? `${e.date}T${time}` : e.date, allDay: !time, kind: "event", memberIds: [], location: e.location.trim().slice(0, 300), notes: e.sender ? `From ${e.sender.slice(0, 120)}` : "", setupScan: true },
    });
  }
  for (const c of found.clients.slice(0, 10)) {
    const name = c.name.trim().slice(0, 120);
    if (!take(`contact:${norm(name)}`)) continue;
    out.push({ kind: "contact", summary: `${name}${c.email ? `, ${c.email.trim()}` : ""} (client)`, payload: { name, email: c.email.trim().slice(0, 120), role: "client", setupScan: true } });
  }
  return out;
}
