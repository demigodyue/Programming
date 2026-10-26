import { cleanFavorites, cleanRatings, type Ratings } from "@/lib/local-store";
import { AccountError, MIN_PASSWORD, type AccountBackend, type AccountUser } from "./backend";

/**
 * A localStorage stand-in for Firebase, used only by the end-to-end tests (they set DEMO_FLAG). It behaves like the
 * real backend — same errors, accounts that survive signing out, verification, Google sign-in, deletion — so the specs
 * exercise the real UI and sync code. Passwords are stored in plain text, which is fine for a test fixture and the
 * reason visitors never get it. "Continue with Google" signs in a fixed Google test account.
 */
type DemoAccount = Omit<AccountUser, "verified" | "provider"> & {
  password: string;
  verified: boolean;
  provider: AccountUser["provider"];
  favorites: string[];
  ratings: Ratings;
};
const ACCOUNTS = "wp-demo:accounts";
const SESSION = "wp-demo:session";
const GOOGLE = { email: "google.cook@example.com", name: "Google Cook" };

function accounts(): Record<string, DemoAccount> {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(ACCOUNTS) ?? "{}");
    return parsed && typeof parsed === "object" ? (parsed as Record<string, DemoAccount>) : {};
  } catch {
    return {};
  }
}
const saveAccounts = (all: Record<string, DemoAccount>) => localStorage.setItem(ACCOUNTS, JSON.stringify(all));
const listeners = new Set<(u: AccountUser | null) => void>();

const toUser = (a: DemoAccount): AccountUser => ({ uid: a.uid, email: a.email, name: a.name, verified: a.verified, provider: a.provider });

function current(): AccountUser | null {
  const email = localStorage.getItem(SESSION);
  const a = email ? accounts()[email] : undefined;
  return a ? toUser(a) : null;
}
const emit = () => listeners.forEach((l) => l(current()));
const later = <T>(run: () => T) =>
  new Promise<T>((resolve, reject) =>
    setTimeout(() => {
      try {
        resolve(run());
      } catch (e) {
        reject(e);
      }
    }, 150),
  );

function signedIn() {
  const email = localStorage.getItem(SESSION);
  const all = accounts();
  const a = email ? all[email] : undefined;
  if (!a) throw new AccountError("auth/no-current-user");
  return { all, a };
}

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
      all[key] = { uid: `demo-${Date.now()}`, email: key, name, password, verified: false, provider: "password", favorites: [], ratings: {} };
      saveAccounts(all);
      localStorage.setItem(SESSION, key);
      emit();
    }),
  signIn: (email, password) =>
    later(() => {
      const a = accounts()[email.toLowerCase()];
      if (!a || a.provider !== "password" || a.password !== password) throw new AccountError("auth/invalid-credential");
      localStorage.setItem(SESSION, a.email);
      emit();
    }),
  signInWithGoogle: () =>
    later(() => {
      const all = accounts();
      all[GOOGLE.email] ??= { uid: "demo-google", ...GOOGLE, password: "", verified: true, provider: "google", favorites: [], ratings: {} };
      saveAccounts(all);
      localStorage.setItem(SESSION, GOOGLE.email);
      emit();
    }),
  signOut: () =>
    later(() => {
      localStorage.removeItem(SESSION);
      emit();
    }),
  resetPassword: () => later(() => undefined),
  // The test fixture "clicks the link" straight away.
  sendVerification: () =>
    later(() => {
      const { all, a } = signedIn();
      a.verified = true;
      saveAccounts(all);
    }),
  refreshUser: () => later(() => current()),
  deleteAccount: () =>
    later(() => {
      const { all, a } = signedIn();
      delete all[a.email];
      saveAccounts(all);
      localStorage.removeItem(SESSION);
      emit();
    }),
  load: (uid) =>
    later(() => {
      const a = Object.values(accounts()).find((x) => x.uid === uid);
      return { favorites: cleanFavorites(a?.favorites), ratings: cleanRatings(a?.ratings) };
    }),
  save: (uid, data) =>
    later(() => {
      const all = accounts();
      const a = Object.values(all).find((x) => x.uid === uid);
      if (a) Object.assign(a, { favorites: data.favorites, ratings: data.ratings });
      saveAccounts(all);
    }),
};
