import { useEffect, useState } from "react";
import { DIFFICULTIES, type UiState } from "./game/core";
import { useSnakeGame } from "./game/useSnakeGame";
import { BoardOverlay } from "./components/overlays";
import {
  ControlsGuide,
  DPad,
  DiffPicker,
  Fireflies,
  IconHome,
  IconPause,
  IconPlay,
  IconRestart,
  IconSound,
  IconTrophy,
  LogoMark,
  PanelLabel,
  ScorePanel,
  SpeedPips,
} from "./components/hud";

function statusText(state: UiState, coarse: boolean): string {
  switch (state) {
    case "idle":
      return "ATTRACT MODE — PRESS SPACE OR TAP TO PLAY";
    case "countdown":
      return "GET READY…";
    case "playing":
      return coarse ? "SWIPE OR PAD TO STEER · CENTER KEY PAUSES" : "SPACE — PAUSE · R — RESTART";
    case "paused":
      return "PAUSED — SPACE TO RESUME";
    case "over":
      return "PRESS R OR TAP THE PIT TO RETRY";
    case "won":
      return "NOTHING LEFT TO EAT — PRESS R TO RUN IT BACK";
  }
}

function ledColor(state: UiState): string {
  switch (state) {
    case "playing":
      return "#a3e635";
    case "paused":
      return "#fbbf24";
    case "over":
      return "#f95f62";
    case "won":
      return "#a3e635";
    default:
      return "#43d9bd";
  }
}

