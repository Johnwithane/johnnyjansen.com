import { db } from "../lib/admin";
import type { Person } from "./collect";

/** How many suggestions this person can see on Review: the household's plus their own private ones. */
export async function pendingCount(p: Person): Promise<number> {
  const col = db.collection("households").doc(p.hid).collection("suggestions");
  const [shared, mine] = await Promise.all([
    col.where("status", "==", "pending").where("visibility", "==", "household").count().get(),
    col.where("status", "==", "pending").where("visibility", "==", "private").where("ownerUid", "==", p.uid).count().get(),
  ]);
  return shared.data().count + mine.data().count;
}
