import { FieldValue } from "firebase-admin/firestore";
import { logger } from "firebase-functions/v2";
import { db } from "../lib/admin";
import type { BillDoc, HouseholdDoc } from "../types";
import { rollForward } from "./cadence";

export interface BillLine {
  id: string;
  name: string;
  amount: number;
  currency: string;
  nextDue: string;
  cadence: BillDoc["cadence"];
  /** The responsible adult's first name, or "" when nobody carries it. */
  who: string;
}

function plusDays(key: string, days: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return t.toISOString().slice(0, 10);
}

/** Bills due in [fromKey, fromKey + days), plus anything already overdue. Function-side read, so adults only call this. */
export async function billsDueWithin(hid: string, fromKey: string, days: number): Promise<BillLine[]> {
  const to = plusDays(fromKey, days);
  const [snap, hh] = await Promise.all([
    db.collection("households").doc(hid).collection("bills").where("nextDue", "<", to).orderBy("nextDue").limit(50).get(),
    db.collection("households").doc(hid).get(),
  ]);
  const members = (hh.data() as HouseholdDoc | undefined)?.members ?? {};
  return snap.docs.map((d) => {
    const b = d.data() as BillDoc;
    return { id: d.id, name: b.name, amount: b.amount, currency: b.currency, nextDue: b.nextDue, cadence: b.cadence, who: b.responsibleUid ? (members[b.responsibleUid]?.name ?? "") : "" };
  });
}

/** Move every recurring bill whose due day has passed to its next one. Runs once a day per household. */
export async function rollBills(hid: string, todayKey: string): Promise<number> {
  const snap = await db.collection("households").doc(hid).collection("bills").where("nextDue", "<", todayKey).limit(200).get();
  let moved = 0;
  const batch = db.batch();
  for (const d of snap.docs) {
    const b = d.data() as BillDoc;
    const next = rollForward(b.nextDue, b.cadence, todayKey);
    if (next === b.nextDue) continue;
    batch.update(d.ref, { nextDue: next, updatedAt: FieldValue.serverTimestamp() });
    moved++;
  }
  if (moved) await batch.commit();
  if (moved) logger.info("bills: rolled", { hid, moved });
  return moved;
}
