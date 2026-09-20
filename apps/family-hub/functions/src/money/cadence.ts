import type { BillCadence } from "../types";

// Day math on YYYY-MM-DD strings, no zone: a bill's due day is a calendar
// day, not an instant. Mirrored in app/src/utils/bills.ts.

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** The next due day after `due` for a cadence; `once` never advances. */
export function advanceDue(due: string, cadence: BillCadence): string {
  const [y, m, d] = due.split("-").map(Number);
  if (cadence === "once") return due;
  if (cadence === "weekly") {
    const t = new Date(Date.UTC(y, m - 1, d + 7));
    return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
  }
  const months = cadence === "monthly" ? 1 : cadence === "quarterly" ? 3 : 12;
  // Clamp to the target month's length so the 31st stays the last day.
  const total = (m - 1) + months;
  const ny = y + Math.floor(total / 12);
  const nm = (total % 12) + 1;
  const last = new Date(Date.UTC(ny, nm, 0)).getUTCDate();
  return `${ny}-${pad(nm)}-${pad(Math.min(d, last))}`;
}

/** Roll a due day forward until it is on or after `today`. Bounded, so a bad date cannot loop forever. */
export function rollForward(due: string, cadence: BillCadence, today: string): string {
  let d = due;
  for (let i = 0; i < 400 && d < today && cadence !== "once"; i++) d = advanceDue(d, cadence);
  return d;
}
