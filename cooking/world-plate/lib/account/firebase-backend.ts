import { initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { doc, getDoc, getFirestore, serverTimestamp, setDoc } from "firebase/firestore/lite";
import { AccountError, firebaseConfig, type AccountBackend, type AccountUser } from "./backend";

/**
 * Firebase accounts. Loaded on demand (lib/account/store.ts imports it dynamically), so visitors who never sign in
 * never download the SDK. Favourites live in Firestore at users/{uid} — firestore.rules lets each account read and
 * write only its own document. Firestore Lite is enough: favourites are read once at sign-in, then written back.
 */
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const toUser = (u: User): AccountUser => ({ uid: u.uid, email: u.email ?? "", name: u.displayName ?? "" });

/** Firebase errors carry a code such as "auth/invalid-credential"; the form shows a friendly message for it. */
async function wrap<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (e) {
    const code = typeof e === "object" && e && "code" in e ? String((e as { code: unknown }).code) : "unknown";
    throw new AccountError(code);
  }
}

export const firebaseBackend: AccountBackend = {
  onUser: (callback) => onAuthStateChanged(auth, (u) => callback(u ? toUser(u) : null)),

  signUp: (name, email, password) =>
    wrap(async () => {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(user, { displayName: name });
      // No favourites field here: the store is already syncing this browser's favourites into the new account.
      await setDoc(doc(db, "users", user.uid), { name, createdAt: serverTimestamp() }, { merge: true });
    }),

  signIn: (email, password) => wrap(() => signInWithEmailAndPassword(auth, email, password).then(() => undefined)),

  signOut: () => wrap(() => signOut(auth)),

  resetPassword: (email) => wrap(() => sendPasswordResetEmail(auth, email)),

  loadFavorites: (uid) =>
    wrap(async () => {
      const snap = await getDoc(doc(db, "users", uid));
      const list: unknown = snap.data()?.favorites;
      return Array.isArray(list) ? list.filter((s): s is string => typeof s === "string") : [];
    }),

  saveFavorites: (uid, slugs) =>
    wrap(() => setDoc(doc(db, "users", uid), { favorites: slugs, updatedAt: serverTimestamp() }, { merge: true })),
};
