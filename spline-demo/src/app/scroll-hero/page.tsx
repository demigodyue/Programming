import type { Metadata } from "next";
import Demo from "@/components/scroll-expansion-demo";

export const metadata: Metadata = {
  title: "Scroll Expansion Hero",
  description:
    "A hero whose media expands from a card to full bleed as you scroll, then releases the page.",
};

export default function ScrollHeroPage() {
  return <Demo />;
}
