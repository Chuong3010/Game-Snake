import { useMemo, type ReactNode } from "react";
import { DIFFICULTIES, DIFF_ORDER, type Dir, type DifficultyKey } from "../game/core";

/* ============================== icons ============================== */

const ic = "inline-block align-middle";

export function IconPlay({ size = 14 }: { size?: number }) {
  return (
    <svg className={ic} width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M4 2.5v11l9-5.5-9-5.5z" />
    </svg>
  );
}
export function IconPause({ size = 14 }: { size?: number }) {
  return (
    <svg className={ic} width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M3.5 2.5h3.4v11H3.5zM9.1 2.5h3.4v11H9.1z" />
    </svg>
  );
}
export function IconRestart({ size = 14 }: { size?: number }) {
  return (
    <svg className={ic} width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9" strokeLinecap="round" />
      <path d="M13.7 1.8v3.4h-3.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
export function IconHome({ size = 14 }: { size?: number }) {
  return (
    <svg className={ic} width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M2.5 7.5 8 2.5l5.5 5v6h-4v-4h-3v4h-4z" strokeLinejoin="round" />
    </svg>
  );
}
export function IconTrophy({ size = 14 }: { size?: number }) {
  return (
    <svg className={ic} width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M4 2h8v2h2.5v1.5c0 1.9-1.4 3.3-3.2 3.5A4.5 4.5 0 0 1 9 11v1.5h2V14H5v-1.5h2V11a4.5 4.5 0 0 1-2.3-2C2.9 8.8 1.5 7.4 1.5 5.5V4H4V2zm-1 3.5c0 .9.6 1.7 1.4 1.9A6.6 6.6 0 0 1 4 5.5V5H3v.5zm9 0V5h-1v.5c0 .7-.1 1.3-.4 1.9.8-.2 1.4-1 1.4-1.9z" />
    </svg>
  );
}
export function IconStar({ size = 12 }: { size?: number }) {
  return (
    <svg className={ic} width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M8 1.5 9.9 6l4.6.4-3.5 3 .9 4.6L8 11.6l-3.9 2.4.9-4.6-3.5-3L6.1 6z" />
    </svg>
  );
}
export function IconSound({ on, size = 16 }: { on: boolean; size?: number }) {
  return (
    <svg className={ic} width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M2.5 6v4h2.5L9 13V3L5 6H2.5z" fill="currentColor" stroke="none" />
      {on ? (
        <>
          <path d="M11 5.5a3.4 3.4 0 0 1 0 5" strokeLinecap="round" />
          <path d="M12.8 3.6a6 6 0 0 1 0 8.8" strokeLinecap="round" />
        </>
      ) : (
        <path d="M11 6.2l3.6 3.6M14.6 6.2 11 9.8" strokeLinecap="round" />
      )}
    </svg>
  );
}
export function IconChevron({ dir, size = 22 }: { dir: Dir; size?: number }) {
  const rot = [0, 90, 180, 270][dir];
  return (
    <svg className={ic} style={{ transform: `rotate(${rot}deg)` }} width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M8 3.2 13.5 10h-11L8 3.2z" />
    </svg>
  );
}

export function LogoMark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden className="shrink-0">
      <rect x="1" y="1" width="30" height="30" rx="7" fill="#0e2419" stroke="rgba(163,230,53,0.4)" strokeWidth="1.5" />
      <path d="M8 9h16v5H13v2h11v7H8v-5h11v-2H8z" fill="#a3e635" />
      <rect x="21.5" y="10.2" width="2.4" height="2.4" fill="#08130d" />
    </svg>
  );
}

/* ============================== fireflies ============================== */

const FLY_COLORS = ["#a3e635", "#43d9bd", "#fbbf24", "#b8ec50"];

export function Fireflies({ count = 14 }: { count?: number }) {
  const flies = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const c = FLY_COLORS[i % FLY_COLORS.length];
        const s = 2 + Math.random() * 3.5;
        return {
          id: i,
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          size: s,
          color: c,
          dur: `${9 + Math.random() * 10}s`,
          delay: `${-Math.random() * 12}s`,
          x: `${(Math.random() - 0.5) * 140}px`,
          y: `${-30 - Math.random() * 90}px`,
          alpha: 0.25 + Math.random() * 0.4,
        };
      }),
    [count],
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {flies.map((f) => (
        <span
          key={f.id}
          className="firefly"
          style={{
            left: f.left,
            top: f.top,
            width: f.size,
            height: f.size,
            background: f.color,
            boxShadow: `0 0 ${f.size * 3}px ${f.color}`,
            filter: "blur(0.5px)",
            ["--fly-dur" as string]: f.dur,
            ["--fly-delay" as string]: f.delay,
            ["--fly-x" as string]: f.x,
            ["--fly-y" as string]: f.y,
            ["--fly-alpha" as string]: f.alpha,
          }}
        />
      ))}
    </div>
  );
}