export default function App() {
  const g = useSnakeGame();
  const cfg = DIFFICULTIES[g.difficulty];
  const best = g.bestMap[g.difficulty];

  const [coarse, setCoarse] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    const onChange = () => setCoarse(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const centerIcon: "play" | "pause" | "restart" =
    g.state === "playing" ? "pause" : g.state === "over" || g.state === "won" ? "restart" : "play";

  const onCenter = () => {
    if (g.state === "idle") g.start();
    else if (g.state === "over" || g.state === "won") g.restart();
    else if (g.state === "playing" || g.state === "paused") g.togglePause();
  };

  return (
    <div className="no-tap-highlight relative flex min-h-dvh flex-col overflow-hidden font-body text-fog-100">
      {/* ---------- ambient background ---------- */}
      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(90% 60% at 50% -10%, rgba(23,179,154,0.14), transparent 60%), radial-gradient(70% 50% at 85% 110%, rgba(163,230,53,0.10), transparent 60%), radial-gradient(60% 45% at 8% 90%, rgba(251,191,36,0.06), transparent 55%), linear-gradient(180deg, #081711 0%, #07130e 55%, #06100b 100%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "linear-gradient(rgba(163,230,53,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(163,230,53,0.04) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage: "radial-gradient(80% 70% at 50% 40%, black 30%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(80% 70% at 50% 40%, black 30%, transparent 100%)",
          }}
        />
        <Fireflies count={16} />
      </div>

      {/* ---------- header ---------- */}
      <header className="mx-auto flex w-full max-w-[1080px] items-center justify-between gap-3 px-4 pb-3 pt-4 md:pt-5">
        <div className="flex items-center gap-3">
          <LogoMark />
          <div>
            <div className="font-arcade text-[13px] leading-none tracking-wide text-venom-400 glow-lime md:text-[15px]">
              SERPENTINE
            </div>
            <div className="mt-1.5 text-[9px] font-semibold tracking-[0.4em] text-fog-500">ARCADE SNAKE</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="panel flex items-center gap-2 rounded-md px-3 py-2.5" title={`Best score on ${cfg.name}`}>
            <IconTrophy size={13} />
            <span key={best} className="anim-pop inline-block font-arcade text-[11px] text-gild-400">
              {best}
            </span>
            <span className="hidden text-[9px] font-bold tracking-[0.2em] text-fog-500 sm:inline">BEST · {cfg.name}</span>
          </div>
          <button
            type="button"
            onClick={g.toggleMute}
            aria-pressed={!g.muted}
            aria-label={g.muted ? "Unmute sound" : "Mute sound"}
            className={`btn-arcade panel rounded-md p-2.5 ${g.muted ? "text-fog-500" : "text-venom-400"}`}
          >
            <IconSound on={!g.muted} />
          </button>
        </div>
      </header>

      {/* ---------- main ---------- */}
      <main className="mx-auto grid w-full max-w-[1080px] flex-1 grid-cols-1 items-start gap-5 px-4 pb-6 lg:grid-cols-[236px_minmax(0,1fr)_258px] lg:gap-6">
        {/* left — score */}
        <aside className="order-2 hidden flex-col gap-4 lg:order-1 lg:flex">
          <ScorePanel
            score={g.score}
            best={best}
            len={g.len}
            mult={cfg.mult}
            tickMs={g.tickMs}
            dkey={g.difficulty}
            isRecord={g.isRecord}
          />
          <div className="panel rounded-lg p-4">
            <PanelLabel>FIELD NOTES</PanelLabel>
            <ul className="mt-3 flex flex-col gap-2 text-[11px] leading-relaxed text-fog-400">
              <li>
                <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-ember-500 align-middle shadow-[0_0_8px_rgba(249,95,98,0.8)]" />
                Apples pay <span className="font-bold text-fog-100">10 × {cfg.mult}</span> and a little speed.
              </li>
              <li>
                <span className="mr-1.5 inline-block h-2 w-2 rotate-45 bg-gild-400 align-middle shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                Every 5th apple lures a <span className="font-bold text-gild-300">gold star — 50 × {cfg.mult}</span>, gone in ~7s.
              </li>
              <li>
                <span className="mr-1.5 inline-block h-2 w-2 bg-mint-400 align-middle shadow-[0_0_8px_rgba(67,217,189,0.8)]" />
                Walls and your own tail end the run.
              </li>
            </ul>
          </div>
        </aside>

        {/* center — the pit */}
        <section className="order-1 flex flex-col gap-3 lg:order-2">
          {/* mobile score strip */}
          <div className="panel flex items-center justify-between gap-2 rounded-lg px-4 py-2.5 lg:hidden">
            <div>
              <div className="text-[8px] font-bold tracking-[0.25em] text-fog-500">SCORE</div>
              <div key={g.score} className="anim-pop font-arcade text-[15px] leading-tight text-venom-400 glow-lime">
                {g.score}
              </div>
            </div>
            <div>
              <div className="text-[8px] font-bold tracking-[0.25em] text-fog-500">BEST</div>
              <div className="font-arcade text-[15px] leading-tight text-gild-400">{best}</div>
            </div>
            <div>
              <div className="text-[8px] font-bold tracking-[0.25em] text-fog-500">LENGTH</div>
              <div className="font-arcade text-[15px] leading-tight text-mint-300">{g.len}</div>
            </div>
            <div className="rounded-sm border border-gild-400/30 bg-gild-400/10 px-1.5 py-1 font-arcade text-[9px] text-gild-300">
              ×{cfg.mult}
            </div>
          </div>

          {/* board frame */}
          <div className="relative mx-auto w-full max-w-[540px]">
            {/* corner brackets */}
            <span className="pointer-events-none absolute -left-1.5 -top-1.5 z-30 h-4 w-4 border-l-2 border-t-2 border-venom-500/60" aria-hidden />
            <span className="pointer-events-none absolute -right-1.5 -top-1.5 z-30 h-4 w-4 border-r-2 border-t-2 border-venom-500/60" aria-hidden />
            <span className="pointer-events-none absolute -bottom-1.5 -left-1.5 z-30 h-4 w-4 border-b-2 border-l-2 border-venom-500/60" aria-hidden />
            <span className="pointer-events-none absolute -bottom-1.5 -right-1.5 z-30 h-4 w-4 border-b-2 border-r-2 border-venom-500/60" aria-hidden />

            <div
              className="rounded-xl border border-pit-line bg-gradient-to-b from-pit-800 to-pit-900 p-2 shadow-[0_0_70px_-16px_rgba(163,230,53,0.35),0_30px_60px_-30px_rgba(0,0,0,0.9)]"
            >
              <div
                className="relative touch-none select-none overflow-hidden rounded-[10px]"
                onPointerDown={g.onBoardPointerDown}
                onPointerUp={g.onBoardPointerUp}
                onPointerCancel={() => undefined}
              >
                <canvas ref={g.canvasRef} className="block aspect-square w-full" aria-label="Snake game board" />
                <div className="scanlines pointer-events-none absolute inset-0 opacity-25" aria-hidden />
                <div className="board-vignette pointer-events-none absolute inset-0" aria-hidden />
                <BoardOverlay
                  state={g.state}
                  countdown={g.countdown}
                  score={g.score}
                  best={best}
                  len={g.len}
                  justSetRecord={g.justSetRecord}
                  difficulty={g.difficulty}
                  onStart={g.start}
                  onTogglePause={g.togglePause}
                  onRestart={g.restart}
                  onMenu={g.toMenu}
                  onSelectDifficulty={g.setDifficulty}
                />
              </div>
            </div>
          </div>

          {/* status bar */}
          <div className="mx-auto flex w-full max-w-[540px] items-center justify-between gap-3 rounded-md border border-pit-line/70 bg-pit-900/70 px-3 py-2">
            <div className="flex min-w-0 items-center gap-2">
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${g.state === "playing" ? "anim-pulse-soft" : ""}`}
                style={{ background: ledColor(g.state), boxShadow: `0 0 10px ${ledColor(g.state)}` }}
              />
              <span className="truncate text-[10px] font-semibold tracking-[0.18em] text-fog-400">
                {statusText(g.state, coarse)}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="text-[9px] font-bold tracking-[0.2em] text-fog-500">SPD</span>
              <SpeedPips tickMs={g.tickMs} dkey={g.difficulty} />
            </div>
          </div>

          {/* mobile quick controls */}
          <div className="mx-auto flex w-full max-w-[540px] items-center justify-center gap-2 lg:hidden">
            <button
              type="button"
              onClick={g.togglePause}
              disabled={g.state !== "playing" && g.state !== "paused"}
              className="btn-arcade no-tap-highlight flex items-center gap-2 rounded-md border border-pit-line bg-pit-800/70 px-4 py-2.5 font-arcade text-[9px] text-fog-100 enabled:hover:border-venom-500/50 enabled:hover:text-venom-300 disabled:opacity-40"
            >
              {g.state === "paused" ? <IconPlay size={10} /> : <IconPause size={10} />}
              {g.state === "paused" ? "RESUME" : "PAUSE"}
            </button>
            <button
              type="button"
              onClick={g.restart}
              className="btn-arcade no-tap-highlight flex items-center gap-2 rounded-md border border-pit-line bg-pit-800/70 px-4 py-2.5 font-arcade text-[9px] text-fog-100 hover:border-venom-500/50 hover:text-venom-300"
            >
              <IconRestart size={10} /> RESTART
            </button>
            <button
              type="button"
              onClick={g.toMenu}
              className="btn-arcade no-tap-highlight flex items-center gap-2 rounded-md border border-pit-line bg-pit-800/70 px-4 py-2.5 font-arcade text-[9px] text-fog-100 hover:border-venom-500/50 hover:text-venom-300"
            >
              <IconHome size={10} /> MENU
            </button>
          </div>

          {/* mobile difficulty */}
          <div className="mx-auto w-full max-w-[540px] lg:hidden">
            <DiffPicker
              compact
              value={g.difficulty}
              onSelect={g.setDifficulty}
              disabled={g.state === "playing" || g.state === "paused" || g.state === "countdown"}
            />
          </div>

          {/* d-pad for touch devices */}
          {coarse && (
            <div className="mx-auto mt-1 lg:hidden">
              <DPad onDir={g.pressDirection} onCenter={onCenter} centerIcon={centerIcon} />
            </div>
          )}
        </section>

        {/* right — difficulty + controls */}
        <aside className="order-3 hidden flex-col gap-4 lg:flex">
          <div className="panel rounded-lg p-4">
            <PanelLabel>DIFFICULTY</PanelLabel>
            <div className="mt-3">
              <DiffPicker
                value={g.difficulty}
                onSelect={g.setDifficulty}
                disabled={g.state === "playing" || g.state === "paused" || g.state === "countdown"}
              />
            </div>
          </div>
          <ControlsGuide />
        </aside>
      </main>

      {/* ---------- footer ---------- */}
      <footer className="mx-auto w-full max-w-[1080px] px-4 pb-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-pit-line/60 pt-3 text-[9px] font-semibold tracking-[0.3em] text-fog-500">
          <span>SERPENTINE · EAT · GROW · SURVIVE</span>
          <span className="text-fog-500/70">HIGH SCORES LIVE IN THIS BROWSER</span>
        </div>
      </footer>
    </div>
  );
}
