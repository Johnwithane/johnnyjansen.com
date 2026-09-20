// Display helpers. The functions side formats the email; this side formats
// the same data for the screen, with the browser's own zone.

export function timeOf(iso: string): string {
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(iso));
}

/** "Jane Doe <jane@x.com>" → "Jane Doe". Same rule as the digest's senderName. */
export function senderName(from: string): string {
  const m = from.match(/^\s*"?([^"<]*?)"?\s*<[^>]+>\s*$/);
  const name = m?.[1]?.trim();
  return name || from.trim();
}

/** "2026-09-20" → "Sep 20", or "" for null. */
export function dueLabel(due: string | null | undefined): string {
  if (!due) return "";
  const [y, m, d] = due.split("-").map(Number);
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(y, m - 1, d));
}

/** Relative age of a stored instant, for "Updated 4 min ago". */
export function ago(date: Date | null | undefined, now = new Date()): string {
  if (!date) return "";
  const s = Math.max(0, Math.round((now.getTime() - date.getTime()) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  return `${Math.round(h / 24)} d ago`;
}

/** Whole years between a YYYY-MM-DD birth date and `now`. */
export function ageOn(birthDate: string, now = new Date()): number {
  const [y, m, d] = birthDate.split("-").map(Number);
  let age = now.getFullYear() - y;
  const beforeBirthday = now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d);
  if (beforeBirthday) age--;
  return Math.max(0, age);
}
