import Link from "next/link";
import { TextLinkLine } from "@/components/motion/flip-face";
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
  title: string;
  description?: string;
  action?: { href: string; label: string };
  /** Corner label, left — e.g. "01". */
  index?: string;
  /** Corner label, right — e.g. "This week". */
  label?: string;
}) {
  return (
    <div className="mb-12 md:mb-16">
      {(index || label) && (
        <div className="rule-draw label-caps text-muted-foreground mb-10 flex justify-between pt-4">
          <span>{index}</span>
          <span>{label}</span>
        </div>
      )}
      <ScrubWords id={id} text={title} className="text-display mx-auto block max-w-[14ch] text-center text-balance" />
      {(description || action) && (
        <div className="mt-6 flex flex-col items-center gap-3 text-center">
          {description && <p className="text-muted-foreground max-w-md text-[0.9375rem] leading-relaxed">{description}</p>}
          {action && (
            <Link href={action.href} className="text-link py-3 text-sm">
              {action.label}
              <TextLinkLine />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
