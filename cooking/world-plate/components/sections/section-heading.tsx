import Link from "next/link";
import { MaskReveal } from "@/components/motion/mask-reveal";
import { Reveal, RevealItem } from "@/components/motion/reveal";

/**
 * Exhibition-wall section title: small uppercase labels in opposite corners, then a centred
 * display serif title that rises out of a mask, a short grotesk description and one ghost link.
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
      <h2 id={id} className="text-display mx-auto max-w-[14ch] text-center text-balance">
        <MaskReveal>{title}</MaskReveal>
      </h2>
      {(description || action) && (
        <Reveal className="mt-6 flex flex-col items-center gap-3 text-center">
          {description && (
            <RevealItem as="p" className="text-muted-foreground max-w-md text-[0.9375rem] leading-relaxed">
              {description}
            </RevealItem>
          )}
          {action && (
            <RevealItem>
              <Link
                href={action.href}
                className="link-u inline-flex items-center py-3 text-sm"
              >
                {action.label}
              </Link>
            </RevealItem>
          )}
        </Reveal>
      )}
    </div>
  );
}
