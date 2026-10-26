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

export type Ratings = Record<string, number>;

// Storage is outside our control (another tab, an extension, an old version of the site, a hand edit), so what comes
// back is checked, not trusted: only recipe-slug-shaped strings, whole-star ratings 1–5, and sane list sizes survive.
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_ITEMS = 300;

export function cleanFavorites(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((s): s is string => typeof s === "string" && s.length <= 80 && SLUG.test(s)))].slice(0, MAX_ITEMS);
}

export function cleanRatings(value: unknown): Ratings {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: Ratings = {};
  for (const [slug, stars] of Object.entries(value).slice(0, MAX_ITEMS)) {
    if (slug.length <= 80 && SLUG.test(slug) && Number.isInteger(stars) && stars >= 1 && stars <= 5) out[slug] = stars;
  }
  return out;
}

function read<T>(key: string, clean: (value: unknown) => T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return clean(raw ? JSON.parse(raw) : null);
  } catch {
    return clean(null);
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
function snapshot<T>(key: string, clean: (value: unknown) => T): T {
  if (!cache.has(key)) cache.set(key, read(key, clean));
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

/** Saved recipe slugs, newest first. `null` until hydrated (the server render can't know). */
export function useFavorites(): string[] | null {
  return useSyncExternalStore(
    subscribe,
    () => snapshot(FAVORITES_KEY, cleanFavorites),
    () => null,
  );
}

/** The saved list right now, for the account sync. */
export function readFavorites(): string[] {
  return read(FAVORITES_KEY, cleanFavorites);
}

/** Replace the whole list (the account's copy arriving at sign-in, or empty at sign-out). */
export function replaceFavorites(slugs: string[]) {
  write(FAVORITES_KEY, cleanFavorites(slugs));
}

/** This browser's ratings right now, for the account sync. */
export function readRatings(): Ratings {
  return read(RATINGS_KEY, cleanRatings);
}

/** Replace all ratings (the account's arriving at sign-in, or none at sign-out). */
export function replaceRatings(ratings: Ratings) {
  write(RATINGS_KEY, cleanRatings(ratings));
}

/** Calls back after any change to favourites or ratings, from this tab or another. */
export function onStoreChange(callback: () => void) {
  return subscribe(callback);
}

export function setFavorite(slug: string, saved: boolean) {
  const list = readFavorites().filter((s) => s !== slug);
  write(FAVORITES_KEY, cleanFavorites(saved ? [slug, ...list] : list));
}

export function useRating(slug: string): number | null | undefined {
  const ratings = useSyncExternalStore(
    subscribe,
    () => snapshot(RATINGS_KEY, cleanRatings),
    () => undefined,
  );
  return ratings === undefined ? undefined : (ratings[slug] ?? null);
}

export function setRating(slug: string, stars: number) {
  write(RATINGS_KEY, cleanRatings({ ...readRatings(), [slug]: stars }));
}
