import { app, db } from "@/firebase/config";
import type { Feedback, FeedbackStatus, FeedbackType, WithId } from "@/firebase/interfaces";
import { collection, doc, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes } from "firebase/storage";

const col = (hid: string) => collection(db, "households", hid, "feedback");

export function subscribeFeedback(hid: string, cb: (items: WithId<Feedback>[]) => void, max = 100): () => void {
  const q = query(col(hid), orderBy("createdAt", "desc"), limit(max));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Feedback) }))));
}

/** Upload screenshots first (needs a connection), then write the report. */
export async function uploadScreenshots(hid: string, uid: string, files: File[]): Promise<string[]> {
  const storage = getStorage(app);
  const paths: string[] = [];
  for (const f of files.slice(0, 3)) {
    const path = `households/${hid}/feedback/${uid}/${Date.now()}-${f.name.replace(/[^A-Za-z0-9._-]/g, "_")}`;
    await uploadBytes(ref(storage, path), f, { contentType: f.type || "image/png" });
    paths.push(path);
  }
  return paths;
}

/** The report itself. Not awaited by callers: it queues offline like any write. */
export function fileReport(
  hid: string,
  uid: string,
  input: { type: FeedbackType; description: string; route: string; url: string; environment: string; appVersion: string; screenshotPaths: string[]; reporterName: string },
): Promise<void> {
  const ref = doc(col(hid));
  return setDoc(ref, {
    ...input,
    reportId: ref.id,
    status: "open",
    notes: "",
    reporterUid: uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export function triageReport(hid: string, id: string, status: Exclude<FeedbackStatus, "shipped">, notes?: string): Promise<void> {
  return updateDoc(doc(db, "households", hid, "feedback", id), {
    status,
    ...(notes !== undefined ? { notes } : {}),
    updatedAt: serverTimestamp(),
  });
}
