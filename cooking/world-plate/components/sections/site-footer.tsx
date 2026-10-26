import { T } from "@/components/i18n";
import { Logo } from "@/components/logo";
import { LazyThemeSwitch } from "@/components/theme-switch-lazy";
import { Footer1 } from "@/components/watermelon/footer-1";
import { cuisinesJa } from "@/data/cuisines.ja";
import { cuisinesSeed } from "@/data/cuisines.seed";

const half = Math.ceil(cuisinesSeed.length / 2);
const cuisineLink = (c: (typeof cuisinesSeed)[number]) => ({
  label: <T en={c.name} ja={cuisinesJa[c.slug]?.name ?? c.name} />,
  href: `/cuisine/${c.slug}`,
});

export function SiteFooter() {
  return (
    <Footer1
      logo={<Logo />}
      description={
        <T
          en="Famous dishes from around the world, written up properly — real ingredients, honest timings and the story behind each plate."
          ja="世界の名物料理を、きちんと。本物の材料、正確な時間、そして一皿ごとの物語とともに。"
        />
      }
      aside={
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground text-sm">
            <T en="Theme" ja="テーマ" />
          </span>
          <LazyThemeSwitch />
        </div>
      }
      linkGroups={[
        {
          title: <T en="Cook" ja="作る" />,
          links: [
            { label: <T en="All recipes" ja="すべてのレシピ" />, href: "/recipes" },
            { label: <T en="Quick meals" ja="時短ごはん" />, href: "/recipes?time=under-30" },
            { label: <T en="Vegetarian" ja="ベジタリアン" />, href: "/recipes?vegetarian=1" },
            { label: <T en="Your favorites" ja="お気に入り" />, href: "/favorites" },
            { label: <T en="Shopping list" ja="買い物リスト" />, href: "/shopping-list" },
            { label: <T en="Your account" ja="アカウント" />, href: "/account" },
          ],
        },
        { title: <T en="Cuisines" ja="各国料理" />, links: cuisinesSeed.slice(0, half).map(cuisineLink) },
        { title: <T en="More cuisines" ja="その他の国" />, links: cuisinesSeed.slice(half).map(cuisineLink) },
      ]}
      copyright={`© ${new Date().getFullYear()} World Plate`}
      credit={
        <T
          en={
            <>
              Photos from{" "}
              <a href="https://unsplash.com" className="hover-fine:text-foreground underline underline-offset-2">
                Unsplash
              </a>
            </>
          }
          ja={
            <>
              写真：
              <a href="https://unsplash.com" className="hover-fine:text-foreground underline underline-offset-2">
                Unsplash
              </a>
            </>
          }
        />
      }
    />
  );
}
