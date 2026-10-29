import { initializeApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import {
  createUserWithEmailAndPassword,
  deleteUser,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { deleteDoc, doc, getDoc, getFirestore, serverTimestamp, setDoc } from "firebase/firestore/lite";
import { cleanFavorites, cleanRatings } from "@/lib/local-store";
import { RECIPE_SLUGS } from "@/lib/recipe-slugs";
import { AccountError, firebaseConfig, RECENT_SIGN_IN_MS, type AccountBackend, type AccountUser } from "./backend";

/**
 * Firebase accounts. Loaded on demand (lib/account/store.ts imports it dynamically), so visitors who never sign in
 * never download the SDK. Saved recipes and ratings live in Firestore at users/{uid} — firestore.rules lets each
 * account read and write only its own document, and only those fields. Firestore Lite is enough: the data is read once
 * at sign-in, then written back. Google sign-in uses a popup (it has to be enabled in the Firebase console).
 */
const app = initializeApp(firebaseConfig);
// App Check (optional): with a reCAPTCHA v3 site key set at build time, every request to Firebase carries a token
// proving it came from this site in a real browser, so scripts can't mass-create accounts or hammer the database.
// Turn on enforcement in the Firebase console only after the site is sending tokens (App Check → APIs → Metrics).
const recaptchaKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
if (recaptchaKey) initializeAppCheck(app, { provider: new ReCaptchaV3Provider(recaptchaKey), isTokenAutoRefreshEnabled: true });
const auth = getAuth(app);
const db = getFirestore(app);

const toUser = (u: User): AccountUser => {
  const google = u.providerData.some((p) => p.providerId === "google.com");
  return { uid: u.uid, email: u.email ?? "", name: u.displayName ?? "", verified: google || u.emailVerified, provider: google ? "google" : "password" };
};

/** Firebase errors carry a code such as "auth/invalid-credential"; the form shows a friendly message for it. */
async function wrap<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (e) {
    if (e instanceof AccountError) throw e;
    const code = typeof e === "object" && e && "code" in e ? String((e as { code: unknown }).code) : "unknown";
    throw new AccountError(code);
  }
}

const current = () => {
  if (!auth.currentUser) throw new AccountError("auth/no-current-user");
  return auth.currentUser;
};

export const firebaseBackend: AccountBackend = {
  onUser: (callback) => onAuthStateChanged(auth, (u) => callback(u ? toUser(u) : null)),

  signUp: (name, email, password) =>
    wrap(async () => {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(user, { displayName: name });
      // No saved-data fields here: the store is already syncing this browser's favourites into the new account.
      await setDoc(doc(db, "users", user.uid), { name, createdAt: serverTimestamp() }, { merge: true });
      // Best effort: the profile offers "resend" if this one doesn't arrive.
      await sendEmailVerification(user).catch(() => {});
    }),

  signIn: (email, password) => wrap(() => signInWithEmailAndPassword(auth, email, password).then(() => undefined)),

  signInWithGoogle: () =>
    wrap(async () => {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const { user } = await signInWithPopup(auth, provider);
      await setDoc(doc(db, "users", user.uid), { name: user.displayName ?? "", updatedAt: serverTimestamp() }, { merge: true });
    }),

  signOut: () => wrap(() => signOut(auth)),

  resetPassword: (email) => wrap(() => sendPasswordResetEmail(auth, email)),

  sendVerification: () => wrap(() => sendEmailVerification(current())),

  refreshUser: () =>
    wrap(async () => {
      const user = auth.currentUser;
      if (!user) return null;
      await user.reload();
      return toUser(user);
    }),

  deleteAccount: () =>
    wrap(async () => {
      const user = current();
      // Firebase refuses to delete an account signed in long ago; check first so nothing is deleted half-way.
      const last = Date.parse(user.metadata.lastSignInTime ?? "");
      if (!Number.isFinite(last) || Date.now() - last > RECENT_SIGN_IN_MS) throw new AccountError("auth/requires-recent-login");
      await deleteDoc(doc(db, "users", user.uid));
      await deleteUser(user);
    }),

  load: (uid) =>
    wrap(async () => {
      const data = (await getDoc(doc(db, "users", uid))).data();
      return { favorites: cleanFavorites(data?.favorites), ratings: cleanRatings(data?.ratings) };
    }),

  save: (uid, data) =>
    wrap(() =>
      // Only names the database rules accept (firestore.rules allows the known recipes, 1–5 stars): an old or
      // tampered entry in this browser would otherwise make every save fail.
      setDoc(
        doc(db, "users", uid),
        {
          favorites: data.favorites.filter((s) => RECIPE_SLUGS.has(s)),
          ratings: Object.fromEntries(Object.entries(data.ratings).filter(([s]) => RECIPE_SLUGS.has(s))),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      ),
    ),
};
