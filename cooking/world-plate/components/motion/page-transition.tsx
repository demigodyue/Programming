import { ViewTransition, type ReactNode } from "react";

/**
 * Wraps a page's content so route changes crossfade with a short rise (see `.page-fade` in globals.css).
 * Must live in each page, not the layout — layouts persist, so enter/exit never fire there.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="page-fade" exit="page-fade" default="none">
      {children}
    </ViewTransition>
  );
}
