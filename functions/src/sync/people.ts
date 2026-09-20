import { db } from "../lib/admin";
import { DEFAULT_TIMEZONE } from "../lib/params";
import type { UserDoc } from "../types";
import type { Person } from "./collect";

/** The person behind a uid, or null if they are not in a household. */
export async function personFor(uid: string): Promise<Person | null> {
  const snap = await db.collection("users").doc(uid).get();
  const u = snap.data() as UserDoc | undefined;
  if (!u?.hid) return null;
  return { uid, hid: u.hid, timeZone: u.timeZone || DEFAULT_TIMEZONE.value(), calendarIds: u.google?.calendarIds ?? [] };
}

/** Every adult who has the digest on (default on). Children get no digest. */
export async function digestRecipients(): Promise<(Person & { email: string })[]> {
  const snap = await db.collection("users").where("role", "==", "adult").limit(1000).get();
  const out: (Person & { email: string })[] = [];
  for (const d of snap.docs) {
    const u = d.data() as UserDoc;
    if (!u.hid || u.digest?.enabled === false || !u.email) continue;
    out.push({ uid: d.id, hid: u.hid, timeZone: u.timeZone || DEFAULT_TIMEZONE.value(), calendarIds: u.google?.calendarIds ?? [], email: u.email });
  }
  return out;
}
