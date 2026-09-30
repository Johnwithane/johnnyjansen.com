import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInAnonymously,
  signInWithPopup,
  signOut as fbSignOut,
  type User,
} from "firebase/auth";
import { httpsCallable } from "firebase/functions";

interface LabClaims {
  admin?: boolean;
  labs?: string[];
}

const user = ref<User | null>(null);
const claims = ref<LabClaims>({});
const ready = ref(false);
let started = false;

async function refreshClaims(u: User | null, force = false) {
  if (!u) {
    claims.value = {};
    return;
  }
  const token = await u.getIdTokenResult(force);
  claims.value = {
    admin: token.claims.admin === true,
    labs: Array.isArray(token.claims.labs) ? (token.claims.labs as string[]) : [],
  };
}

// One shared auth state for the whole lab. Visitors are anonymous users who
// earn `labs: [slug]` claims by entering a password; the owner signs in with
// Google and earns `admin: true` through the ensureAdmin callable.
export function useLabAuth() {
  const fb = useFirebase();

  if (fb && !started) {
    started = true;
    onAuthStateChanged(fb.auth, async (u) => {
      user.value = u;
      await refreshClaims(u);
      ready.value = true;
    });
  } else if (!fb) {
    ready.value = true;
  }

  const isAdmin = computed(() => claims.value.admin === true);
  const canOpen = (slug: string) => isAdmin.value || (claims.value.labs ?? []).includes(slug);

  async function signInWithGoogle() {
    if (!fb) throw new Error("Firebase is not configured");
    await signInWithPopup(fb.auth, new GoogleAuthProvider());
    await httpsCallable(fb.functions, "ensureAdmin")({});
    await refreshClaims(fb.auth.currentUser, true);
  }

  async function unlock(slug: string, password: string): Promise<boolean> {
    if (!fb) throw new Error("Firebase is not configured");
    if (!fb.auth.currentUser) await signInAnonymously(fb.auth);
    try {
      await httpsCallable(fb.functions, "unlockPrototype")({ slug, password });
    } catch {
      return false;
    }
    await refreshClaims(fb.auth.currentUser, true);
    return canOpen(slug);
  }

  async function signOut() {
    if (fb) await fbSignOut(fb.auth);
  }

  return { configured: Boolean(fb), user, claims, ready, isAdmin, canOpen, signInWithGoogle, unlock, signOut };
}
