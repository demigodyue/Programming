"use client";

import { Eye, EyeOff, Heart, KeyRound, LogOut, Mail, User } from "lucide-react";
import { m, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { T } from "@/components/i18n";
import { FlipFace, flipClass } from "@/components/motion/flip-face";
import { ContinuousTabs } from "@/components/watermelon/continuous-tabs";
import { FloatingInput } from "@/components/watermelon/floating-input";
import { AccountError, MIN_PASSWORD } from "@/lib/account/backend";
import { resetPassword, signIn, signOut, signUp, useAccount } from "@/lib/account/store";
import { useT } from "@/lib/lang";
import { useFavorites } from "@/lib/local-store";

type Mode = "signin" | "signup" | "reset";
const EASE_OUT = [0.23, 1, 0.32, 1] as const;

/** Friendly messages for the errors people actually hit. */
const ERRORS: Record<string, { en: string; ja: string }> = {
  "auth/invalid-credential": { en: "That email and password don't match an account.", ja: "メールアドレスまたはパスワードが正しくありません。" },
  "auth/wrong-password": { en: "That email and password don't match an account.", ja: "メールアドレスまたはパスワードが正しくありません。" },
  "auth/user-not-found": { en: "That email and password don't match an account.", ja: "メールアドレスまたはパスワードが正しくありません。" },
  "auth/email-already-in-use": { en: "There's already an account with that email. Try signing in.", ja: "このメールアドレスはすでに登録されています。ログインしてください。" },
  "auth/weak-password": { en: `Use at least ${MIN_PASSWORD} characters for your password.`, ja: `パスワードは${MIN_PASSWORD}文字以上にしてください。` },
  "auth/invalid-email": { en: "That doesn't look like an email address.", ja: "メールアドレスの形式が正しくありません。" },
  "auth/too-many-requests": { en: "Too many tries. Wait a minute and try again.", ja: "試行回数が多すぎます。少し待ってからもう一度お試しください。" },
  "auth/network-request-failed": { en: "Couldn't reach the server. Check your connection.", ja: "サーバーに接続できません。通信環境を確認してください。" },
};
const UNKNOWN = { en: "Something went wrong. Please try again.", ja: "問題が発生しました。もう一度お試しください。" };

/**
 * Sign in, create an account, reset a password — and, once signed in, the account card with the saved-recipe count
 * and sign-out. Each state rises in and each form mode slides in (enter-only, keyed: exit animations can stall when
 * they fire before Motion's lazy features have loaded); errors shake in under the fields.
 */
export function AccountPanel() {
  const account = useAccount();
  const reduce = useReducedMotion();

  return (
    <div className="mx-auto w-full max-w-md">
      <m.div
        key={account.status}
        initial={{ opacity: 0, transform: reduce ? "none" : "translateY(16px) scale(0.98)" }}
        animate={{ opacity: 1, transform: "translateY(0px) scale(1)" }}
        transition={{ duration: 0.35, ease: EASE_OUT }}
      >
        {account.status === "loading" && <div aria-busy="true" className="bg-card min-h-96 animate-pulse rounded-lg border" />}
        {account.status === "off" && <NotSetUp />}
        {account.status === "out" && <AuthForm />}
        {account.status === "in" && <Profile name={account.user.name} email={account.user.email} syncing={account.syncing} />}
      </m.div>
    </div>
  );
}

function NotSetUp() {
  return (
    <div className="bg-card rounded-lg border p-8 text-center">
      <KeyRound aria-hidden className="mx-auto size-7" strokeWidth={1.5} />
      <p className="font-display mt-5 text-[1.75rem] leading-tight">
        <T en="Accounts aren't switched on yet." ja="アカウント機能はまだ準備中です。" />
      </p>
      <p className="text-muted-foreground mt-3 text-[0.9375rem] leading-relaxed">
        <T
          en="Your favorites still save on this browser. Accounts arrive once this site is connected to its Firebase project."
          ja="お気に入りはこのブラウザに保存されます。サイトがFirebaseプロジェクトに接続されると、アカウントが使えるようになります。"
        />
      </p>
      <Link href="/favorites" data-accent="mint" className={flipClass("solid", "mt-7")}>
        <FlipFace>
          <T en="Your favorites" ja="お気に入り" />
        </FlipFace>
      </Link>
    </div>
  );
}

function AuthForm() {
  const t = useT();
  const reduce = useReducedMotion();
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ en: string; ja: string } | null>(null);
  const [sent, setSent] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setSent(false);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (mode === "signup" && password.length < MIN_PASSWORD) {
      setError(ERRORS["auth/weak-password"]);
      setAttempt((a) => a + 1);
      return;
    }
    setBusy(true);
    try {
      if (mode === "signin") await signIn(email.trim(), password);
      else if (mode === "signup") await signUp(name.trim(), email.trim(), password);
      else {
        await resetPassword(email.trim());
        setSent(true);
      }
    } catch (err) {
      setError(err instanceof AccountError ? (ERRORS[err.code] ?? UNKNOWN) : UNKNOWN);
      setAttempt((a) => a + 1);
    } finally {
      setBusy(false);
    }
  };

  const title = {
    signin: { en: "Welcome back", ja: "おかえりなさい" },
    signup: { en: "Create your account", ja: "アカウントを作成" },
    reset: { en: "Reset your password", ja: "パスワードの再設定" },
  }[mode];

  return (
    <div className="bg-card overflow-hidden rounded-lg border p-6 sm:p-8">
      {mode !== "reset" && (
        <ContinuousTabs
          label={t("Account", "アカウント")}
          value={mode}
          onChange={(id) => switchMode(id as Mode)}
          className="w-full [&>button]:flex-1"
          tabs={[
            { id: "signin", label: <T en="Sign in" ja="ログイン" /> },
            { id: "signup", label: <T en="Create account" ja="新規登録" /> },
          ]}
        />
      )}
      <m.form
        key={mode}
        onSubmit={submit}
        initial={{ opacity: 0, transform: reduce ? "none" : `translateX(${mode === "signup" ? 24 : -24}px)` }}
        animate={{ opacity: 1, transform: "translateX(0px)" }}
        transition={{ duration: 0.28, ease: EASE_OUT }}
        className="mt-7 space-y-4"
      >
        <h2 className="font-display text-[2rem] leading-none">
          <T {...title} />
        </h2>
        <p className="text-muted-foreground text-[0.9375rem] leading-relaxed">
          {mode === "signin" && <T en="Sign in to see your saved recipes on any device." ja="ログインすると、保存したレシピをどの端末でも見られます。" />}
          {mode === "signup" && (
            <T
              en="Free, and your favorites from this browser come with you."
              ja="無料です。このブラウザのお気に入りもそのまま引き継がれます。"
            />
          )}
          {mode === "reset" && (
            <T en="We'll email you a link to choose a new password." ja="新しいパスワードを設定するためのリンクをメールでお送りします。" />
          )}
        </p>

        {mode === "signup" && (
          <FloatingInput
            label={<T en="Your name" ja="お名前" />}
            icon={<User className="size-5" strokeWidth={1.75} />}
            name="name"
            autoComplete="name"
            required
            maxLength={60}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        )}
        <FloatingInput
          label={<T en="Email" ja="メールアドレス" />}
          icon={<Mail className="size-5" strokeWidth={1.75} />}
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          required
          maxLength={254}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {mode !== "reset" && (
          <div className="relative">
            <FloatingInput
              label={<T en="Password" ja="パスワード" />}
              icon={<KeyRound className="size-5" strokeWidth={1.75} />}
              type={show ? "text" : "password"}
              name="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              required
              maxLength={128}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-14"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? t("Hide password", "パスワードを隠す") : t("Show password", "パスワードを表示")}
              aria-pressed={show}
              className="text-muted-foreground hover-fine:text-foreground absolute top-1/2 right-2 grid size-10 -translate-y-1/2 place-items-center rounded-full"
            >
              {show ? <EyeOff className="size-5" strokeWidth={1.75} aria-hidden /> : <Eye className="size-5" strokeWidth={1.75} aria-hidden />}
            </button>
          </div>
        )}

        <div aria-live="polite" className="min-h-6">
          {error && (
            <m.p
              key={attempt}
              role="alert"
              initial={reduce ? { opacity: 0 } : { transform: "translateX(0px)" }}
              animate={reduce ? { opacity: 1 } : { transform: ["translateX(0px)", "translateX(-8px)", "translateX(7px)", "translateX(-4px)", "translateX(0px)"] }}
              transition={{ duration: 0.4 }}
              className="text-destructive text-sm font-medium"
            >
              <T {...error} />
            </m.p>
          )}
          {sent && (
            <p className="text-sm font-medium">
              <T en="Check your inbox for the reset link." ja="再設定用のリンクをメールで送信しました。" />
            </p>
          )}
        </div>

        <button type="submit" disabled={busy} data-accent="yellow" className={flipClass("solid", "w-full justify-center disabled:opacity-60")}>
          <FlipFace className="w-full justify-center">
            {busy ? (
              <T en="One moment…" ja="お待ちください…" />
            ) : mode === "signin" ? (
              <T en="Sign in" ja="ログイン" />
            ) : mode === "signup" ? (
              <T en="Create account" ja="アカウントを作成" />
            ) : (
              <T en="Send reset link" ja="リンクを送信" />
            )}
          </FlipFace>
        </button>

        <p className="text-center text-sm">
          {mode === "signin" && (
            <button type="button" onClick={() => switchMode("reset")} className="link text-muted-foreground">
              <T en="Forgot your password?" ja="パスワードをお忘れですか？" />
            </button>
          )}
          {mode === "reset" && (
            <button type="button" onClick={() => switchMode("signin")} className="link text-muted-foreground">
              <T en="Back to sign in" ja="ログインに戻る" />
            </button>
          )}
        </p>
      </m.form>
    </div>
  );
}

