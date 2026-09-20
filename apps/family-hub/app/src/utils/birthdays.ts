import type { Member } from "@/firebase/interfaces";

export interface UpcomingBirthday {
  name: string;
  colour: string;
  /** 0 = today */
  inDays: number;
  turning: number;
  /** YYYY-MM-DD of the next occurrence */
  on: string;
}

/** Members' next birthdays within `window` days, soonest first. */
export function upcomingBirthdays(members: Record<string, Member>, now = new Date(), window = 30): UpcomingBirthday[] {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const out: UpcomingBirthday[] = [];
  for (const m of Object.values(members)) {
    if (!m.birthDate) continue;
    const [y, mo, d] = m.birthDate.split("-").map(Number);
    let next = new Date(today.getFullYear(), mo - 1, d);
    if (next < today) next = new Date(today.getFullYear() + 1, mo - 1, d);
    const inDays = Math.round((next.getTime() - today.getTime()) / 86400000);
    if (inDays > window) continue;
    const on = `${next.getFullYear()}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    out.push({ name: m.name, colour: m.colour, inDays, turning: next.getFullYear() - y, on });
  }
  return out.sort((a, b) => a.inDays - b.inDays);
}

export function birthdayLine(b: UpcomingBirthday): string {
  const when = b.inDays === 0 ? "today" : b.inDays === 1 ? "tomorrow" : `in ${b.inDays} days`;
  return `${b.name}'s birthday ${when}, turning ${b.turning}`;
}
