/**
 * Profile pictures. An account's `avatar` (saved in its Firestore document, firestore.rules checks the same shapes):
 * - "google"                 the photo from the visitor's Google account
 * - "preset:<id>"            one of the food avatars in public/avatars (Fluent Emoji 3D, MIT)
 * - "data:image/…;base64,…"  their own picture, shrunk in the browser to a small square (uploadAvatar below)
 * With nothing chosen, Google accounts show their Google photo and everyone else a food avatar picked from their uid.
 */
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const AVATAR_PRESETS = [
  { id: "dumpling", en: "Dumpling", ja: "餃子" },
  { id: "sushi", en: "Sushi", ja: "寿司" },
  { id: "taco", en: "Taco", ja: "タコス" },
  { id: "pizza", en: "Pizza", ja: "ピザ" },
  { id: "ramen", en: "Ramen", ja: "ラーメン" },
  { id: "croissant", en: "Croissant", ja: "クロワッサン" },
  { id: "avocado", en: "Avocado", ja: "アボカド" },
  { id: "chili", en: "Chilli", ja: "唐辛子" },
  { id: "onigiri", en: "Onigiri", ja: "おにぎり" },
  { id: "cake", en: "Shortcake", ja: "ショートケーキ" },
  { id: "curry", en: "Curry rice", ja: "カレーライス" },
  { id: "pancakes", en: "Pancakes", ja: "パンケーキ" },
] as const;

export type AvatarPreset = (typeof AVATAR_PRESETS)[number]["id"];

/** Largest custom picture accepted (characters of the data URL); a 192 px square is usually 8–30 KB. */
export const MAX_AVATAR_LENGTH = 60_000;
export const AVATAR_SIZE = 192;

const PRESET = /^preset:([a-z]+)$/;
const DATA_URL = /^data:image\/(webp|jpeg);base64,[A-Za-z0-9+/]+={0,2}$/;

/** A saved avatar value, if it's one of the allowed shapes (anything else from storage is dropped). */
export function cleanAvatar(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  if (value === "google") return value;
  const preset = PRESET.exec(value)?.[1];
  if (preset) return AVATAR_PRESETS.some((p) => p.id === preset) ? value : undefined;
  return value.length <= MAX_AVATAR_LENGTH && DATA_URL.test(value) ? value : undefined;
}

export const presetSrc = (id: string) => `${BASE}/avatars/${id}.webp`;

/** The food avatar someone gets by default: stable for an account, spread across the set. */
export function defaultPreset(uid: string): AvatarPreset {
  let h = 0;
  for (const ch of uid) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_PRESETS[h % AVATAR_PRESETS.length].id;
}

/** Google's profile photos come at 96 px; ask for one sharp enough for the profile circle. */
export function googlePhoto(url: string | null | undefined) {
  if (!url || !/^https:\/\/lh3\.googleusercontent\.com\//.test(url)) return null;
  return url.replace(/=s\d+(-c)?$/, "") + "=s256-c";
}

export type AvatarSource = { kind: "google" | "preset" | "custom"; src: string; preset?: string };

/** Which picture to show for an account. */
export function resolveAvatar(user: { uid: string; photoURL?: string | null; avatar?: string }): AvatarSource {
  const avatar = cleanAvatar(user.avatar);
  const google = googlePhoto(user.photoURL);
  if (avatar?.startsWith("data:")) return { kind: "custom", src: avatar };
  const preset = avatar && PRESET.exec(avatar)?.[1];
  if (preset) return { kind: "preset", src: presetSrc(preset), preset };
  if (google && (avatar === "google" || !avatar)) return { kind: "google", src: google };
  const id = defaultPreset(user.uid);
  return { kind: "preset", src: presetSrc(id), preset: id };
}

/**
 * Turns a picture the visitor picked into a small square avatar: decoded by the browser, centre-cropped, drawn to a
 * 192 px canvas and re-encoded as WebP (JPEG where WebP encoding isn't supported). Re-encoding means whatever was
 * uploaded (any format, any metadata such as GPS location) never leaves the device; only these pixels do.
 */
export async function makeAvatar(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("not-an-image");
  if (file.size > 15 * 1024 * 1024) throw new Error("too-large");
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error("unreadable");
  });
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = AVATAR_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("unreadable");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE);
  bitmap.close();
  for (const quality of [0.85, 0.7, 0.55, 0.4]) {
    for (const type of ["image/webp", "image/jpeg"]) {
      const url = canvas.toDataURL(type, quality);
      if (url.startsWith(`data:${type};`) && url.length <= MAX_AVATAR_LENGTH) return url;
    }
  }
  throw new Error("too-large");
}
