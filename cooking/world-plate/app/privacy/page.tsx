import type { CSSProperties, ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { T } from "@/components/i18n";
import { SlantText } from "@/components/motion/slant-text";
import { jaTitle } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What Sizzle Atlas stores about you, where, and how to delete it.",
  alternates: { canonical: "/privacy" },
  other: jaTitle("プライバシー"),
};

function Section({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <section className="border-b py-8">
      <h2 className="text-headline mb-4 text-xl leading-tight">{title}</h2>
      <div className="space-y-3 text-[0.9375rem] leading-relaxed">{children}</div>
    </section>
  );
}

/** Plain-language privacy notice, in both languages. Keep it in step with lib/local-store.ts, lib/account and lib/csp.ts. */
export default function PrivacyPage() {
  return (
    <div className="container-page pt-32 pb-24 md:pt-36">
      <header className="hero-content mb-6 flex flex-col items-center border-b pb-12 text-center">
        <SlantText as="h1" mode="load" text="Privacy" ja="プライバシー" className="block text-[clamp(2.75rem,8vw,5rem)] leading-[0.95]" />
        <p className="load-stagger text-muted-foreground mt-6 max-w-md" style={{ "--i": 0 } as CSSProperties}>
          <T
            en="No ads, no tracking, no analytics. Here is everything the site keeps, and how to remove it."
            ja="広告・追跡・アクセス解析はありません。このサイトが保存するものと、その消し方をすべて書きました。"
          />
        </p>
      </header>

      <div className="mx-auto max-w-2xl">
        <Section title={<T en="Without an account" ja="アカウントなしで使う場合" />}>
          <p>
            <T
              en="Your favourites, star ratings, shopping list, language and theme are kept only in this browser (its local storage). They never leave your device. Clearing the site's data in your browser removes them."
              ja="お気に入り、星の評価、買い物リスト、言語とテーマの設定は、このブラウザの中（ローカルストレージ）だけに保存され、端末の外には出ません。ブラウザでこのサイトのデータを消すと削除されます。"
            />
          </p>
          <p>
            <T en="The site sets no cookies of its own." ja="このサイト自体はクッキーを使いません。" />
          </p>
        </Section>

        <Section title={<T en="With an account" ja="アカウントを作った場合" />}>
          <p>
            <T
              en="Accounts are run by Google Firebase. We keep your name, email address, saved recipes, star ratings and your choice of profile picture, so you can see them on any device. Your password goes straight to Firebase; we never see it. If you sign in with Google, your Google name, email and profile photo are used; the photo is shown from Google, not copied."
              ja="アカウントは Google Firebase で管理しています。保存するのは名前、メールアドレス、保存したレシピ、星の評価、選んだプロフィール写真で、どの端末からでも見られるようにするためです。パスワードは直接 Firebase に送られ、私たちが見ることはありません。Google でログインした場合は、Google の名前・メールアドレス・プロフィール写真を使います。写真は Google から表示するだけで、コピーはしません。"
            />
          </p>
          <p>
            <T
              en="Firebase sends the account emails (confirming your address, resetting your password). We don't send newsletters or share your details with anyone."
              ja="アカウントのメール（アドレスの確認、パスワードの再設定）は Firebase から届きます。メールマガジンを送ったり、情報を誰かと共有したりすることはありません。"
            />
          </p>
          <p>
            <T
              en="Only you can read your saved data: the database refuses everyone else, and only accepts recipe names and 1–5 star ratings."
              ja="保存したデータを読めるのはあなただけです。データベースは他の人のアクセスを拒否し、レシピ名と1〜5の星の評価しか受け付けません。"
            />
          </p>
        </Section>

        <Section title={<T en="Your own profile picture" ja="自分で選んだプロフィール写真" />}>
          <p>
            <T
              en="If you upload a picture, your device first crops it to a small square (192 × 192 pixels). Only those pixels are saved in your account: not the original file, and none of its hidden details, such as where a photo was taken."
              ja="写真をアップロードすると、まず端末上で小さな正方形（192 × 192ピクセル）に切り抜かれます。アカウントに保存されるのはその画像だけで、元のファイルや、撮影場所などの隠れた情報は保存されません。"
            />
          </p>
        </Section>

        <Section title={<T en="Deleting your data" ja="データの削除" />}>
          <p>
            <T
              en={
                <>
                  On <Link href="/account" className="underline underline-offset-2">your account page</Link>, <strong>Delete my account</strong> permanently removes the account and everything saved in it, straight away.
                </>
              }
              ja={
                <>
                  <Link href="/account" className="underline underline-offset-2">アカウントページ</Link>の「アカウントを削除」で、アカウントと保存内容がすぐに完全に削除されます。
                </>
              }
            />
          </p>
        </Section>

        <Section title={<T en="Other services the pages load from" ja="ページが読み込む外部サービス" />}>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <T en="Food photos come from Unsplash's image servers." ja="料理の写真は Unsplash の画像サーバーから読み込みます。" />
            </li>
            <li>
              <T
                en="In Japanese mode, the Japanese fonts come from Google Fonts."
                ja="日本語表示では、日本語フォントを Google Fonts から読み込みます。"
              />
            </li>
            <li>
              <T
                en="On the account page, the sign-in code comes from Google (Firebase). The site itself is hosted on Amazon Web Services."
                ja="アカウントページでは、ログインの仕組みを Google（Firebase）から読み込みます。サイト自体は Amazon Web Services でホストしています。"
              />
            </li>
            {process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && (
              <li>
                <T
                  en="To keep bots from creating accounts, Google reCAPTCHA checks requests from the account page (Firebase App Check)."
                  ja="ボットによるアカウント作成を防ぐため、アカウントページでは Google reCAPTCHA がリクエストを確認します（Firebase App Check）。"
                />
              </li>
            )}
          </ul>
          <p className="text-muted-foreground text-sm">
            <T
              en="Like any website, these services see your IP address and browser when your device asks them for a file."
              ja="一般的なウェブサイトと同じく、これらのサービスはファイルを送る際に、あなたの IP アドレスとブラウザの情報を受け取ります。"
            />
          </p>
        </Section>

        <p className="text-muted-foreground pt-8 text-sm">
          <T en="Last updated 29 October 2026." ja="最終更新：2026年10月29日" />
        </p>
      </div>
    </div>
  );
}
