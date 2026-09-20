import { computed, ref } from "vue";
import { onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";
import { auth, googleProvider } from "@/firebase/config";

const user = ref<User | null>(null);
const ready = ref(false);
const error = ref<string | null>(null);
let started = false;

export function useAuth() {
  if (!started) {
    started = true;
    onAuthStateChanged(auth, (u) => {
      user.value = u;
      ready.value = true;
    });
  }
  async function signIn() {
    error.value = null;
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Sign in failed";
    }
  }
  return { user: computed(() => user.value), ready: computed(() => ready.value), error: computed(() => error.value), signIn, logOut: () => signOut(auth) };
}
