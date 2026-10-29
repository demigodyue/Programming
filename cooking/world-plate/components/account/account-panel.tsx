"use client";

import { Eye, EyeOff, Heart, KeyRound, LogOut, Mail, MailCheck, Trash2, User } from "lucide-react";
import { m, useReducedMotion } from "motion/react";
import Link from "next/link";
import { Avatar, AvatarPicker } from "@/components/account/avatar";
import { useState, type FormEvent } from "react";
import { T } from "@/components/i18n";
import { FlipFace, flipClass } from "@/components/motion/flip-face";
import { ContinuousTabs } from "@/components/watermelon/continuous-tabs";
import { FloatingInput } from "@/components/watermelon/floating-input";
import { AccountError, MIN_PASSWORD, type AccountUser } from "@/lib/account/backend";
import {
  deleteAccount,
  refreshUser,
  resetPassword,
  sendVerification,
  signIn,
  signInWithGoogle,
  signOut,
  signUp,
  useAccount,
} from "@/lib/account/store";
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
  "auth/popup-closed-by-user": { en: "The Google window was closed before signing in.", ja: "ログインが完了する前にGoogleの画面が閉じられました。" },
  "auth/cancelled-popup-request": { en: "The Google window was closed before signing in.", ja: "ログインが完了する前にGoogleの画面が閉じられました。" },
  "auth/popup-blocked": { en: "Your browser blocked the Google window. Allow pop-ups for this site and try again.", ja: "ブラウザがGoogleの画面をブロックしました。ポップアップを許可してもう一度お試しください。" },
  "auth/operation-not-allowed": { en: "That way of signing in isn't switched on for this site yet.", ja: "このログイン方法は、まだこのサイトで有効になっていません。" },
  "auth/account-exists-with-different-credential": { en: "That email already has an account. Sign in with your password instead.", ja: "このメールアドレスはすでに登録されています。パスワードでログインしてください。" },
  "auth/requires-recent-login": { en: "For your safety, sign out and sign in again, then delete your account.", ja: "安全のため、一度ログアウトしてから再度ログインし、その後で削除してください。" },
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
        {account.status === "in" && <Profile user={account.user} syncing={account.syncing} />}
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

        {mode !== "reset" && (
          <>
            <p className="text-muted-foreground flex items-center gap-3 text-xs before:h-px before:flex-1 before:bg-current/25 after:h-px after:flex-1 after:bg-current/25">
              <T en="or" ja="または" />
            </p>
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                setError(null);
                setBusy(true);
                try {
                  await signInWithGoogle();
                } catch (err) {
                  setError(err instanceof AccountError ? (ERRORS[err.code] ?? UNKNOWN) : UNKNOWN);
                  setAttempt((a) => a + 1);
                } finally {
                  setBusy(false);
                }
              }}
              className="bg-background hover-fine:bg-muted inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-full border px-5 text-sm font-medium transition-colors disabled:opacity-60"
            >
              <svg viewBox="0 0 24 24" aria-hidden className="size-5">
                <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8z" />
                <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.2v3.1A12 12 0 0 0 12 24z" />
                <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.2a12 12 0 0 0 0 10.8l4.1-3.1z" />
                <path fill="#EA4335" d="M12 4.8c1.8 0 3.4.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.2 6.6l4.1 3.1c.9-2.9 3.6-4.9 6.7-4.9z" />
              </svg>
              <T en="Continue with Google" ja="Googleで続ける" />
            </button>
          </>
        )}

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
          {mode === "signup" && (
            <span className="text-muted-foreground">
              <T
                en={
                  <>
                    What we keep and how to delete it:{" "}
                    <Link href="/privacy" className="underline underline-offset-2">
                      Privacy
                    </Link>
                  </>
                }
                ja={
                  <>
                    保存する内容と削除方法：
                    <Link href="/privacy" className="underline underline-offset-2">
                      プライバシー
                    </Link>
                  </>
                }
              />
            </span>
          )}
        </p>
      </m.form>
    </div>
  );
}