/* ============================== panels ============================== */

export function PanelLabel({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-[3px] w-[3px] bg-venom-500" />
      <span className="text-[10px] font-bold tracking-[0.28em] text-fog-500">{children}</span>
    </div>
  );
}

export function SpeedPips({ tickMs, dkey }: { tickMs: number; dkey: DifficultyKey }) {
  const cfg = DIFFICULTIES[dkey];
  const span = cfg.baseMs - cfg.minMs;
  const level = span <= 0 ? 1 : Math.min(5, Math.max(1, 1 + Math.round(((cfg.baseMs - tickMs) / span) * 4)));
  return (
    <div className="flex items-end gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className="h-2.5 w-2"
          style={{
            transform: "skewX(-14deg)",
            background: i <= level ? (level >= 4 ? "#ff8a70" : "#a3e635") : "rgba(234,246,238,0.1)",
            boxShadow: i <= level ? "0 0 8px rgba(163,230,53,0.4)" : "none",
            transition: "background 200ms ease",
          }}
        />
      ))}
    </div>
  );
}

export interface ScorePanelProps {
  score: number;
  best: number;
  len: number;
  mult: number;
  tickMs: number;
  dkey: DifficultyKey;
  isRecord: boolean;
}

export function ScorePanel({ score, best, len, mult, tickMs, dkey, isRecord }: ScorePanelProps) {
  return (
    <div className="panel rounded-lg p-4">
      <PanelLabel>SCORE</PanelLabel>
      <div className="mt-2 flex items-baseline gap-2">
        <span key={score} className="anim-pop inline-block font-arcade text-[26px] leading-none text-venom-400 glow-lime">
          {score}
        </span>
        <span className="font-arcade text-[9px] text-fog-500">×{mult}</span>
        {isRecord && (
          <span className="anim-blink ml-auto inline-flex items-center gap-1 rounded-sm border border-gild-400/40 bg-gild-400/10 px-1.5 py-1 text-[9px] font-bold tracking-widest text-gild-300">
            <IconStar size={9} /> NEW BEST
          </span>
        )}
      </div>

      <div className="my-4 h-px bg-gradient-to-r from-venom-500/30 via-pit-line to-transparent" />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <PanelLabel>BEST</PanelLabel>
          <div className="mt-1.5 flex items-center gap-1.5 font-arcade text-[13px] text-gild-400 glow-gold">
            <IconTrophy size={12} /> {best}
          </div>
        </div>
        <div>
          <PanelLabel>LENGTH</PanelLabel>
          <div className="mt-1.5 font-arcade text-[13px] text-mint-300 glow-mint">{len}</div>
        </div>
      </div>

      <div className="mt-4">
        <PanelLabel>VELOCITY</PanelLabel>
        <div className="mt-2">
          <SpeedPips tickMs={tickMs} dkey={dkey} />
        </div>
      </div>
    </div>
  );
}

/* ============================== difficulty ============================== */

export interface DiffPickerProps {
  value: DifficultyKey;
  onSelect: (k: DifficultyKey) => void;
  disabled?: boolean;
  compact?: boolean;
}

