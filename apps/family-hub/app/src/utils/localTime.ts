// The household calendar stores wall-clock strings with no zone:
// "2026-09-22" for all-day, "2026-09-22T14:30" for a time. One family, one
// clock; no offsets to get wrong. These helpers keep every screen honest
// about that format.

const pad = (n: number) => String(n).padStart(2, "0");

/** YYYY-MM-DD of a Date in the browser's zone. */
export function dayKeyOf(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** YYYY-MM-DDTHH:mm of a Date in the browser's zone. */
export function localIso(d: Date): string {
  return `${dayKeyOf(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** The day key inside any stored start (all-day or timed). */
export function dayOf(start: string): string {
  return start.slice(0, 10);
}

/** "2026-09-22T14:30" -> "2:30 PM"; all-day -> "". Never parses through Date. */
export function clockOf(start: string): string {
  const m = /T(\d{2}):(\d{2})/.exec(start);
  if (!m) return "";
  const h = Number(m[1]);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m[2]} ${h >= 12 ? "PM" : "AM"}`;
}

/** Add whole days to a day key. */
export function addDays(key: string, n: number): string {
  const [y, m, d] = key.split("-").map(Number);
  return dayKeyOf(new Date(y, m - 1, d + n));
}

/** "Mon 22" style labels for a week strip. */
export function stripLabel(key: string): { dow: string; day: number } {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return { dow: date.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 3), day: d };
}

/** "Tuesday, September 22" */
export function longDay(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}
