"use client";

import Image, { type ImageProps } from "next/image";
import { useT } from "@/lib/lang";

/** next/image with alt text in both languages (an attribute, so CSS can't swap it — see lib/lang.ts). */
export function LImage({ alt, altJa, ...props }: ImageProps & { altJa: string }) {
  const t = useT();
  return <Image alt={alt && t(alt, altJa)} {...props} />;
}
