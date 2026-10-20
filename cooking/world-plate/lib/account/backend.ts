/**
 * What the account system needs from a backend. The real one is Firebase (firebase-backend.ts): Authentication for
 * email + password accounts and Firestore for each account's favourites. demo-backend.ts is a stand-in that keeps
 * everything in localStorage — only the end-to-end tests switch it on, never visitors.
 */
export type AccountUser = { uid: string; email: string; name: string };

export interface AccountBackend {
  /** Calls back with the signed-in user (or null) now and whenever it changes. Returns an unsubscribe. */
  onUser(callback: (user: AccountUser | null) => void): () => void;
  signUp(name: string, email: string, password: string): Promise<void>;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  resetPassword(email: string): Promise<void>;
  loadFavorites(uid: string): Promise<string[]>;
  saveFavorites(uid: string, slugs: string[]): Promise<void>;
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

/** Account rules shared by both backends and the form. */
export const MIN_PASSWORD = 6;
export const MAX_FAVORITES = 300;

/** Guest favourites go first (they are the newest), then the account's, without repeats, capped. */
export function mergeFavorites(local: string[], remote: string[]) {
  return [...new Set([...local, ...remote])].slice(0, MAX_FAVORITES);
}
