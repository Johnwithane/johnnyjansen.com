import { clockLabel, timeLabel } from "../lib/dates";
import type { EventItem, MailItem, TaskItem } from "../types";

// The daily digest, as pure functions over plain data. Nothing here reads
// Firestore or Google, which is what makes it testable and what keeps the
// email honest: it can only describe what the collector handed it.

export interface FamilyLine {
  title: string;
  /** YYYY-MM-DD or YYYY-MM-DDTHH:mm, household wall clock. */
  start: string;
  allDay: boolean;
  kind: string;
}

export interface MoneyLine {
  name: string;
  amount: number;
  /** YYYY-MM-DD */
  nextDue: string;
  who: string;
}

export interface DigestInput {
  dayLabel: string;
  timeZone: string;
  events: EventItem[];
  /** The household calendar for the day; empty array when nothing is on. */
  family?: FamilyLine[];
  /** Bills due in the next week; empty when nothing is due. */
  money?: MoneyLine[];
  /** Suggestions waiting on Review. */
  reviewCount?: number;
  /** YYYY-MM-DD in the person's zone, to label a due day as today or overdue. */
  today?: string;
  unread: MailItem[];
  unreadTotal: number;
  tasks: TaskItem[];
  googleConnected: boolean;
  /** Where the portal lives, for the footer link. */
  portalUrl: string;
}

export interface Digest {
  subject: string;
  text: string;
  html: string;
  counts: { events: number; unread: number; tasks: number; bills: number; review: number };
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** "Jane Doe <jane@x.com>" → "Jane Doe"; bare addresses stay as they are. */
export function senderName(from: string): string {
  const m = from.match(/^\s*"?([^"<]*?)"?\s*<[^>]+>\s*$/);
  const name = m?.[1]?.trim();
  return name || from.trim();
}

function eventLine(e: EventItem, tz: string): string {
  if (e.allDay) return `All day: ${e.title}`;
  const when = `${timeLabel(e.start, tz)} to ${timeLabel(e.end, tz)}`;
  return e.location ? `${when}: ${e.title} (${e.location})` : `${when}: ${e.title}`;
}

function taskLine(t: TaskItem): string {
  return t.due ? `${t.title} (due ${t.due})` : t.title;
}

export function subjectFor(input: DigestInput): string {
  const { counts } = countsFor(input);
  const bits = [
    `${counts.events} event${counts.events === 1 ? "" : "s"}`,
    `${counts.unread} unread`,
    `${counts.tasks} task${counts.tasks === 1 ? "" : "s"}`,
    ...(counts.bills ? [`${counts.bills} bill${counts.bills === 1 ? "" : "s"} due`] : []),
    ...(counts.review ? [`${counts.review} to review`] : []),
  ];
  return `${input.dayLabel}: ${bits.join(", ")}`;
}

function countsFor(input: DigestInput): { counts: Digest["counts"] } {
  return {
    counts: {
      events: input.events.length,
      unread: input.unreadTotal || input.unread.length,
      tasks: input.tasks.length,
      bills: (input.money ?? []).length,
      review: input.reviewCount ?? 0,
    },
  };
}

function moneyLine(m: MoneyLine, today: string): string {
  const when = m.nextDue < today ? "overdue" : m.nextDue === today ? "today" : m.nextDue.slice(5).replace("-", "/");
  return `${when}: ${m.name} $${m.amount.toFixed(2)}${m.who ? ` (${m.who})` : ""}`;
}

