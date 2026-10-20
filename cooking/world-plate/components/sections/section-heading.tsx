import Link from "next/link";
import { TextLinkLine } from "@/components/motion/flip-face";
import { T } from "@/components/i18n";
import { ScrubWords } from "@/components/motion/scrub-words";

/**
 * Section title: small uppercase labels in opposite corners, then a centred display title that fills
 * word by word as you scroll (Hungry Tiger's scrub, ScrubWords), a short description and one text link
 * with Slush's sweeping underline.
 */
export function SectionHeading({
  id,
  title,
  description,
  action,
  index,
  label,
}: {
  id: string;
  /** Each text comes in both languages; Japanese titles mark their phrases with "|" (see ScrubWords). */
  title: { en: string; ja: string };
  description?: { en: string; ja: string };
  action?: { href: string; label: { en: string; ja: string } };
  /** Corner label, left — e.g. "01". */
  index?: { en: string; ja: string };
  /** Corner label, right — e.g. "This week". */
  label?: { en: string; ja: string };
}) {
  return (
    <div className="mb-12 md:mb-16">
      {(index || label) && (
        <div className="rule-draw label-caps text-muted-foreground mb-10 flex justify-between pt-4">
          <span>{index && <T {...index} />}</span>
          <span>{label && <T {...label} />}</span>
        </div>
      )}
      <ScrubWords id={id} text={title.en} ja={title.ja} className="text-display mx-auto block max-w-[14ch] text-center text-balance" />
      {(description || action) && (
        <div className="mt-6 flex flex-col items-center gap-3 text-center">
          {description && (
            <p className="text-muted-foreground max-w-md text-[0.9375rem] leading-relaxed">
              <T {...description} />
            </p>
          )}
          {action && (
            <Link href={action.href} className="text-link py-3 text-sm">
              <T {...action.label} />
              <TextLinkLine />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
