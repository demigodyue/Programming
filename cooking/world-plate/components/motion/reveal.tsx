"use client";

import { m, type Variants } from "motion/react";
import type { ComponentProps, ElementType } from "react";

// LaunchDarkly widgetFadeSlideIn curve.
const EASE_LD = [0.22, 0.61, 0.36, 1] as const;

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.08 } },
};

const item: Variants = {
  // `y` (not a transform string) so MotionConfig reducedMotion="user" can drop it.
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE_LD } },
};

type RevealProps = ComponentProps<typeof m.div> & { as?: "div" | "section" | "ul" | "ol" | "header" };

/**
 * Scroll-triggered reveal that runs once. Children wrapped in <RevealItem> stagger in.
 * Reduced motion: opacity only (MotionConfig reducedMotion="user" drops the transform).
 */
export function Reveal({ as = "div", children, ...props }: RevealProps) {
  const Tag = m[as] as ElementType;
  return (
    <Tag
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15, margin: "0px 0px -8% 0px" }}
      variants={container}
      {...props}
    >
      {children}
    </Tag>
  );
}

export function RevealItem({
  as = "div",
  children,
  ...props
}: ComponentProps<typeof m.div> & { as?: "div" | "li" | "article" | "p" | "h1" | "h2" }) {
  const Tag = m[as] as ElementType;
  return (
    <Tag variants={item} {...props}>
      {children}
    </Tag>
  );
}
