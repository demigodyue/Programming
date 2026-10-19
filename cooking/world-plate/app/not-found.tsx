import Link from "next/link";
import type { CSSProperties } from "react";
import { FlipFace, flipClass } from "@/components/motion/flip-face";
import { SlantText } from "@/components/motion/slant-text";

export default function NotFound() {
  return (
    <div className="hero-content container-page flex min-h-[80svh] flex-col items-center justify-center pt-32 pb-20 text-center">
      <p className="load-stagger label-caps text-muted-foreground flex items-center gap-2" style={{ "--i": 0 } as CSSProperties}>
        <span aria-hidden className="hex-outline text-foreground" />
        404
      </p>
      <SlantText as="h1" mode="load" text="This plate is empty." className="mt-6 block max-w-[12ch] text-[clamp(3.5rem,11vw,5.875rem)] leading-[0.92]" />
      <p className="load-stagger text-muted-foreground mt-6 max-w-md text-base" style={{ "--i": 1 } as CSSProperties}>
        The page you were looking for doesn&apos;t exist or has moved. The recipes are all still here.
      </p>
      <Link href="/recipes" data-accent="yellow" className={flipClass("solid", "load-stagger mt-8")} style={{ "--i": 2 } as CSSProperties}>
        <FlipFace>Browse recipes</FlipFace>
      </Link>
    </div>
  );
}
