"use client";

import Link from "next/link";
import { T } from "@/components/i18n";
import { useAccount } from "@/lib/account/store";

/** Under the favourites title: where this list is kept, and an invitation to sign in when it's only on this browser. */
export function FavoritesNote() {
  const account = useAccount();
  const text = "text-muted-foreground text-base";

  if (account.status === "in") {
    return (
      <p className={text}>
        <T
          en={
            <>
              Saved to your account, <span className="text-foreground font-medium">{account.user.name || account.user.email}</span>. They
              follow you to any device.
            </>
          }
          ja={
            <>
              <span className="text-foreground font-medium">{account.user.name || account.user.email}</span>
              さんのアカウントに保存されています。どの端末からでも見られます。
            </>
          }
        />
      </p>
    );
  }
  if (account.status === "out") {
    return (
      <p className={text}>
        <T en="Saved on this browser." ja="このブラウザに保存されています。" />{" "}
        <Link href="/account" className="text-foreground link font-medium">
          <T en="Sign in to keep them on every device." ja="ログインすると、どの端末でも見られます。" />
        </Link>
      </p>
    );
  }
  return (
    <p className={text}>
      <T en="Saved on this browser. No account needed." ja="このブラウザに保存されます。アカウントは不要です。" />
    </p>
  );
}