export function buildDigest(input: DigestInput): Digest {
  const { counts } = countsFor(input);
  const tz = input.timeZone;

  const textSections: string[] = [input.dayLabel, ""];
  const htmlSections: string[] = [];

  // Calendar
  textSections.push("CALENDAR");
  if (!input.googleConnected) textSections.push("Google not connected yet.");
  else if (input.events.length === 0) textSections.push("Nothing on the calendar.");
  else for (const e of input.events) textSections.push(`- ${eventLine(e, tz)}`);
  textSections.push("");

  htmlSections.push(`<h2>Calendar</h2>`);
  if (!input.googleConnected) htmlSections.push(`<p class="muted">Google not connected yet.</p>`);
  else if (input.events.length === 0) htmlSections.push(`<p class="muted">Nothing on the calendar.</p>`);
  else
    htmlSections.push(
      `<ul>${input.events
        .map((e) => {
          const line = esc(eventLine(e, tz));
          return `<li>${e.link ? `<a href="${esc(e.link)}">${line}</a>` : line}</li>`;
        })
        .join("")}</ul>`,
    );

  // Family (the household's own calendar)
  const family = input.family ?? [];
  if (family.length) {
    textSections.push("FAMILY");
    for (const f of family) textSections.push(`- ${f.allDay ? "All day" : clockLabel(f.start)}: ${f.title}${f.kind !== "event" ? ` (${f.kind})` : ""}`);
    textSections.push("");
    htmlSections.push(`<h2>Family</h2><ul>${family.map((f) => `<li>${esc(f.allDay ? "All day" : clockLabel(f.start))}: ${esc(f.title)}${f.kind !== "event" ? ` <span class="muted">${esc(f.kind)}</span>` : ""}</li>`).join("")}</ul>`);
  }

  // Money (bills due this week) and Review (what machines proposed)
  const money = input.money ?? [];
  const today = input.today ?? "";
  if (money.length) {
    textSections.push("MONEY (due this week)");
    for (const m of money) textSections.push(`- ${moneyLine(m, today)}`);
    textSections.push("");
    htmlSections.push(`<h2>Money, due this week</h2><ul>${money.map((m) => `<li>${esc(moneyLine(m, today))}</li>`).join("")}</ul>`);
  }
  if (counts.review) {
    textSections.push(`REVIEW: ${counts.review} waiting at ${input.portalUrl}/review`);
    textSections.push("");
    htmlSections.push(`<h2>Review</h2><p>${counts.review} thing${counts.review === 1 ? "" : "s"} proposed. <a href="${esc(input.portalUrl)}/review">Accept or dismiss</a>.</p>`);
  }

  // Inbox
  const shown = input.unread.length;
  const inboxHeading = counts.unread > shown ? `INBOX (${counts.unread} unread, newest ${shown})` : `INBOX (${counts.unread} unread)`;
  textSections.push(inboxHeading);
  if (!input.googleConnected) textSections.push("Google not connected yet.");
  else if (shown === 0) textSections.push("Inbox zero.");
  else for (const m of input.unread) textSections.push(`- ${senderName(m.from)}: ${m.subject}`);
  textSections.push("");

  htmlSections.push(`<h2>${esc(inboxHeading.replace("INBOX", "Inbox"))}</h2>`);
  if (!input.googleConnected) htmlSections.push(`<p class="muted">Google not connected yet.</p>`);
  else if (shown === 0) htmlSections.push(`<p class="muted">Inbox zero.</p>`);
  else
    htmlSections.push(
      `<ul>${input.unread
        .map(
          (m) =>
            `<li><strong>${esc(senderName(m.from))}</strong>: ${esc(m.subject)}` +
            (m.snippet ? `<br><span class="muted">${esc(m.snippet.slice(0, 140))}</span>` : "") +
            `</li>`,
        )
        .join("")}</ul>`,
    );

  // Tasks
  textSections.push(`TASKS (${counts.tasks} open)`);
  if (input.tasks.length === 0) textSections.push("No open tasks.");
  else for (const t of input.tasks) textSections.push(`- ${taskLine(t)}`);
  textSections.push("");

  htmlSections.push(`<h2>Tasks (${counts.tasks} open)</h2>`);
  if (input.tasks.length === 0) htmlSections.push(`<p class="muted">No open tasks.</p>`);
  else htmlSections.push(`<ul>${input.tasks.map((t) => `<li>${esc(taskLine(t))}</li>`).join("")}</ul>`);

  textSections.push(`Portal: ${input.portalUrl}`);

  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<style>
body{margin:0;background:#050505;color:#fff;font-family:Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.45}
.wrap{max-width:600px;margin:0 auto;padding:24px 20px}
h1{font-size:22px;margin:0 0 20px;color:#37FF8B}
h2{font-size:15px;letter-spacing:.06em;text-transform:uppercase;margin:24px 0 8px;color:#37FF8B}
ul{padding-left:18px;margin:0}
li{margin:0 0 8px}
a{color:#fff}
.muted{color:rgba(255,255,255,.65)}
.foot{margin-top:28px;font-size:13px}
</style></head><body><div class="wrap">
<h1>${esc(input.dayLabel)}</h1>
${htmlSections.join("\n")}
<p class="foot muted"><a href="${esc(input.portalUrl)}">Open the portal</a></p>
</div></body></html>`;

  return {
    subject: subjectFor(input),
    text: textSections.join("\n"),
    html,
    counts,
  };
}
