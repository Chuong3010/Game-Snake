import { useEffect, useState } from "react";
import { DIFFICULTIES, type DifficultyKey, type UiState } from "../game/core";
import { DiffPicker, IconHome, IconPlay, IconRestart, IconStar, IconTrophy } from "./hud";

export interface OverlayProps {
  state: UiState;
  countdown: number;
  score: number;
  best: number;
  len: number;
  justSetRecord: boolean;
  difficulty: DifficultyKey;
  onStart: () => void;
  onTogglePause: () => void;
  onRestart: () => void;
  onMenu: () => void;
  onSelectDifficulty: (k: DifficultyKey) => void;
}

function GoFlash() {
  const [show, setShow] = useState(true);
  useEffect(() => {
    const id = window.setTimeout(() => setShow(false), 680);
    return () => clearTimeout(id);
  }, []);
  if (!show) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
      <span className="anim-zoom-num font-arcade text-4xl text-venom-400 glow-lime md:text-5xl">GO</span>
    </div>
  );
}

const shell =
  "absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 rounded-[10px] bg-[#04100a]/85 px-5 text-center backdrop-blur-[3px]";

const btnPrimary =
  "btn-arcade no-tap-highlight inline-flex items-center justify-center gap-2 rounded-md bg-venom-500 px-6 py-3.5 font-arcade text-[10px] tracking-wider text-pit-950 shadow-[0_0_26px_-4px_rgba(163,230,53,0.7)] hover:bg-venom-400";
const btnGhost =
  "btn-arcade no-tap-highlight inline-flex items-center justify-center gap-2 rounded-md border border-pit-line bg-pit-800/70 px-4 py-3 font-arcade text-[9px] tracking-wider text-fog-100 hover:border-venom-500/50 hover:text-venom-300";