export function DiffPicker({ value, onSelect, disabled, compact }: DiffPickerProps) {
  if (compact) {
    return (
      <div className={`flex gap-1.5 ${disabled ? "pointer-events-none opacity-45" : ""}`} role="group" aria-label="Difficulty">
        {DIFF_ORDER.map((k, i) => {
          const cfg = DIFFICULTIES[k];
          const active = value === k;
          return (
            <button
              key={k}
              type="button"
              onClick={() => onSelect(k)}
              className={`btn-arcade no-tap-highlight flex-1 rounded-md border px-2 py-2 font-arcade text-[8px] leading-relaxed ${
                active
                  ? "border-venom-500/70 bg-venom-500/15 text-venom-300 shadow-[0_0_18px_-4px_rgba(163,230,53,0.5)]"
                  : "border-pit-line bg-pit-800/60 text-fog-400 hover:border-fog-500/50 hover:text-fog-100"
              }`}
            >
              {cfg.name}
              <span className={`ml-1 ${active ? "text-gild-300" : "text-fog-500"}`}>{cfg.tag}</span>
              <span className="sr-only">, press {i + 1}</span>
            </button>
          );
        })}
      </div>
    );
  }
  return (
    <div className={`flex flex-col gap-2 ${disabled ? "pointer-events-none opacity-45" : ""}`} role="group" aria-label="Difficulty">
      {DIFF_ORDER.map((k, i) => {
        const cfg = DIFFICULTIES[k];
        const active = value === k;
        return (
          <button
            key={k}
            type="button"
            onClick={() => onSelect(k)}
            className={`btn-arcade no-tap-highlight group relative overflow-hidden rounded-md border px-3 py-2.5 text-left ${
              active
                ? "border-venom-500/60 bg-venom-500/10"
                : "border-pit-line bg-pit-800/50 hover:border-fog-500/40 hover:bg-pit-700/50"
            }`}
          >
            <span
              className="absolute inset-y-0 left-0 w-[3px] transition-opacity"
              style={{ background: cfg.hue, opacity: active ? 1 : 0 }}
            />
            <span className="flex items-center gap-2">
              <span className={`font-arcade text-[10px] ${active ? "text-venom-300" : "text-fog-100"}`}>{cfg.name}</span>
              <span
                className="rounded-sm px-1 py-0.5 text-[9px] font-bold"
                style={{ background: active ? "rgba(251,191,36,0.16)" : "rgba(234,246,238,0.06)", color: active ? "#ffe08a" : "#9cb8a6" }}
              >
                {cfg.tag} SCORE
              </span>
              <span className="ml-auto text-[10px] text-fog-500">{i + 1}</span>
            </span>
            <span className="mt-1 block text-xs text-fog-400">{cfg.desc}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ============================== controls guide ============================== */

export function ControlsGuide() {
  const rows: { keys: string[]; label: string }[] = [
    { keys: ["↑↓←→", "WASD"], label: "STEER" },
    { keys: ["SPACE"], label: "PAUSE / RESUME" },
    { keys: ["R"], label: "RESTART" },
    { keys: ["1·2·3"], label: "DIFFICULTY" },
    { keys: ["M"], label: "SOUND" },
  ];
  return (
    <div className="panel rounded-lg p-4">
      <PanelLabel>CONTROLS</PanelLabel>
      <ul className="mt-3 flex flex-col gap-2.5">
        {rows.map((r) => (
          <li key={r.label} className="flex items-center justify-between gap-3">
            <span className="flex gap-1">
              {r.keys.map((k) => (
                <kbd key={k} className="kbd">
                  {k}
                </kbd>
              ))}
            </span>
            <span className="text-[11px] font-semibold tracking-wider text-fog-400">{r.label}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 border-t border-pit-line pt-3 text-[11px] leading-relaxed text-fog-500">
        On touch screens, swipe the pit to steer — or use the pad.
      </p>
    </div>
  );
}

/* ============================== d-pad ============================== */

export interface DPadProps {
  onDir: (d: Dir) => void;
  onCenter: () => void;
  centerIcon: "play" | "pause" | "restart";
}

export function DPad({ onDir, onCenter, centerIcon }: DPadProps) {
  const btn =
    "btn-arcade no-tap-highlight flex h-14 w-14 items-center justify-center rounded-lg border border-pit-line bg-pit-800/80 text-fog-100 active:border-venom-500/60 active:bg-venom-500/20 active:text-venom-300";
  const press = (d: Dir) => (e: React.PointerEvent) => {
    e.preventDefault();
    onDir(d);
  };
  return (
    <div className="grid select-none grid-cols-3 gap-1.5" style={{ touchAction: "manipulation" }}>
      <span />
      <button type="button" aria-label="Steer up" className={btn} onPointerDown={press(0)}>
        <IconChevron dir={0} />
      </button>
      <span />
      <button type="button" aria-label="Steer left" className={btn} onPointerDown={press(3)}>
        <IconChevron dir={3} />
      </button>
      <button
        type="button"
        aria-label="Pause or resume"
        className={`${btn} border-venom-500/30 bg-pit-700/80 text-venom-400`}
        onPointerDown={(e) => {
          e.preventDefault();
          onCenter();
        }}
      >
        {centerIcon === "play" ? <IconPlay size={18} /> : centerIcon === "pause" ? <IconPause size={18} /> : <IconRestart size={18} />}
      </button>
      <button type="button" aria-label="Steer right" className={btn} onPointerDown={press(1)}>
        <IconChevron dir={1} />
      </button>
      <span />
      <button type="button" aria-label="Steer down" className={btn} onPointerDown={press(2)}>
        <IconChevron dir={2} />
      </button>
      <span />
    </div>
  );
}
