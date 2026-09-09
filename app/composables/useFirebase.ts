import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getFunctions, type Functions } from "firebase/functions";

export interface FirebaseHandles {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  storage: FirebaseStorage;
  functions: Functions;
}

let handles: FirebaseHandles | null = null;

// Client only, lazy, and null when the project is not configured, so the
// portfolio builds and renders with no Firebase at all. Only the lab uses it.
export function useFirebase(): FirebaseHandles | null {
  if (import.meta.server) return null;
  if (handles) return handles;
  const cfg = useRuntimeConfig().public.firebase;
  if (!cfg.apiKey || !cfg.projectId) return null;
  const app = getApps()[0] ?? initializeApp(cfg);
  handles = {
    app,
    auth: getAuth(app),
    db: getFirestore(app),
    storage: getStorage(app),
    functions: getFunctions(app, "us-central1"),
  };
  return handles;
}
