"use client";

import { useSyncExternalStore } from "react";
import { onStoreChange, readFavorites, readRatings, replaceFavorites, replaceRatings } from "@/lib/local-store";
import {
  DEMO_FLAG,
  firebaseConfigured,
  mergeFavorites,
  mergeRatings,
  type AccountBackend,
  type AccountUser,
  type SavedData,
} from "./backend";

/**
 * The visitor's account, as an external store for React.
 *
 * - "off": accounts aren't set up (no Firebase config in this build) — the UI explains instead of offering a form.
 * - "loading": the backend is starting and restoring a saved session.
 * - "out" / "in": signed out or signed in.
 *
 * The Firebase SDK is only downloaded when it's needed: on the account page, when a form is submitted, or on any page
 * when this browser was signed in last time (the HINT flag). Everyone else browses without it.
 *
 * While signed in, the favourites and star ratings in localStorage are the account's: they're merged with the
 * account's at sign-in, every change is written back (debounced), and they're cleared at sign-out.
 */
export type AccountState =
  | { status: "off" | "loading" | "out" }
  | { status: "in"; user: AccountUser; syncing: boolean };

const HINT = "wp:signed-in";
let state: AccountState = { status: "loading" };
const listeners = new Set<() => void>();
const set = (next: AccountState) => {
  state = next;
  listeners.forEach((l) => l());
};

// The localStorage stand-in backend exists for the end-to-end tests only: the test build sets
// NEXT_PUBLIC_ACCOUNT_DEMO, and only then does the DEMO_FLAG in localStorage switch it on. A published build ignores it.
const demoAllowed = process.env.NEXT_PUBLIC_ACCOUNT_DEMO === "1";
const demo = () => {
  if (!demoAllowed) return false;
  try {
    return localStorage.getItem(DEMO_FLAG) === "1";
  } catch {
    return false;
  }
};

export const accountsAvailable = () => firebaseConfigured || demo();

let backendPromise: Promise<AccountBackend> | null = null;
function backend() {
  backendPromise ??= (
    demo() ? import("./demo-backend").then((m) => m.demoBackend) : import("./firebase-backend").then((m) => m.firebaseBackend)
  ).then((b) => {
    b.onUser(onUser);
    return b;
  });
  return backendPromise;
}

const hint = (on: boolean) => {
  try {
    if (on) localStorage.setItem(HINT, "1");
    else localStorage.removeItem(HINT);
  } catch {}
};

const local = (): SavedData => ({ favorites: readFavorites(), ratings: readRatings() });
const same = (a: SavedData, b: SavedData) => JSON.stringify(a) === JSON.stringify(b);

let lastSynced = "";
let saveTimer = 0;
let syncedUid: string | null = null;

async function onUser(user: AccountUser | null) {
  if (!user) {
    // Signed out (or the session expired): the saved data belonged to the account, so this browser forgets it.
    const wasSynced = syncedUid !== null;
    syncedUid = null; // first, so clearing below isn't written back to the account
    if (wasSynced) {
      replaceFavorites([]);
      replaceRatings({});
    }
    hint(false);
    set({ status: "out" });
    return;
  }
  hint(true);
  const keepName = state.status === "in" && state.user.uid === user.uid && !user.name ? state.user.name : user.name;
  const fresh = syncedUid !== user.uid;
  set({ status: "in", user: { ...user, name: keepName }, syncing: fresh });
  if (!fresh) return;
  syncedUid = user.uid;
  try {
    const b = await backend();
    const remote = await b.load(user.uid);
    const mine = local();
    const merged: SavedData = { favorites: mergeFavorites(mine.favorites, remote.favorites), ratings: mergeRatings(mine.ratings, remote.ratings) };
    lastSynced = JSON.stringify(merged);
    replaceFavorites(merged.favorites);
    replaceRatings(merged.ratings);
    if (!same(merged, remote)) await b.save(user.uid, merged);
  } catch {
    // Offline or blocked: keep the local data; the next change tries again.
  }
  if (state.status === "in") set({ ...state, syncing: false });
}

// Write local changes (favourites or ratings) back to the account, half a second after the last one.
function watchSavedData() {
  return onStoreChange(() => {
    // While the sign-in merge runs it reads the local data itself, so changes made meanwhile aren't lost.
    if (state.status !== "in" || state.syncing || !syncedUid) return;
    const data = local();
    const json = JSON.stringify(data);
    if (json === lastSynced) return;
    window.clearTimeout(saveTimer);
    const uid = syncedUid;
    saveTimer = window.setTimeout(async () => {
      try {
        await (await backend()).save(uid, data);
        lastSynced = json;
      } catch {}
    }, 500);
  });
}

let booted = false;
/** Called once on every page (AccountBoot). `eager` starts the backend even without a saved session. */
export function bootAccount(eager: boolean) {
  if (booted) {
    if (eager && accountsAvailable() && !backendPromise) void backend();
    return;
  }
  booted = true;
  if (!accountsAvailable()) return set({ status: "off" });
  watchSavedData();
  let signedInBefore = false;
  try {
    signedInBefore = localStorage.getItem(HINT) === "1";
  } catch {}
  if (eager || signedInBefore) void backend();
  else set({ status: "out" });
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const LOADING: AccountState = { status: "loading" };

export function useAccount(): AccountState {
  return useSyncExternalStore(subscribe, () => state, () => LOADING);
}

export async function signUp(name: string, email: string, password: string) {
  await (await backend()).signUp(name, email, password);
  // Firebase reports the new user before the display name is saved; fill it in here.
  if (state.status === "in" && !state.user.name) set({ ...state, user: { ...state.user, name } });
}

export async function signIn(email: string, password: string) {
  await (await backend()).signIn(email, password);
}

export async function signInWithGoogle() {
  await (await backend()).signInWithGoogle();
}

export async function signOut() {
  window.clearTimeout(saveTimer);
  await (await backend()).signOut();
}

export async function resetPassword(email: string) {
  await (await backend()).resetPassword(email);
}

export async function sendVerification() {
  await (await backend()).sendVerification();
}

/** Re-read the user (e.g. after they clicked the verification link) and update the store. */
export async function refreshUser() {
  const user = await (await backend()).refreshUser();
  if (user && state.status === "in") set({ ...state, user: { ...user, name: user.name || state.user.name } });
}

export async function deleteAccount() {
  window.clearTimeout(saveTimer);
  await (await backend()).deleteAccount();
}
