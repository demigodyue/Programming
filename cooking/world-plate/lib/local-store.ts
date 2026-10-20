"use client";

import { useSyncExternalStore } from "react";

/**
 * Favorites and ratings live in this browser's localStorage — the site is a static export
 * (served by Live Server / any static host), so there is no server to keep them. When someone signs in, the account
 * store (lib/account/store.ts) syncs this list with their account: it merges it in at sign-in, writes every change
 * back, and clears it at sign-out.
 * Every read and write is wrapped: storage can be missing (private mode, blocked site data).
 */

const FAVORITES_KEY = "wp:favorites";
const RATINGS_KEY = "wp:ratings";
const EVENT = "wp:store";

type Ratings = Record<string, number>;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable: the change still applies for this page view.
  }
  cache.delete(key);
  window.dispatchEvent(new Event(EVENT));
}

// useSyncExternalStore needs referentially stable snapshots.
const cache = new Map<string, unknown>();
function snapshot<T>(key: string, fallback: T): T {
  if (!cache.has(key)) cache.set(key, read(key, fallback));
  return cache.get(key) as T;
}

function subscribe(onChange: () => void) {
  const handler = (e: Event) => {
    if (e instanceof StorageEvent) cache.clear(); // another tab changed it
    onChange();
  };
  window.addEventListener(EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

const EMPTY_LIST: string[] = [];
const EMPTY_RATINGS: Ratings = {};

/** Saved recipe slugs, newest first. `null` until hydrated (the server render can't know). */
export function useFavorites(): string[] | null {
  return useSyncExternalStore(
    subscribe,
    () => snapshot<string[]>(FAVORITES_KEY, EMPTY_LIST),
    () => null,
  );
}

/** The saved list right now, for the account sync. */
export function readFavorites(): string[] {
  return read<string[]>(FAVORITES_KEY, []);
}

/** Replace the whole list (the account's copy arriving at sign-in, or empty at sign-out). */
export function replaceFavorites(slugs: string[]) {
  write(FAVORITES_KEY, slugs);
}

/** Calls back after any change to favourites or ratings, from this tab or another. */
export function onStoreChange(callback: () => void) {
  return subscribe(callback);
}

export function setFavorite(slug: string, saved: boolean) {
  const list = read<string[]>(FAVORITES_KEY, []).filter((s) => s !== slug);
  write(FAVORITES_KEY, saved ? [slug, ...list] : list);
}

export function useRating(slug: string): number | null | undefined {
  const ratings = useSyncExternalStore(
    subscribe,
    () => snapshot<Ratings>(RATINGS_KEY, EMPTY_RATINGS),
    () => undefined,
  );
  return ratings === undefined ? undefined : (ratings[slug] ?? null);
}

export function setRating(slug: string, stars: number) {
  write(RATINGS_KEY, { ...read<Ratings>(RATINGS_KEY, {}), [slug]: stars });
}
