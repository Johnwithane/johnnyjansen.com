import { computed, ref } from "vue";
import { onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";
import { auth, googleProvider } from "@/firebase/config";
import type { Role } from "@/firebase/interfaces";

// Sign in with Google. The household and role ride on the ID token as
// custom claims ({ hid, role }), stamped by createHousehold / acceptInvite.
// After either of those the token must be refreshed to see them, which is
// what refreshClaims() is for. Cached claims are read first so a phone with
// no signal still opens straight into the household.

interface Claims {
  hid: string | null;
  role: Role | null;
  mfa: boolean;
}

const user = ref<User | null>(null);
const claims = ref<Claims>({ hid: null, role: null, mfa: false });
const ready = ref(false);
const error = ref<string | null>(null);
const busy = ref(false);
let started = false;

async function readClaims(u: User, force: boolean): Promise<Claims> {
  const t = await u.getIdTokenResult(force);
  const c = t.claims as Record<string, unknown>;
  const fb = c.firebase as { sign_in_second_factor?: string } | undefined;
  return {
    hid: typeof c.hid === "string" ? c.hid : null,
    role: c.role === "adult" || c.role === "child" ? c.role : null,
    mfa: !!fb?.sign_in_second_factor,
  };
}

function start() {
  if (started) return;
  started = true;
  onAuthStateChanged(auth, async (u) => {
    user.value = u;
    claims.value = u ? await readClaims(u, false).catch(() => ({ hid: null, role: null, mfa: false })) : { hid: null, role: null, mfa: false };
    ready.value = true;
  });
}

export function useAuth() {
  start();

  async function signIn() {
    error.value = null;
    busy.value = true;
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      claims.value = await readClaims(cred.user, true);
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Sign in failed";
    } finally {
      busy.value = false;
    }
  }

  /** Force a token refresh, e.g. right after createHousehold or acceptInvite. */
  async function refreshClaims(): Promise<Claims> {
    if (!user.value) return claims.value;
    claims.value = await readClaims(user.value, true);
    return claims.value;
  }

  async function logOut() {
    await signOut(auth);
    claims.value = { hid: null, role: null, mfa: false };
  }

  return {
    user: computed(() => user.value),
    uid: computed(() => user.value?.uid ?? null),
    hid: computed(() => claims.value.hid),
    role: computed(() => claims.value.role),
    isMember: computed(() => !!claims.value.hid),
    isAdult: computed(() => claims.value.role === "adult"),
    ready: computed(() => ready.value),
    error: computed(() => error.value),
    busy: computed(() => busy.value),
    signIn,
    refreshClaims,
    logOut,
  };
}
