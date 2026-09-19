import { computed, ref } from "vue";
import { onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";
import { auth, googleProvider } from "@/firebase/config";

// One user. Sign in with Google; the onUserCreated function then either stamps
// the `owner` claim (it's Johnny) or deletes the account (it isn't). The claim
// is not on the first token, so after sign-in we refresh the token for a few
// seconds until it appears. If the account was deleted the refresh fails and
// we land on "not you".

const user = ref<User | null>(null);
const isOwner = ref(false);
const ready = ref(false);
const error = ref<string | null>(null);
const busy = ref(false);
let started = false;

async function readClaim(u: User, force: boolean): Promise<boolean> {
  const t = await u.getIdTokenResult(force);
  return t.claims.owner === true;
}

async function waitForClaim(u: User): Promise<boolean> {
  for (let i = 0; i < 10; i++) {
    try {
      if (await readClaim(u, i > 0)) return true;
    } catch {
      return false; // token refresh failed: the account was deleted
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

function start() {
  if (started) return;
  started = true;
  onAuthStateChanged(auth, async (u) => {
    user.value = u;
    // Cached claim first (works offline), only then the network.
    isOwner.value = u ? await readClaim(u, false).catch(() => false) : false;
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
      const ok = await waitForClaim(cred.user);
      if (!ok) {
        await signOut(auth).catch(() => undefined);
        error.value = "This portal is for one account. That was not it.";
        return;
      }
      isOwner.value = true;
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Sign in failed";
    } finally {
      busy.value = false;
    }
  }

  async function logOut() {
    await signOut(auth);
    isOwner.value = false;
  }

  return {
    user: computed(() => user.value),
    isOwner: computed(() => isOwner.value),
    ready: computed(() => ready.value),
    error: computed(() => error.value),
    busy: computed(() => busy.value),
    signIn,
    logOut,
  };
}
