import { db } from "@/firebase/config";
import type { Task, Visibility, WithId } from "@/firebase/interfaces";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

const tasks = (hid: string) => collection(db, "households", hid, "tasks");

/**
 * Live tasks this person can see: the household's shared ones and their own
 * private ones. Two listeners, merged, because the rules split them the same
 * way and Firestore has no OR across fields. Sorted here, oldest first when
 * open, newest first when done.
 */
export function subscribeTasks(hid: string, uid: string, done: boolean, cb: (items: WithId<Task>[]) => void): () => void {
  let shared: WithId<Task>[] = [];
  let mine: WithId<Task>[] = [];
  const emit = () => {
    const all = [...shared, ...mine];
    const key = (t: WithId<Task>) => (done ? -(t.doneAt?.toMillis?.() ?? 0) : (t.createdAt?.toMillis?.() ?? Number.MAX_SAFE_INTEGER));
    cb(all.sort((a, b) => key(a) - key(b)));
  };
  const s1 = onSnapshot(query(tasks(hid), where("done", "==", done), where("visibility", "==", "household")), (snap) => {
    shared = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Task) }));
    emit();
  });
  const s2 = onSnapshot(
    query(tasks(hid), where("done", "==", done), where("visibility", "==", "private"), where("ownerUid", "==", uid)),
    (snap) => {
      mine = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Task) }));
      emit();
    },
  );
  return () => {
    s1();
    s2();
  };
}

// Writes are NOT awaited by callers: offline, the ack never comes, but the
// listeners above already show the change. Errors surface via the promise.

export function createTask(
  hid: string,
  uid: string,
  input: { title: string; visibility: Visibility; due?: string | null; notes?: string; assigneeUid?: string | null },
): Promise<unknown> {
  return addDoc(tasks(hid), {
    title: input.title,
    done: false,
    doneAt: null,
    due: input.due ?? null,
    notes: input.notes ?? "",
    visibility: input.visibility,
    ownerUid: uid,
    assigneeUid: input.assigneeUid ?? null,
    source: "portal",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export function setTaskDone(hid: string, id: string, done: boolean): Promise<void> {
  return updateDoc(doc(db, "households", hid, "tasks", id), {
    done,
    doneAt: done ? serverTimestamp() : null,
    updatedAt: serverTimestamp(),
  });
}

export function deleteTask(hid: string, id: string): Promise<void> {
  return deleteDoc(doc(db, "households", hid, "tasks", id));
}
