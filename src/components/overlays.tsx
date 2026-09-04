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
      <span className="anim-zoom-num font-arcade text-5xl font-extrabold tracking-wider text-emerald-400 glow-lime md:text-6xl">
        GO!
      </span>
    </div>
  );
}

const shell =
  "absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 rounded-2xl bg-[#070b16]/88 px-6 text-center backdrop-blur-xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)]";

const btnPrimary =
  "btn-arcade no-tap-highlight inline-flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 px-7 py-3.5 font-arcade text-xs font-bold tracking-wider text-slate-950 shadow-[0_0_30px_rgba(16,185,129,0.5)] hover:shadow-[0_0_40px_rgba(34,211,238,0.7)] cursor-pointer";

const btnGhost =
  "btn-arcade no-tap-highlight inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 font-arcade text-xs font-semibold tracking-wider text-slate-200 hover:border-cyan-400/50 hover:bg-white/10 hover:text-cyan-300 cursor-pointer backdrop-blur-md";

export function BoardOverlay(p: OverlayProps) {
  const cfg = DIFFICULTIES[p.difficulty];

  if (p.state === "playing") return <GoFlash />;

  if (p.state === "countdown") {
    const label = p.countdown > 1 ? String(p.countdown) : "READY";
    return (
      <div className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center gap-3">
        <span
          key={p.countdown}
          className={`anim-zoom-num font-arcade font-black text-6xl md:text-7xl ${
            p.countdown > 1 ? "text-emerald-400 glow-lime" : "text-cyan-300 glow-mint text-4xl md:text-5xl"
          }`}
        >
          {label}
        </span>
        <span className="font-arcade text-xs font-bold tracking-[0.3em] text-slate-400">
          {cfg.name} · {cfg.tag} SCORE
        </span>
      </div>
    );
  }

  if (p.state === "paused") {
    return (
      <div className={shell}>
        <span className="font-arcade text-3xl font-extrabold tracking-wider text-cyan-300 glow-mint anim-rise">
          PAUSED
        </span>
        <p className="max-w-[260px] text-xs leading-relaxed text-slate-300">
          Chú rắn đang tạm nghỉ. Điểm số <span className="font-bold text-emerald-400">{p.score}</span> đã được giữ an toàn.
        </p>
        <div className="anim-rise flex flex-wrap items-center justify-center gap-2.5 mt-1" style={{ animationDelay: "60ms" }}>
          <button type="button" className={btnPrimary} onClick={p.onTogglePause}>
            <IconPlay size={13} /> TIẾP TỤC
          </button>
          <button type="button" className={btnGhost} onClick={p.onRestart}>
            <IconRestart size={12} /> CHƠI LẠI
          </button>
          <button type="button" className={btnGhost} onClick={p.onMenu}>
            <IconHome size={12} /> MENU
          </button>
        </div>
        <span className="text-[11px] font-medium tracking-[0.2em] text-slate-400 mt-2">
          BẤM <kbd className="kbd">SPACE</kbd> ĐỂ TIẾP TỤC
        </span>
      </div>
    );
  }

  if (p.state === "over" || p.state === "won") {
    const won = p.state === "won";
    return (
      <div className={shell}>
        {p.justSetRecord && (
          <span className="anim-pop inline-flex items-center gap-1.5 rounded-full border border-amber-400/50 bg-amber-400/10 px-3 py-1 font-arcade text-xs font-bold text-amber-300 glow-gold shadow-[0_0_15px_rgba(250,204,21,0.3)]">
            <IconStar size={12} /> KỶ LỤC MỚI!
          </span>
        )}
        <span
          className={`anim-rise font-arcade text-3xl font-black leading-tight md:text-4xl ${
            won
              ? "text-emerald-400 glow-lime"
              : p.score >= 1000
              ? "text-amber-300 glow-gold"
              : p.score === 990
              ? "text-amber-300 glow-gold"
              : "text-rose-500 glow-coral"
          }`}
        >
          {won
            ? "CHIẾN THẮNG!"
            : p.score >= 1000
            ? "🏆 HUYỀN THOẠI 1000+ ĐIỂM! 👑"
            : p.score === 990
            ? "ÔI TIẾC QUÁ! 990 ĐIỂM! 😭"
            : "GAME OVER"}
        </span>

        {won && <p className="-mt-1 text-xs tracking-[0.2em] text-slate-300">BẠN ĐÃ ĂN HẾT MỌI THỨ TRÊN SÂN</p>}

        {!won && p.score >= 1000 && (
          <div className="anim-rise max-w-[320px] rounded-xl border border-amber-400/40 bg-gradient-to-b from-amber-500/15 to-amber-950/30 p-3 text-center text-xs leading-relaxed text-amber-200 shadow-[0_0_25px_rgba(250,204,21,0.25)] backdrop-blur-md">
            <p className="font-extrabold text-amber-300 text-sm">🎉 KỶ LỤC VÔ TIỀN KHOÁNG HẬU!</p>
            <p className="mt-1 text-[11px] text-slate-200">
              Đã chính thức phá đảo mốc 1000 điểm không tưởng! Bạn là bậc thầy rắn săn mồi chân chính! 💖
            </p>
          </div>
        )}

        {!won && p.score === 990 && (
          <div className="anim-rise max-w-[320px] rounded-xl border border-amber-400/40 bg-gradient-to-b from-amber-500/15 to-amber-950/30 p-3 text-center text-xs leading-relaxed text-amber-200 shadow-[0_0_25px_rgba(250,204,21,0.25)] backdrop-blur-md">
            <p className="font-extrabold text-amber-300 text-sm">🔥 CHỈ THIẾU ĐÚNG 10 ĐIỂM NỮA LÀ 1000 ĐIỂM!</p>
            <p className="mt-1 text-[11px] text-slate-200">
              Tảng đá bất ngờ sập xuống cản đường mất rồi! Chơi lại để phục thù nào em yêu! 💕
            </p>
          </div>
        )}

        {!won && p.score >= 850 && p.score < 990 && (
          <p className="-mt-1 text-xs tracking-wider text-slate-300">
            Đã vượt qua được mốc <span className="font-bold text-emerald-400">{p.score}</span> điểm hiểm trở!
          </p>
        )}

        {/* Score comparison card */}
        <div className="anim-rise flex items-center justify-center gap-7 my-1 rounded-xl border border-white/10 bg-white/[0.03] px-6 py-3" style={{ animationDelay: "70ms" }}>
          <div>
            <div className="text-[10px] font-bold tracking-[0.25em] text-slate-400">ĐIỂM SỐ</div>
            <div key={p.score} className="anim-pop mt-0.5 font-arcade text-3xl font-black text-emerald-400 glow-lime md:text-4xl">
              {p.score}
            </div>
          </div>
          <div className="h-10 w-px bg-white/15" />
          <div className="text-left">
            <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.25em] text-slate-400">
              <IconTrophy size={11} /> KỶ LỤC
            </div>
            <div className="mt-0.5 font-arcade text-xl font-extrabold text-amber-300 glow-gold">{Math.max(p.best, p.score)}</div>
            <div className="mt-0.5 text-[11px] text-slate-400 font-medium">CHIỀU DÀI: {p.len}</div>
          </div>
        </div>

        <div className="anim-rise flex flex-wrap items-center justify-center gap-2.5 mt-1" style={{ animationDelay: "130ms" }}>
          <button type="button" className={btnPrimary} onClick={p.onRestart}>
            <IconRestart size={13} /> THỬ LẠI
          </button>
          <button type="button" className={btnGhost} onClick={p.onMenu}>
            <IconHome size={13} /> MENU
          </button>
        </div>
        <span className="text-[11px] font-medium tracking-[0.2em] text-slate-400 mt-1">
          CHẠM HOẶC BẤM <kbd className="kbd">R</kbd> ĐỂ CHƠI LẠI
        </span>
      </div>
    );
  }

  // Idle — attract mode behind the menu
  return (
    <div className={shell}>
      <span className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-3 py-1 font-arcade text-[10px] font-bold tracking-[0.25em] text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
        ARCADE DEMO
      </span>
      <div className="anim-rise">
        <h1 className="font-arcade text-3xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 md:text-4xl drop-shadow-[0_0_25px_rgba(16,185,129,0.5)]">
          SERPENTINE
        </h1>
        <p className="mt-1 text-xs font-semibold tracking-[0.35em] text-slate-400">CYBER SNAKE ARENA</p>
      </div>

      <div className="anim-rise flex w-full max-w-[320px] flex-col gap-3 my-1" style={{ animationDelay: "80ms" }}>
        <button type="button" className={`${btnPrimary} w-full anim-ring`} onClick={p.onStart}>
          <IconPlay size={14} /> BẮT ĐẦU CHƠI
        </button>
        <DiffPicker compact value={p.difficulty} onSelect={p.onSelectDifficulty} />
      </div>

      <p className="anim-rise max-w-[320px] text-xs leading-relaxed text-slate-300" style={{ animationDelay: "140ms" }}>
        Ăn táo để lớn, né tránh các tảng đá rơi và đừng cắn vào đuôi.
        <span className="text-amber-300 font-semibold"> Quả sao vàng</span> cộng 50 điểm!
      </p>
      <div className="anim-rise flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs tracking-wider text-slate-400" style={{ animationDelay: "180ms" }}>
        <span>
          <kbd className="kbd">SPACE</kbd> BẮT ĐẦU
        </span>
        <span>
          <kbd className="kbd">↑↓←→</kbd> ĐIỀU KHIỂN
        </span>
        <span className="text-cyan-400 font-medium">VUỐT TRÊN ĐIỆN THOẠI</span>
      </div>
    </div>
  );
}
