import { db, functions } from "@/firebase/config";
import type { Agenda, Household, PersonColour, UserProfile } from "@/firebase/interfaces";
import { collection, doc, onSnapshot, serverTimestamp, updateDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";

export function subscribeHousehold(hid: string, cb: (h: Household | null) => void): () => void {
  return onSnapshot(doc(db, "households", hid), (snap) => cb(snap.exists() ? (snap.data() as Household) : null));
}

export function subscribeProfile(uid: string, cb: (p: UserProfile | null) => void): () => void {
  return onSnapshot(doc(db, "users", uid), (snap) => cb(snap.exists() ? (snap.data() as UserProfile) : null));
}

// Callables. Every one needs a connection; callers guard with navigator.onLine.

export async function createHousehold(input: {
  name: string;
  timeZone: string;
  yourName: string;
  colour: PersonColour;
  birthDate?: string;
}): Promise<{ hid: string }> {
  const fn = httpsCallable<typeof input, { hid: string }>(functions, "createHousehold");
  return (await fn(input)).data;
}

export async function createInvite(input: { email: string; name: string; colour: PersonColour }): Promise<{ inviteId: string; link: string }> {
  const fn = httpsCallable<typeof input, { inviteId: string; link: string }>(functions, "createInvite");
  return (await fn(input)).data;
}

export async function acceptInvite(input: { hid: string; inviteId: string; token: string }): Promise<{ hid: string }> {
  const fn = httpsCallable<typeof input, { hid: string }>(functions, "acceptInvite");
  return (await fn(input)).data;
}

export async function addChild(input: { name: string; birthDate: string; colour: PersonColour }): Promise<{ memberId: string }> {
  const fn = httpsCallable<typeof input, { memberId: string }>(functions, "addChild");
  return (await fn(input)).data;
}

export async function mintMeToken(): Promise<{ token: string }> {
  const fn = httpsCallable<void, { token: string }>(functions, "mintMeToken");
  return (await fn()).data;
}

export async function revokeMeToken(): Promise<void> {
  const fn = httpsCallable<void, { ok: true }>(functions, "revokeMeToken");
  await fn();
}

// Google, per person (Phase 1c). Connect leaves the app for Google's consent
// screen and comes back to /household?google=<outcome>.

export async function googleConnectStart(): Promise<{ url: string }> {
  const fn = httpsCallable<void, { url: string }>(functions, "googleConnectStart");
  return (await fn()).data;
}

export async function googleDisconnect(): Promise<void> {
  const fn = httpsCallable<void, { ok: true }>(functions, "googleDisconnect");
  await fn();
}

export interface CalendarChoice {
  id: string;
  name: string;
  primary: boolean;
  selected: boolean;
}

export async function googleCalendars(): Promise<CalendarChoice[]> {
  const fn = httpsCallable<void, { calendars: CalendarChoice[] }>(functions, "googleCalendars");
  return (await fn()).data.calendars;
}

export async function setCalendars(calendarIds: string[], familyCalendarIds: string[]): Promise<void> {
  const fn = httpsCallable<{ calendarIds: string[]; familyCalendarIds: string[] }, { ok: true }>(functions, "setCalendars");
  await fn({ calendarIds, familyCalendarIds });
}

/** Everyone's family-marked events for today. */
export function subscribeAgenda(hid: string, cb: (items: Agenda[]) => void): () => void {
  return onSnapshot(collection(db, "households", hid, "agenda"), (snap) => cb(snap.docs.map((d) => d.data() as Agenda)));
}

/** Mark the setup wizard finished (or not) on the person's own profile. */
export function setSetupDone(uid: string, done: boolean): Promise<void> {
  return updateDoc(doc(db, "users", uid), { setup: { done }, updatedAt: serverTimestamp() });
}

/** Record acceptance of the current Terms + Privacy version on the profile. */
export function acceptLegal(uid: string, version: number): Promise<void> {
  return updateDoc(doc(db, "users", uid), { legal: { version, acceptedAt: serverTimestamp() }, updatedAt: serverTimestamp() });
}
