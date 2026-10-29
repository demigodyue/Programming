"use client";

import { Check, ImageUp, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { T } from "@/components/i18n";
import type { AccountUser } from "@/lib/account/backend";
import { setAvatar } from "@/lib/account/store";
import { AVATAR_PRESETS, googlePhoto, makeAvatar, presetSrc, resolveAvatar } from "@/lib/avatar";
import { useT } from "@/lib/lang";
import { cn } from "@/lib/utils";

/** The account's picture in a circle (lib/avatar.ts decides which). Decorative: names and emails say who it is. */
export function Avatar({ user, className }: { user: AccountUser; className?: string }) {
  const a = resolveAvatar(user);
  return (
    // eslint-disable-next-line @next/next/no-img-element -- data URLs and Google photos, not Unsplash
    <img
      src={a.src}
      alt=""
      aria-hidden
      width={192}
      height={192}
      decoding="async"
      draggable={false}
      // Google's photo servers refuse some requests that carry a referrer.
      referrerPolicy="no-referrer"
      className={cn("rounded-full object-cover select-none", a.kind === "custom" || a.kind === "google" ? "bg-muted" : "", className)}
    />
  );
}

/**
 * Choosing a profile picture, in the profile: the Google photo (Google accounts), any of the food avatars, or the
 * visitor's own picture (shrunk to a small square in the browser and saved in the account). Saves as soon as you pick.
 */
export function AvatarPicker({ user }: { user: AccountUser }) {
  const t = useT();
  const file = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<"" | "image" | "save">("");
  const current = resolveAvatar(user);
  const google = googlePhoto(user.photoURL);

  const choose = async (value: string) => {
    setBusy(true);
    setError("");
    try {
      await setAvatar(value);
    } catch {
      setError("save");
    } finally {
      setBusy(false);
    }
  };

  const optionClass = (selected: boolean) =>
    cn(
      "relative size-14 rounded-full transition-transform hover-fine:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60",
      selected && "ring-primary ring-[3px] ring-offset-2 ring-offset-[var(--card)]",
    );
  const tick = (
    <span className="bg-primary text-primary-foreground absolute -right-0.5 -bottom-0.5 grid size-5 place-items-center rounded-full">
      <Check className="size-3" strokeWidth={3} aria-hidden />
    </span>
  );

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="avatar-picker"
        className="link text-muted-foreground text-sm"
      >
        {open ? <T en="Done" ja="閉じる" /> : <T en="Change picture" ja="写真を変更" />}
      </button>

      {open && (
        <div id="avatar-picker" className="bg-background mt-4 rounded-lg border p-4 text-left">
          <p className="label-caps text-muted-foreground mb-3">
            <T en="Choose a picture" ja="写真を選ぶ" />
          </p>
          <ul role="list" className="flex flex-wrap justify-center gap-3">
            {google && (
              <li>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void choose("google")}
                  aria-pressed={current.kind === "google"}
                  aria-label={t("My Google photo", "Googleアカウントの写真")}
                  className={optionClass(current.kind === "google")}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- Google profile photo */}
                  <img src={google} alt="" referrerPolicy="no-referrer" className="size-full rounded-full object-cover" />
                  {current.kind === "google" && tick}
                </button>
              </li>
            )}
            {AVATAR_PRESETS.map((p) => {
              const selected = current.kind === "preset" && current.preset === p.id;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void choose(`preset:${p.id}`)}
                    aria-pressed={selected}
                    aria-label={t(p.en, p.ja)}
                    className={optionClass(selected)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- small static avatar */}
                    <img src={presetSrc(p.id)} alt="" width={56} height={56} loading="lazy" className="size-full rounded-full" />
                    {selected && tick}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mt-4 flex flex-col items-center gap-2 border-t pt-4">
            <input
              ref={file}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/avif,image/heic"
              className="sr-only"
              aria-label={t("Upload your own picture", "自分の写真をアップロード")}
              onChange={async (e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (!f) return;
                setBusy(true);
                setError("");
                let url = "";
                try {
                  url = await makeAvatar(f);
                } catch {
                  setError("image");
                  setBusy(false);
                  return;
                }
                setBusy(false);
                await choose(url);
              }}
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => file.current?.click()}
              className={cn(
                "hover-fine:bg-muted inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium disabled:opacity-60",
                current.kind === "custom" && "border-primary",
              )}
            >
              {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <ImageUp className="size-4" strokeWidth={1.75} aria-hidden />}
              {current.kind === "custom" ? <T en="Upload a different picture" ja="別の写真をアップロード" /> : <T en="Upload your own" ja="自分の写真をアップロード" />}
            </button>
            <p className="text-muted-foreground text-center text-xs">
              <T
                en="It's cropped to a square and made small on your device before it's saved."
                ja="保存する前に、端末上で正方形に切り抜いて小さくします。"
              />
            </p>
            {error && (
              <p role="alert" className="text-destructive text-center text-sm font-medium">
                {error === "image" ? (
                  <T en="That picture couldn't be used. Try a JPEG or PNG photo." ja="この画像は使えませんでした。JPEGかPNGの写真でお試しください。" />
                ) : (
                  <T en="Couldn't save it. Check your connection and try again." ja="保存できませんでした。接続を確認して、もう一度お試しください。" />
                )}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
