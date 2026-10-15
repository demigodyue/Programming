import { Logo } from "@/components/logo";
import { LazyThemeSwitch } from "@/components/theme-switch-lazy";
import { Footer1 } from "@/components/watermelon/footer-1";
import { cuisinesSeed } from "@/data/cuisines.seed";

const half = Math.ceil(cuisinesSeed.length / 2);

export function SiteFooter() {
  return (
    <Footer1
      logo={<Logo />}
      description="Famous dishes from around the world, written up properly — real ingredients, honest timings and the story behind each plate."
      aside={
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground text-sm">Theme</span>
          <LazyThemeSwitch />
        </div>
      }
      linkGroups={[
        {
          title: "Cook",
          links: [
            { label: "All recipes", href: "/recipes" },
            { label: "Quick meals", href: "/recipes?time=under-30" },
            { label: "Vegetarian", href: "/recipes?vegetarian=1" },
            { label: "Your favorites", href: "/favorites" },
          ],
        },
        {
          title: "Cuisines",
          links: cuisinesSeed.slice(0, half).map((c) => ({ label: c.name, href: `/cuisine/${c.slug}` })),
        },
        {
          title: "More cuisines",
          links: cuisinesSeed.slice(half).map((c) => ({ label: c.name, href: `/cuisine/${c.slug}` })),
        },
      ]}
      copyright={`© ${new Date().getFullYear()} World Plate`}
    />
  );
}