export function BoardOverlay(p: OverlayProps) {
  const cfg = DIFFICULTIES[p.difficulty];

  if (p.state === "playing") return <GoFlash />;

  if (p.state === "countdown") {
    const label = p.countdown > 1 ? String(p.countdown) : "READY";
    return (
      <div className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center gap-3">
        <span
          key={p.countdown}
          className={`anim-zoom-num font-arcade text-6xl md:text-7xl ${
            p.countdown > 1 ? "text-venom-400 glow-lime" : "text-mint-300 glow-mint text-3xl md:text-4xl"
          }`}
        >
          {label}
        </span>
        <span className="font-arcade text-[9px] tracking-[0.3em] text-fog-500">{cfg.name} · {cfg.tag} SCORE</span>
      </div>
    );
  }

  if (p.state === "paused") {
    return (
      <div className={shell}>
        <span className="font-arcade text-2xl tracking-wider text-mint-300 glow-mint anim-rise">PAUSED</span>
        <p className="max-w-[240px] text-xs leading-relaxed text-fog-400">
          The serpent holds its breath. Score <span className="font-bold text-venom-300">{p.score}</span> is safe.
        </p>
        <div className="anim-rise flex flex-wrap items-center justify-center gap-2" style={{ animationDelay: "60ms" }}>
          <button type="button" className={btnPrimary} onClick={p.onTogglePause}>
            <IconPlay size={11} /> RESUME
          </button>
          <button type="button" className={btnGhost} onClick={p.onRestart}>
            <IconRestart size={11} /> RESTART
          </button>
          <button type="button" className={btnGhost} onClick={p.onMenu}>
            <IconHome size={11} /> MENU
          </button>
        </div>
        <span className="text-[10px] tracking-[0.25em] text-fog-500">
          <kbd className="kbd">SPACE</kbd> TO RESUME
        </span>
      </div>
    );
  }

  if (p.state === "over" || p.state === "won") {
    const won = p.state === "won";
    return (
      <div className={shell}>
        {p.justSetRecord && (
          <span className="anim-blink inline-flex items-center gap-1.5 rounded-sm border border-gild-400/50 bg-gild-400/10 px-2.5 py-1.5 font-arcade text-[9px] text-gild-300 glow-gold">
            <IconStar size={10} /> NEW RECORD
          </span>
        )}
        <span className={`anim-rise font-arcade text-2xl leading-relaxed md:text-3xl ${won ? "text-venom-400 glow-lime" : "text-ember-500 glow-coral"}`}>
          {won ? "PIT CLEARED" : "GAME OVER"}
        </span>
        {won && <p className="-mt-2 text-xs tracking-[0.2em] text-fog-400">THE SERPENT FILLED THE WHOLE PIT</p>}

        <div className="anim-rise flex items-center gap-6" style={{ animationDelay: "70ms" }}>
          <div>
            <div className="text-[9px] font-bold tracking-[0.28em] text-fog-500">FINAL SCORE</div>
            <div key={p.score} className="anim-pop mt-1 font-arcade text-3xl text-venom-400 glow-lime md:text-4xl">
              {p.score}
            </div>
          </div>
          <div className="h-10 w-px bg-pit-line" />
          <div className="text-left">
            <div className="flex items-center gap-1 text-[9px] font-bold tracking-[0.28em] text-fog-500">
              <IconTrophy size={10} /> BEST
            </div>
            <div className="mt-1 font-arcade text-lg text-gild-400">{Math.max(p.best, p.score)}</div>
            <div className="mt-0.5 text-[10px] text-fog-500">LENGTH {p.len}</div>
          </div>
        </div>

        <div className="anim-rise flex flex-wrap items-center justify-center gap-2" style={{ animationDelay: "130ms" }}>
          <button type="button" className={btnPrimary} onClick={p.onRestart}>
            <IconRestart size={11} /> RETRY
          </button>
          <button type="button" className={btnGhost} onClick={p.onMenu}>
            <IconHome size={11} /> MENU
          </button>
        </div>
        <span className="text-[10px] tracking-[0.25em] text-fog-500">
          TAP OR PRESS <kbd className="kbd">R</kbd>
        </span>
      </div>
    );
  }

  // idle — attract mode behind the menu
  return (
    <div className={shell} style={{ background: "rgba(4,16,10,0.78)" }}>
      <span className="anim-blink rounded-sm border border-mint-400/40 bg-mint-400/10 px-2 py-1 font-arcade text-[8px] tracking-[0.25em] text-mint-300">
        DEMO MODE
      </span>
      <div className="anim-rise">
        <h1 className="font-arcade text-[22px] leading-snug tracking-wide text-venom-400 glow-lime md:text-3xl">
          SERPENTINE
        </h1>
        <p className="mt-2 text-[10px] font-semibold tracking-[0.42em] text-fog-500">ARCADE SNAKE</p>
      </div>

      <div className="anim-rise flex w-full max-w-[300px] flex-col gap-3" style={{ animationDelay: "80ms" }}>
        <button type="button" className={`${btnPrimary} w-full anim-ring`} onClick={p.onStart}>
          <IconPlay size={11} /> START RUN
        </button>
        <DiffPicker compact value={p.difficulty} onSelect={p.onSelectDifficulty} />
      </div>

      <p className="anim-rise max-w-[300px] text-[11px] leading-relaxed text-fog-400" style={{ animationDelay: "140ms" }}>
        Eat the apples, dodge the walls, never bite yourself.
        <span className="text-gild-300"> Gold stars</span> are worth 50 — grab them before they fade.
      </p>
      <div className="anim-rise flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-[10px] tracking-wider text-fog-500" style={{ animationDelay: "180ms" }}>
        <span>
          <kbd className="kbd">SPACE</kbd> START
        </span>
        <span>
          <kbd className="kbd">↑↓←→</kbd> STEER
        </span>
        <span className="text-mint-400/80">SWIPE ON TOUCH</span>
      </div>
    </div>
  );
}
