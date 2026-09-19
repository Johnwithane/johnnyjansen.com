import { db } from "@/firebase/config";
import type { Task, WithId } from "@/firebase/interfaces";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

const tasks = () => collection(db, "tasks");

/**
 * Live open (or done) tasks. Offline, Firestore serves the cache and applies
 * local writes to it immediately, so the list updates without a server ack.
 */
export function subscribeTasks(done: boolean, cb: (items: WithId<Task>[]) => void): () => void {
  const q = query(tasks(), where("done", "==", done), orderBy("createdAt", done ? "desc" : "asc"));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Task) }))));
}

// Writes are NOT awaited by callers. A queued offline write resolves only on
// server ack, which never comes with no signal; the onSnapshot above already
// reflects it locally. Errors are surfaced through the returned promise.

export function createTask(input: { title: string; due?: string | null; notes?: string }): Promise<unknown> {
  return addDoc(tasks(), {
    title: input.title,
    done: false,
    doneAt: null,
    due: input.due ?? null,
    notes: input.notes ?? "",
    source: "portal",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export function setTaskDone(id: string, done: boolean): Promise<void> {
  return updateDoc(doc(db, "tasks", id), {
    done,
    doneAt: done ? serverTimestamp() : null,
    updatedAt: serverTimestamp(),
  });
}

export function deleteTask(id: string): Promise<void> {
  return deleteDoc(doc(db, "tasks", id));
}
