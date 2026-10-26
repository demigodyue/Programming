import type { Ratings } from "@/lib/local-store";

/**
 * What the account system needs from a backend. The real one is Firebase (firebase-backend.ts): Authentication for
 * email + password and Google accounts, and Firestore for each account's saved recipes and ratings. demo-backend.ts is
 * a stand-in that keeps everything in localStorage — only the end-to-end tests switch it on, never visitors.
 */
export type AccountUser = {
  uid: string;
  email: string;
  name: string;
  /** Email address confirmed (always true for Google accounts). */
  verified: boolean;
  provider: "password" | "google";
};

/** What an account keeps: saved recipe slugs (newest first) and star ratings by slug. */
export type SavedData = { favorites: string[]; ratings: Ratings };

export interface AccountBackend {
  /** Calls back with the signed-in user (or null) now and whenever it changes. Returns an unsubscribe. */
  onUser(callback: (user: AccountUser | null) => void): () => void;
  signUp(name: string, email: string, password: string): Promise<void>;
  signIn(email: string, password: string): Promise<void>;
  signInWithGoogle(): Promise<void>;
  signOut(): Promise<void>;
  resetPassword(email: string): Promise<void>;
  /** Email the signed-in user a link to confirm their address. */
  sendVerification(): Promise<void>;
  /** Re-read the signed-in user (after they've clicked the verification link). */
  refreshUser(): Promise<AccountUser | null>;
  /** Delete the account and everything it saved. Needs a recent sign-in ("auth/requires-recent-login" otherwise). */
  deleteAccount(): Promise<void>;
  load(uid: string): Promise<SavedData>;
  save(uid: string, data: SavedData): Promise<void>;
}

/** Firebase's web config. These keys identify the project and are public by design; the Firestore rules protect data. */
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || undefined,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || undefined,
};

export const firebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);

/** The E2E specs set this flag to run the account flow without a Firebase project. */
export const DEMO_FLAG = "wp-account-demo";

export class AccountError extends Error {
  constructor(public code: string) {
    super(code);
  }
}

/** Account rules shared by both backends and the form. Firebase's own minimum is 6; we ask for 8. */
export const MIN_PASSWORD = 8;
export const MAX_FAVORITES = 300;

/** Guest favourites go first (they are the newest), then the account's, without repeats, capped. */
export function mergeFavorites(local: string[], remote: string[]) {
  return [...new Set([...local, ...remote])].slice(0, MAX_FAVORITES);
}

/** Ratings made on this browser win over the account's older ones for the same recipe. */
export function mergeRatings(local: Ratings, remote: Ratings): Ratings {
  return Object.fromEntries(Object.entries({ ...remote, ...local }).slice(0, MAX_FAVORITES));
}

/** A sign-in counts as recent for this long — deleting an account needs one (Firebase asks for ~5 minutes). */
export const RECENT_SIGN_IN_MS = 5 * 60 * 1000;