function Profile({ name, email, syncing }: { name: string; email: string; syncing: boolean }) {
  const favorites = useFavorites();
  const [busy, setBusy] = useState(false);
  const count = favorites?.length ?? 0;
  const initial = (name || email).trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="bg-card rounded-lg border p-6 text-center sm:p-8">
      <span aria-hidden className="bg-dot text-dot-foreground font-display mx-auto grid size-20 place-items-center rounded-full text-4xl">
        {initial}
      </span>
      <h2 className="font-display mt-5 text-[2.125rem] leading-none">
        <T en={`Hello, ${name || "cook"}`} ja={`こんにちは、${name || "シェフ"}さん`} />
      </h2>
      <p className="text-muted-foreground mt-2 text-sm break-all">{email}</p>

      <dl className="mt-7 grid grid-cols-2 border-y">
        <div className="py-4">
          <dt className="label-caps text-muted-foreground">
            <T en="Saved recipes" ja="保存したレシピ" />
          </dt>
          <dd className="font-display text-headline mt-1 text-4xl">{favorites === null ? "–" : count}</dd>
        </div>
        <div className="border-l py-4">
          <dt className="label-caps text-muted-foreground">
            <T en="Sync" ja="同期" />
          </dt>
          <dd className="mt-2 text-sm font-medium">
            {syncing ? <T en="Syncing…" ja="同期中…" /> : <T en="Up to date" ja="最新の状態" />}
          </dd>
        </div>
      </dl>

      <div className="mt-7 flex flex-col gap-3">
        <Link href="/favorites" data-accent="mint" className={flipClass("solid", "w-full justify-center")}>
          <FlipFace className="w-full justify-center">
            <Heart className="size-4" strokeWidth={1.75} aria-hidden />
            <T en="See your favorites" ja="お気に入りを見る" />
          </FlipFace>
        </Link>
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await signOut();
            } finally {
              setBusy(false);
            }
          }}
          className="hover-fine:bg-muted inline-flex min-h-12 items-center justify-center gap-2 rounded-full border px-5 text-sm font-medium disabled:opacity-60"
        >
          <LogOut className="size-4" strokeWidth={1.75} aria-hidden />
          <T en="Sign out" ja="ログアウト" />
        </button>
      </div>
      <p className="text-muted-foreground mt-5 text-xs leading-relaxed">
        <T
          en="Signing out removes your favorites from this browser. They stay safe in your account."
          ja="ログアウトすると、このブラウザからお気に入りが消えます。アカウントには残っています。"
        />
      </p>
    </div>
  );
}
