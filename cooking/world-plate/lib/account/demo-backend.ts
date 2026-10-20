import { AccountError, MIN_PASSWORD, type AccountBackend, type AccountUser } from "./backend";

/**
 * A localStorage stand-in for Firebase, used only by the end-to-end tests (they set DEMO_FLAG). It behaves like the
 * real backend — same errors, accounts that survive signing out — so the specs exercise the real UI and sync code.
 * Passwords are stored in plain text, which is fine for a test fixture and the reason visitors never get it.
 */
type DemoAccount = AccountUser & { password: string; favorites: string[] };
const ACCOUNTS = "wp-demo:accounts";
const SESSION = "wp-demo:session";

const accounts = (): Record<string, DemoAccount> => JSON.parse(localStorage.getItem(ACCOUNTS) ?? "{}");
const saveAccounts = (all: Record<string, DemoAccount>) => localStorage.setItem(ACCOUNTS, JSON.stringify(all));
const listeners = new Set<(u: AccountUser | null) => void>();

function current(): AccountUser | null {
  const email = localStorage.getItem(SESSION);
  const a = email ? accounts()[email] : undefined;
  return a ? { uid: a.uid, email: a.email, name: a.name } : null;
}
const emit = () => listeners.forEach((l) => l(current()));
const later = <T>(run: () => T) => new Promise<T>((resolve, reject) => setTimeout(() => {
  try {
    resolve(run());
  } catch (e) {
    reject(e);
  }
}, 150));

export const demoBackend: AccountBackend = {
  onUser(callback) {
    listeners.add(callback);
    callback(current());
    return () => listeners.delete(callback);
  },
  signUp: (name, email, password) =>
    later(() => {
      const all = accounts();
      const key = email.toLowerCase();
      if (all[key]) throw new AccountError("auth/email-already-in-use");
      if (password.length < MIN_PASSWORD) throw new AccountError("auth/weak-password");
      all[key] = { uid: `demo-${Date.now()}`, email: key, name, password, favorites: [] };
      saveAccounts(all);
      localStorage.setItem(SESSION, key);
      emit();
    }),
  signIn: (email, password) =>
    later(() => {
      const a = accounts()[email.toLowerCase()];
      if (!a || a.password !== password) throw new AccountError("auth/invalid-credential");
      localStorage.setItem(SESSION, a.email);
      emit();
    }),
  signOut: () =>
    later(() => {
      localStorage.removeItem(SESSION);
      emit();
    }),
  resetPassword: () => later(() => undefined),
  loadFavorites: (uid) => later(() => Object.values(accounts()).find((a) => a.uid === uid)?.favorites ?? []),
  saveFavorites: (uid, slugs) =>
    later(() => {
      const all = accounts();
      const a = Object.values(all).find((x) => x.uid === uid);
      if (a) a.favorites = slugs;
      saveAccounts(all);
    }),
};
