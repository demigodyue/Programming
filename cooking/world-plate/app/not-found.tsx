import Link from "next/link";
import { WordReveal } from "@/components/motion/word-reveal";

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[80svh] flex-col items-center justify-center pt-32 pb-20 text-center">
      <p className="label-caps text-muted-foreground flex items-center gap-2">
        <span aria-hidden className="hex-outline text-foreground" />
        404
      </p>
      <WordReveal text="This plate is empty." className="mt-6 max-w-[12ch] text-[clamp(3.5rem,11vw,5.875rem)] leading-[0.84]" />
      <p className="text-muted-foreground mt-6 max-w-md text-base">
        The page you were looking for doesn&apos;t exist or has moved. The recipes are all still here.
      </p>
      <Link
        href="/recipes"
        className="btn-swap bg-primary text-primary-foreground mt-8 inline-flex min-h-11 items-center rounded-full px-[17px] py-[9px] text-sm"
      >
        Browse recipes
      </Link>
    </div>
  );
}
