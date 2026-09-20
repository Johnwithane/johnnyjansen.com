import type { Bill, BillCadence, Transaction, WithId } from "@/firebase/interfaces";

// Pure bill math (PLAN.md 4.5). Mirrors functions/src/money/cadence.ts for
// the due-day roll; the rest is client-only display logic.

const PER_YEAR: Record<BillCadence, number> = { weekly: 52, monthly: 12, quarterly: 4, yearly: 1, once: 0 };

export function yearlyCost(b: Pick<Bill, "amount" | "cadence">): number {
  return Math.round(b.amount * PER_YEAR[b.cadence] * 100) / 100;
}
export function monthlyCost(b: Pick<Bill, "amount" | "cadence">): number {
  return Math.round((yearlyCost(b) / 12) * 100) / 100;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function advanceDue(due: string, cadence: BillCadence): string {
  const [y, m, d] = due.split("-").map(Number);
  if (cadence === "once") return due;
  if (cadence === "weekly") {
    const t = new Date(Date.UTC(y, m - 1, d + 7));
    return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
  }
  const months = cadence === "monthly" ? 1 : cadence === "quarterly" ? 3 : 12;
  const total = m - 1 + months;
  const ny = y + Math.floor(total / 12);
  const nm = (total % 12) + 1;
  const last = new Date(Date.UTC(ny, nm, 0)).getUTCDate();
  return `${ny}-${pad(nm)}-${pad(Math.min(d, last))}`;
}

/** Whole days from `today` to `due`; negative when overdue. */
export function daysUntil(due: string, today: string): number {
  const at = (k: string) => {
    const [y, m, d] = k.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((at(due) - at(today)) / 86400000);
}

export function dueLabel(due: string, today: string): string {
  const n = daysUntil(due, today);
  if (n < 0) return `${-n} day${n === -1 ? "" : "s"} overdue`;
  if (n === 0) return "Today";
  if (n === 1) return "Tomorrow";
  if (n < 7) return `In ${n} days`;
  const [y, m, d] = due.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-CA", { month: "short", day: "numeric", timeZone: "UTC" });
}

/** "TD*NETFLIX.COM 123" and "Netflix" meet on the same key. */
export function merchantKey(s: string): string {
  return s
    .toLowerCase()
    .replace(/\b(www|com|ca|inc|ltd|the|pmt|payment|autopay|recurring)\b/g, " ")
    .replace(/[^a-z]+/g, " ")
    .trim()
    .split(" ")
    .filter((w) => w.length >= 3)
    .slice(0, 2)
    .join(" ");
}

export interface CreepFlag {
  billId: string;
  kind: "up" | "unused";
  detail: string;
}

/**
 * Creep detection over recorded transactions (PLAN.md 4.5): a recurring
 * charge whose latest amount is above the bill by more than 2 percent, or a
 * monthly-or-faster bill that used to appear in transactions and has not
 * for ninety days. Display only; nothing is written.
 */
export function detectCreep(bills: WithId<Bill>[], txs: Pick<Transaction, "merchant" | "amount" | "date" | "direction">[], today: string): CreepFlag[] {
  const flags: CreepFlag[] = [];
  for (const b of bills) {
    if (b.cadence === "once") continue;
    const key = merchantKey(b.name);
    if (!key) continue;
    const first = key.split(" ")[0];
    const matches = txs
      .filter((t) => t.direction === "expense" && merchantKey(t.merchant).includes(first))
      .sort((a, c) => c.date.localeCompare(a.date));
    if (!matches.length) continue;
    const latest = matches[0];
    if (latest.amount > b.amount * 1.02 && b.amount > 0) {
      flags.push({ billId: b.id, kind: "up", detail: `Charged $${latest.amount.toFixed(2)} on ${latest.date}, up from $${b.amount.toFixed(2)}` });
      continue;
    }
    if ((b.cadence === "monthly" || b.cadence === "weekly") && daysUntil(today, latest.date) >= 90) {
      flags.push({ billId: b.id, kind: "unused", detail: `No charge seen since ${latest.date}. Still using it?` });
    }
  }
  return flags;
}

/** The load ledger for bills: how many recurring items each adult carries, and unowned ones. */
export function loadSplit(bills: Pick<Bill, "responsibleUid" | "cadence">[]): { byUid: Record<string, number>; unowned: number } {
  const byUid: Record<string, number> = {};
  let unowned = 0;
  for (const b of bills) {
    if (b.cadence === "once") continue;
    if (b.responsibleUid) byUid[b.responsibleUid] = (byUid[b.responsibleUid] ?? 0) + 1;
    else unowned++;
  }
  return { byUid, unowned };
}
