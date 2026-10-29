"use client";

import { UserRound } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/account/avatar";
import { useAccount } from "@/lib/account/store";
import { useT } from "@/lib/lang";
import { cn } from "@/lib/utils";

/** Header circle to the account page: a person icon, or the signed-in cook's picture (components/account/avatar.tsx). */
export function AccountButton({ className }: { className?: string }) {
  const account = useAccount();
  const t = useT();
  const user = account.status === "in" ? account.user : null;
  const initial = user ? (user.name || user.email).trim().charAt(0).toUpperCase() : "";

  return (
    <Link
      href="/account"
      aria-label={user ? t(`Your account (${user.email})`, `アカウント（${user.email}）`) : t("Sign in or create an account", "ログイン・新規登録")}
      className={cn("grid place-items-center rounded-full", className)}
    >
      {user ? (
        <Avatar user={user} className="size-full" />
      ) : initial ? (
        <span aria-hidden className="font-display text-xl leading-none">
          {initial}
        </span>
      ) : (
        <UserRound className="size-[18px]" strokeWidth={1.75} aria-hidden />
      )}
    </Link>
  );
}