function Profile({ user, syncing }: { user: AccountUser; syncing: boolean }) {
  const { name, email } = user;
  const favorites = useFavorites();
  const [busy, setBusy] = useState(false);
  const count = favorites?.length ?? 0;

  return (
    <div className="bg-card rounded-lg border p-6 text-center sm:p-8">
      <Avatar user={user} className="mx-auto size-24" />
      <AvatarPicker user={user} />
      <h2 className="font-display mt-5 text-[2.125rem] leading-none">
        <T en={`Hello, ${name || "cook"}`} ja={`こんにちは、${name || "シェフ"}さん`} />
      </h2>
      <p className="text-muted-foreground mt-2 text-sm break-all">{email}</p>
      {!user.verified && <VerifyNotice email={email} />}

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
          ja="ログアウトすると、このブラウザからお気に入りと評価が消えます。アカウントには残っています。"
        />
      </p>
      <DeleteAccount />
    </div>
  );
}

/** Email addresses typed at sign-up aren't confirmed until the link in the welcome email is clicked. */
function VerifyNotice({ email }: { email: string }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  return (
    <div role="status" className="bg-muted mt-5 rounded-lg px-4 py-3 text-left text-sm leading-relaxed">
      <p className="flex items-start gap-2 font-medium">
        <MailCheck className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} aria-hidden />
        <T en={`Please confirm your email: we sent a link to ${email}.`} ja={`メールアドレスの確認をお願いします。${email} にリンクを送りました。`} />
      </p>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 pl-6">
        <button
          type="button"
          disabled={state === "sending"}
          onClick={async () => {
            setState("sending");
            try {
              await sendVerification();
              setState("sent");
            } catch {
              setState("error");
            }
          }}
          className="link font-medium disabled:opacity-60"
        >
          {state === "sent" ? <T en="Sent — check your inbox" ja="送信しました。受信箱をご確認ください" /> : <T en="Send it again" ja="もう一度送る" />}
        </button>
        <button type="button" onClick={() => void refreshUser()} className="link text-muted-foreground">
          <T en="I've confirmed it" ja="確認しました" />
        </button>
      </div>
      {state === "error" && (
        <p className="text-destructive mt-1 pl-6">
          <T en="Couldn't send it. Try again in a minute." ja="送信できませんでした。少し待ってからお試しください。" />
        </p>
      )}
    </div>
  );
}

/** Deleting asks twice: the first press explains what goes, the second does it. */
function DeleteAccount() {
  const [step, setStep] = useState<"idle" | "confirm" | "busy">("idle");
  const [error, setError] = useState<{ en: string; ja: string } | null>(null);

  if (step === "idle") {
    return (
      <button
        type="button"
        onClick={() => setStep("confirm")}
        className="text-muted-foreground hover-fine:text-destructive mt-6 inline-flex items-center gap-1.5 text-xs font-medium transition-colors"
      >
        <Trash2 className="size-3.5" strokeWidth={1.75} aria-hidden />
        <T en="Delete my account" ja="アカウントを削除" />
      </button>
    );
  }
  return (
    <div role="alertdialog" aria-labelledby="delete-title" className="border-destructive/40 mt-6 rounded-lg border p-4 text-left text-sm">
      <p id="delete-title" className="font-medium">
        <T
          en="This permanently deletes your account, your saved recipes and your ratings. It can't be undone."
          ja="アカウント、保存したレシピ、評価がすべて完全に削除されます。元に戻すことはできません。"
        />
      </p>
      {error && (
        <p role="alert" className="text-destructive mt-2">
          <T {...error} />
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={step === "busy"}
          onClick={async () => {
            setStep("busy");
            setError(null);
            try {
              await deleteAccount();
            } catch (err) {
              setError(err instanceof AccountError ? (ERRORS[err.code] ?? UNKNOWN) : UNKNOWN);
              setStep("confirm");
            }
          }}
          className="bg-destructive inline-flex min-h-10 items-center gap-1.5 rounded-full px-4 font-medium text-white disabled:opacity-60"
        >
          <Trash2 className="size-4" strokeWidth={1.75} aria-hidden />
          <T en="Delete for good" ja="完全に削除する" />
        </button>
        <button type="button" onClick={() => setStep("idle")} className="hover-fine:bg-muted min-h-10 rounded-full border px-4 font-medium">
          <T en="Keep my account" ja="削除しない" />
        </button>
      </div>
    </div>
  );
}
