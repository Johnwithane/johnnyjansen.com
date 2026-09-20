import { db, functions } from "@/firebase/config";
import type { Household, PersonColour, UserProfile } from "@/firebase/interfaces";
import { doc, onSnapshot } from "firebase/firestore";
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
