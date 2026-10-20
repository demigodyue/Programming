"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { bootAccount } from "@/lib/account/store";

/** Starts the account store on every page; the account page needs the backend straight away. */
export function AccountBoot() {
  const pathname = usePathname();
  useEffect(() => {
    bootAccount(pathname.startsWith("/account"));
  }, [pathname]);
  return null;
}
