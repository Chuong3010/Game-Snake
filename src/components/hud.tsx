import { useMemo, type ReactNode } from "react";
import { DIFFICULTIES, DIFF_ORDER, type Dir, type DifficultyKey } from "../game/core";

/* ============================== icons ============================== */

const ic = "inline-block align-middle";

export function IconPlay({ size = 14 }: { size?: number }) {
  return (
    <svg className={ic} width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M4.5 2.8v10.4l8.6-5.2-8.6-5.2z" />
    </svg>
  );
}
export function IconPause({ size = 14 }: { size?: number }) {
  return (
    <svg className={ic} width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M3.5 2.5h3.2v11H3.5zM9.3 2.5h3.2v11H9.3z" />
    </svg>
  );
}
export function IconRestart({ size = 14 }: { size?: number }) {
  return (
    <svg className={ic} width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
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
    <svg className={ic} width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
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
export function IconChevron({ dir, size = 20 }: { dir: Dir; size?: number }) {
  const rot = [0, 90, 180, 270][dir];
  return (
    <svg className={ic} style={{ transform: `rotate(${rot}deg)` }} width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M8 3.2 13.5 10h-11L8 3.2z" />
    </svg>
  );
}

export function LogoMark({ size = 38 }: { size?: number }) {
  return (
    <div
      style={{ width: size, height: size }}
      className="shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 p-[1.5px] shadow-[0_0_20px_rgba(34,211,238,0.4)]"
    >
      <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-[#090e1c]">
        <svg width={size * 0.65} height={size * 0.65} viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" fill="rgba(34, 211, 238, 0.2)" />
          <path d="M8 12h8a4 4 0 0 1 0 8H8a4 4 0 0 1-4-4v-2" />
          <circle cx="14" cy="6" r="1" fill="#ffffff" />
        </svg>
      </div>
    </div>
  );
}

/* ============================== fireflies (cosmic dust) ============================== */

const FLY_COLORS = ["#22d3ee", "#10b981", "#fbbf24", "#f43f5e", "#a855f7"];

export function Fireflies({ count = 18 }: { count?: number }) {
  const flies = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const c = FLY_COLORS[i % FLY_COLORS.length];
        const s = 2.5 + Math.random() * 3.5;
        return {
          id: i,
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          size: s,
          color: c,
          dur: `${10 + Math.random() * 12}s`,
          delay: `${-Math.random() * 12}s`,
          x: `${(Math.random() - 0.5) * 160}px`,
          y: `${-30 - Math.random() * 100}px`,
          alpha: 0.3 + Math.random() * 0.45,
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
      <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
      <span className="font-arcade text-[11px] font-bold tracking-[0.2em] text-slate-400">{children}</span>
    </div>
  );
}

export function SpeedPips({ tickMs, dkey }: { tickMs: number; dkey: DifficultyKey }) {
  const cfg = DIFFICULTIES[dkey];
  const span = cfg.baseMs - cfg.minMs;
  const level = span <= 0 ? 1 : Math.min(5, Math.max(1, 1 + Math.round(((cfg.baseMs - tickMs) / span) * 4)));
  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className="h-2 w-4 rounded-full transition-all duration-300"
          style={{
            background:
              i <= level
                ? level >= 4
                  ? "linear-gradient(to right, #f43f5e, #fb7185)"
                  : "linear-gradient(to right, #10b981, #22d3ee)"
                : "rgba(255, 255, 255, 0.08)",
            boxShadow: i <= level ? "0 0 10px rgba(34, 211, 238, 0.5)" : "none",
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
    <div className="panel panel-card rounded-2xl p-5 shadow-xl">
      <PanelLabel>ĐIỂM SỐ</PanelLabel>
      <div className="mt-2.5 flex items-baseline gap-2.5">
        <span
          key={score}
          className="anim-pop inline-block font-arcade text-4xl font-black leading-none text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 drop-shadow-[0_0_20px_rgba(16,185,129,0.4)]"
        >
          {score}
        </span>
        <span className="font-arcade text-xs font-bold text-slate-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-md">
          ×{mult}
        </span>
        {isRecord && (
          <span className="anim-pop ml-auto inline-flex items-center gap-1 rounded-full border border-amber-400/50 bg-amber-400/15 px-2.5 py-1 text-[10px] font-extrabold tracking-wider text-amber-300 glow-gold">
            <IconStar size={10} /> KỶ LỤC!
          </span>
        )}
      </div>

      <div className="my-4 h-px bg-gradient-to-r from-cyan-500/30 via-white/10 to-transparent" />

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl bg-white/[0.03] border border-white/5 p-3">
          <PanelLabel>KỶ LỤC</PanelLabel>
          <div className="mt-1.5 flex items-center gap-1.5 font-arcade text-lg font-bold text-amber-300 glow-gold">
            <IconTrophy size={14} /> {best}
          </div>
        </div>
        <div className="rounded-xl bg-white/[0.03] border border-white/5 p-3">
          <PanelLabel>CHIỀU DÀI</PanelLabel>
          <div className="mt-1.5 font-arcade text-lg font-bold text-cyan-300 glow-mint">{len}</div>
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-white/[0.03] border border-white/5 p-3">
        <PanelLabel>TỐC ĐỘ</PanelLabel>
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
      <div className={`flex gap-2 ${disabled ? "pointer-events-none opacity-45" : ""}`} role="group" aria-label="Difficulty">
        {DIFF_ORDER.map((k, i) => {
          const cfg = DIFFICULTIES[k];
          const active = value === k;
          return (
            <button
              key={k}
              type="button"
              onClick={() => onSelect(k)}
              className={`btn-arcade no-tap-highlight flex-1 rounded-xl border py-2.5 px-2 font-arcade text-[11px] font-bold transition-all cursor-pointer ${
                active
                  ? "border-cyan-400/80 bg-gradient-to-b from-cyan-500/25 to-cyan-500/10 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                  : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-white"
              }`}
            >
              {cfg.name}
              <span className={`ml-1 text-[10px] ${active ? "text-amber-300" : "text-slate-500"}`}>{cfg.tag}</span>
              <span className="sr-only">, press {i + 1}</span>
            </button>
          );
        })}
      </div>
    );
  }
  return (
    <div className={`flex flex-col gap-2.5 ${disabled ? "pointer-events-none opacity-45" : ""}`} role="group" aria-label="Difficulty">
      {DIFF_ORDER.map((k, i) => {
        const cfg = DIFFICULTIES[k];
        const active = value === k;
        return (
          <button
            key={k}
            type="button"
            onClick={() => onSelect(k)}
            className={`btn-arcade no-tap-highlight group relative overflow-hidden rounded-xl border p-3.5 text-left transition-all cursor-pointer ${
              active
                ? "border-cyan-400/70 bg-gradient-to-r from-cyan-500/15 via-transparent to-transparent shadow-[0_0_20px_rgba(6,182,212,0.2)]"
                : "border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]"
            }`}
          >
            <span
              className="absolute inset-y-0 left-0 w-1 transition-opacity"
              style={{ background: cfg.hue, opacity: active ? 1 : 0 }}
            />
            <span className="flex items-center gap-2">
              <span className={`font-arcade text-sm font-bold ${active ? "text-cyan-300" : "text-slate-200"}`}>{cfg.name}</span>
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                style={{
                  background: active ? "rgba(250,204,21,0.2)" : "rgba(255,255,255,0.06)",
                  color: active ? "#fde047" : "#94a3b8",
                }}
              >
                {cfg.tag} ĐIỂM
              </span>
              <span className="ml-auto text-[11px] font-medium text-slate-500">Phím {i + 1}</span>
            </span>
            <span className="mt-1 block text-xs text-slate-400">{cfg.desc}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ============================== controls guide ============================== */

export function ControlsGuide() {
  const rows: { keys: string[]; label: string }[] = [
    { keys: ["↑↓←→", "WASD"], label: "ĐIỀU HƯỚNG" },
    { keys: ["SPACE"], label: "TẠM DỪNG / TIẾP TỤC" },
    { keys: ["R"], label: "CHƠI LẠI" },
    { keys: ["1·2·3"], label: "CHẾ ĐỘ CHƠI" },
    { keys: ["M"], label: "BẬT / TẮT ÂM" },
  ];
  return (
    <div className="panel panel-card rounded-2xl p-5 shadow-xl">
      <PanelLabel>HƯỚNG DẪN ĐIỀU KHIỂN</PanelLabel>
      <ul className="mt-3 flex flex-col gap-2.5">
        {rows.map((r) => (
          <li key={r.label} className="flex items-center justify-between gap-3">
            <span className="flex gap-1.5">
              {r.keys.map((k) => (
                <kbd key={k} className="kbd">
                  {k}
                </kbd>
              ))}
            </span>
            <span className="text-xs font-semibold text-slate-300">{r.label}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3.5 border-t border-white/10 pt-3 text-xs leading-relaxed text-slate-400">
        Trên màn hình cảm ứng: Vuốt trên sân để quẹo hoặc dùng cụm phím điều khiển ảo.
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
    "btn-arcade no-tap-highlight flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-white/5 text-slate-200 active:border-cyan-400/80 active:bg-cyan-500/20 active:text-cyan-300 backdrop-blur-md shadow-lg";
  const press = (d: Dir) => (e: React.PointerEvent) => {
    e.preventDefault();
    onDir(d);
  };
  return (
    <div className="grid select-none grid-cols-3 gap-2" style={{ touchAction: "manipulation" }}>
      <span />
      <button type="button" aria-label="Steer up" className={btn} onPointerDown={press(0)}>
        <IconChevron dir={0} size={22} />
      </button>
      <span />
      <button type="button" aria-label="Steer left" className={btn} onPointerDown={press(3)}>
        <IconChevron dir={3} size={22} />
      </button>
      <button
        type="button"
        aria-label="Pause or resume"
        className={`${btn} border-cyan-400/50 bg-cyan-500/15 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.3)]`}
        onPointerDown={(e) => {
          e.preventDefault();
          onCenter();
        }}
      >
        {centerIcon === "play" ? <IconPlay size={18} /> : centerIcon === "pause" ? <IconPause size={18} /> : <IconRestart size={18} />}
      </button>
      <button type="button" aria-label="Steer right" className={btn} onPointerDown={press(1)}>
        <IconChevron dir={1} size={22} />
      </button>
      <span />
      <button type="button" aria-label="Steer down" className={btn} onPointerDown={press(2)}>
        <IconChevron dir={2} size={22} />
      </button>
      <span />
    </div>
  );
}
