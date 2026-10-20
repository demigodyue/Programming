"use client";

import { Pause, Play, RotateCcw, Timer } from "lucide-react";
import { useSyncExternalStore } from "react";
import { Minutes, T } from "@/components/i18n";
import { useT } from "@/lib/lang";
import { clock } from "@/lib/step-info";
import { cn } from "@/lib/utils";

/**
 * Kitchen timers for the times a step mentions. They live in a module-level store keyed by recipe, step and
 * timer, so a timer started on the page keeps running in Cook Mode and back. When one finishes it chimes
 * (Web Audio), buzzes the phone and the chip pulses until you tap it.
 */
type TimerState = { total: number; endsAt: number | null; left: number; done: boolean };

const timers = new Map<string, TimerState>();
const listeners = new Set<() => void>();
let ticker = 0;
let version = 0;

const emit = () => {
  version++;
  listeners.forEach((l) => l());
};

function chime() {
  try {
    const ctx = new AudioContext();
    [0, 0.28, 0.56].forEach((at, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = [880, 1175, 1568][i];
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + at);
      gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + at + 0.5);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + at);
      osc.stop(ctx.currentTime + at + 0.55);
    });
    setTimeout(() => ctx.close(), 1500);
  } catch {}
  navigator.vibrate?.([200, 100, 200]);
}

function tick() {
  const now = Date.now();
  let running = false;
  for (const t of timers.values()) {
    if (t.endsAt === null) continue;
    t.left = Math.max(0, (t.endsAt - now) / 1000);
    if (t.left === 0) {
      t.endsAt = null;
      t.done = true;
      chime();
    } else running = true;
  }
  if (!running) {
    clearInterval(ticker);
    ticker = 0;
  }
  emit();
}

function toggle(id: string, total: number) {
  const t = timers.get(id) ?? { total, endsAt: null, left: total, done: false };
  if (t.done) {
    timers.set(id, { total, endsAt: null, left: total, done: false });
  } else if (t.endsAt !== null) {
    t.left = Math.max(0, (t.endsAt - Date.now()) / 1000);
    t.endsAt = null;
    timers.set(id, t);
  } else {
    t.endsAt = Date.now() + t.left * 1000;
    timers.set(id, t);
    if (!ticker) ticker = window.setInterval(tick, 250);
  }
  emit();
}

function reset(id: string) {
  timers.delete(id);
  emit();
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

function useTimer(id: string) {
  useSyncExternalStore(subscribe, () => version, () => 0);
  return timers.get(id);
}

/** One timer chip: "20 min" until started, then a draining ring with the time left. */
export function StepTimer({ id, seconds, large = false }: { id: string; seconds: number; large?: boolean }) {
  const state = useTimer(id);
  const t = useT();
  const running = state?.endsAt != null;
  const done = state?.done ?? false;
  const left = state?.left ?? seconds;
  const started = state !== undefined;
  const fraction = done ? 0 : left / seconds;
  const R = 9;
  const C = 2 * Math.PI * R;
  const label =
    seconds < 60 ? <T en={`${seconds} sec`} ja={`${seconds}秒`} /> : seconds % 60 === 0 ? <Minutes m={seconds / 60} /> : clock(seconds);

  return (
    <span className={cn("step-timer inline-flex items-center gap-1", done && "step-timer--done")}>
      <button
        type="button"
        onClick={() => toggle(id, seconds)}
        aria-label={
          done
            ? t("Timer done — tap to clear", "タイマー終了。タップで解除")
            : running
              ? t(`Pause timer, ${clock(left)} left`, `タイマーを一時停止（残り${clock(left)}）`)
              : started
                ? t(`Resume timer, ${clock(left)} left`, `タイマーを再開（残り${clock(left)}）`)
                : t("Start a timer", "タイマーを開始")
        }
        className={cn(
          "inline-flex items-center gap-2 rounded-full border font-medium tabular-nums transition-[background-color,color,border-color] duration-200",
          large ? "h-14 px-5 text-lg" : "h-9 px-3 text-sm",
          running ? "border-primary bg-primary text-primary-foreground" : done ? "border-destructive bg-destructive text-white" : "bg-card hover-fine:bg-muted",
        )}
      >
        <svg viewBox="0 0 24 24" aria-hidden className={large ? "size-7" : "size-5"}>
          <circle cx="12" cy="12" r={R} fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
          <circle
            cx="12"
            cy="12"
            r={R}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - fraction)}
            transform="rotate(-90 12 12)"
            className="transition-[stroke-dashoffset] duration-300 ease-linear"
          />
          {!started && <Timer x="6" y="6" width="12" height="12" strokeWidth={2.4} />}
          {running && <Pause x="7.5" y="7.5" width="9" height="9" strokeWidth={3} />}
          {started && !running && !done && <Play x="7.5" y="7.5" width="9" height="9" strokeWidth={3} />}
        </svg>
        {started ? (done ? <T en="Done!" ja="完了！" /> : clock(left)) : label}
      </button>
      {started && (
        <button
          type="button"
          onClick={() => reset(id)}
          aria-label={t("Reset timer", "タイマーをリセット")}
          className={cn("text-muted-foreground hover-fine:text-foreground grid place-items-center rounded-full", large ? "size-12" : "size-9")}
        >
          <RotateCcw className="size-4" strokeWidth={2} aria-hidden />
        </button>
      )}
    </span>
  );
}
