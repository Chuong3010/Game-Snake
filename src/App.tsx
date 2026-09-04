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
      return "CHẾ ĐỘ THỬ NGHIỆM — NHẤN SPACE HOẶC CHẠM ĐỂ CHƠI";
    case "countdown":
      return "CHUẨN BỊ SẴN SÀNG…";
    case "playing":
      return coarse ? "VUỐT HOẶC DÙNG PHÍM ẢO ĐỂ ĐIỀU HƯỚNG" : "SPACE: TẠM DỪNG · R: CHƠI LẠI";
    case "paused":
      return "ĐANG TẠM DỪNG — BẤM SPACE ĐỂ TIẾP TỤC";
    case "over":
      return "BẤM R HOẶC CHẠM ĐỂ CHƠI LẠI";
    case "won":
      return "BẠN ĐÃ ĂN HẾT MỌI THỨ — BẤM R ĐỂ CHẠY LẠI";
  }
}

function ledColor(state: UiState): string {
  switch (state) {
    case "playing":
      return "#10b981";
    case "paused":
      return "#facc15";
    case "over":
      return "#f43f5e";
    case "won":
      return "#22d3ee";
    default:
      return "#38bdf8";
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

  const [logoClicks, setLogoClicks] = useState(0);
  const handleLogoClick = () => {
    const next = logoClicks + 1;
    if (next >= 3) {
      setLogoClicks(0);
      g.toggleGodMode();
    } else {
      setLogoClicks(next);
      window.setTimeout(() => setLogoClicks(0), 1000);
    }
  };

  return (
    <div className="no-tap-highlight relative flex min-h-dvh flex-col overflow-hidden font-body text-slate-100 bg-[#060913]">
      {/* ---------- ambient cosmic background ---------- */}
      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(80% 60% at 50% -10%, rgba(6, 182, 212, 0.16), transparent 60%), radial-gradient(70% 50% at 90% 110%, rgba(16, 185, 129, 0.12), transparent 60%), radial-gradient(60% 50% at 10% 90%, rgba(244, 63, 94, 0.08), transparent 55%), linear-gradient(180deg, #070b16 0%, #060913 60%, #04060c 100%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(rgba(56, 189, 248, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(56, 189, 248, 0.05) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage: "radial-gradient(80% 70% at 50% 40%, black 30%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(80% 70% at 50% 40%, black 30%, transparent 100%)",
          }}
        />
        <Fireflies count={20} />
      </div>

      {/* ---------- header ---------- */}
      <header className="mx-auto flex w-full max-w-[1100px] items-center justify-between gap-4 px-4 pb-3 pt-5">
        <div
          className="flex items-center gap-3.5 cursor-pointer select-none transition-transform active:scale-95"
          onClick={handleLogoClick}
          title="Serpentine"
        >
          <LogoMark size={42} />
          <div>
            <div className="font-arcade text-lg font-black leading-none tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 drop-shadow-[0_0_15px_rgba(34,211,238,0.4)]">
              SERPENTINE
            </div>
            <div className="mt-1 text-[10px] font-bold tracking-[0.35em] text-slate-400">CYBER SNAKE ARENA</div>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="panel panel-card flex items-center gap-2.5 rounded-xl px-3.5 py-2" title={`Best score on ${cfg.name}`}>
            <IconTrophy size={15} />
            <span key={best} className="anim-pop inline-block font-arcade text-sm font-bold text-amber-300 glow-gold">
              {best}
            </span>
            <span className="hidden text-[10px] font-bold tracking-[0.2em] text-slate-400 sm:inline">KỶ LỤC · {cfg.name}</span>
          </div>
          <button
            type="button"
            onClick={g.toggleMute}
            aria-pressed={!g.muted}
            aria-label={g.muted ? "Bật âm thanh" : "Tắt âm thanh"}
            className={`btn-arcade panel rounded-xl p-2.5 transition-all cursor-pointer ${
              g.muted ? "text-slate-500 hover:text-slate-300" : "text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
            }`}
          >
            <IconSound on={!g.muted} size={18} />
          </button>
        </div>
      </header>

      {/* ---------- main ---------- */}
      <main className="mx-auto grid w-full max-w-[1100px] flex-1 grid-cols-1 items-start gap-5 px-4 pb-6 lg:grid-cols-[250px_minmax(0,1fr)_265px] lg:gap-6">
        {/* left — score & notes */}
        <aside className="order-2 hidden flex-col gap-5 lg:order-1 lg:flex">
          <ScorePanel
            score={g.score}
            best={best}
            len={g.len}
            mult={cfg.mult}
            tickMs={g.tickMs}
            dkey={g.difficulty}
            isRecord={g.isRecord}
          />
          <div className="panel panel-card rounded-2xl p-5 shadow-xl">
            <PanelLabel>QUY TẮC CHƠI</PanelLabel>
            <ul className="mt-3.5 flex flex-col gap-2.5 text-xs leading-relaxed text-slate-300">
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 shrink-0 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                <span>Mỗi quả táo: <strong className="text-white">10 × {cfg.mult} điểm</strong>.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 shrink-0 rotate-45 bg-amber-400 shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
                <span>Mỗi 5 quả có <strong className="text-amber-300">sao vàng: 50 × {cfg.mult} điểm</strong> (~7s).</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 shrink-0 rounded-sm bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                <span>Tường viền, đá sụp và đuôi sẽ kết thúc ván.</span>
              </li>
            </ul>
          </div>
        </aside>

        {/* center — the pit arena */}
        <section className="order-1 flex flex-col gap-3.5 lg:order-2">
          {/* mobile score strip */}
          <div className="panel flex items-center justify-between gap-2 rounded-2xl px-5 py-3 lg:hidden shadow-lg">
            <div>
              <div className="text-[9px] font-bold tracking-[0.25em] text-slate-400">ĐIỂM SỐ</div>
              <div key={g.score} className="anim-pop font-arcade text-xl font-black leading-tight text-emerald-400 glow-lime">
                {g.score}
              </div>
            </div>
            <div>
              <div className="text-[9px] font-bold tracking-[0.25em] text-slate-400">KỶ LỤC</div>
              <div className="font-arcade text-xl font-bold leading-tight text-amber-300 glow-gold">{best}</div>
            </div>
            <div>
              <div className="text-[9px] font-bold tracking-[0.25em] text-slate-400">CHIỀU DÀI</div>
              <div className="font-arcade text-xl font-bold leading-tight text-cyan-300 glow-mint">{g.len}</div>
            </div>
            <div className="rounded-lg border border-amber-400/40 bg-amber-400/10 px-2 py-1 font-arcade text-[10px] font-bold text-amber-300">
              ×{cfg.mult}
            </div>
          </div>

          {/* board frame */}
          <div className="relative mx-auto w-full max-w-[550px]">
            {/* corner brackets */}
            <span className="pointer-events-none absolute -left-1.5 -top-1.5 z-30 h-4 w-4 border-l-2 border-t-2 border-cyan-400 shadow-[0_0_10px_#22d3ee]" aria-hidden />
            <span className="pointer-events-none absolute -right-1.5 -top-1.5 z-30 h-4 w-4 border-r-2 border-t-2 border-cyan-400 shadow-[0_0_10px_#22d3ee]" aria-hidden />
            <span className="pointer-events-none absolute -bottom-1.5 -left-1.5 z-30 h-4 w-4 border-b-2 border-l-2 border-cyan-400 shadow-[0_0_10px_#22d3ee]" aria-hidden />
            <span className="pointer-events-none absolute -bottom-1.5 -right-1.5 z-30 h-4 w-4 border-b-2 border-r-2 border-cyan-400 shadow-[0_0_10px_#22d3ee]" aria-hidden />

            <div
              className="rounded-2xl border border-white/10 bg-gradient-to-b from-[#0f172a] to-[#090e1c] p-2.5 shadow-[0_0_80px_-15px_rgba(6,182,212,0.25),0_30px_70px_-20px_rgba(0,0,0,0.9)]"
            >
              <div
                className="relative touch-none select-none overflow-hidden rounded-xl border border-white/5"
                onPointerDown={g.onBoardPointerDown}
                onPointerUp={g.onBoardPointerUp}
                onPointerCancel={() => undefined}
              >
                <canvas ref={g.canvasRef} className="block aspect-square w-full" aria-label="Snake game board" />
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
          <div className="mx-auto flex w-full max-w-[550px] items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 backdrop-blur-md">
            <div className="flex min-w-0 items-center gap-2.5">
              <span
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${g.state === "playing" ? "anim-pulse-soft" : ""}`}
                style={{ background: ledColor(g.state), boxShadow: `0 0 12px ${ledColor(g.state)}` }}
              />
              <span className="truncate text-xs font-semibold tracking-wider text-slate-300">
                {statusText(g.state, coarse)}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2.5">
              <span className="text-[10px] font-bold tracking-[0.2em] text-slate-400">TỐC ĐỘ</span>
              <SpeedPips tickMs={g.tickMs} dkey={g.difficulty} />
            </div>
          </div>

          {/* mobile quick controls */}
          <div className="mx-auto flex w-full max-w-[550px] items-center justify-center gap-2.5 lg:hidden">
            <button
              type="button"
              onClick={g.togglePause}
              disabled={g.state !== "playing" && g.state !== "paused"}
              className="btn-arcade no-tap-highlight flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 font-arcade text-xs font-semibold text-slate-200 enabled:hover:border-cyan-400/50 enabled:hover:text-cyan-300 disabled:opacity-40"
            >
              {g.state === "paused" ? <IconPlay size={12} /> : <IconPause size={12} />}
              {g.state === "paused" ? "TIẾP TỤC" : "TẠM DỪNG"}
            </button>
            <button
              type="button"
              onClick={g.restart}
              className="btn-arcade no-tap-highlight flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 font-arcade text-xs font-semibold text-slate-200 hover:border-cyan-400/50 hover:text-cyan-300"
            >
              <IconRestart size={12} /> CHƠI LẠI
            </button>
            <button
              type="button"
              onClick={g.toMenu}
              className="btn-arcade no-tap-highlight flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 font-arcade text-xs font-semibold text-slate-200 hover:border-cyan-400/50 hover:text-cyan-300"
            >
              <IconHome size={12} /> MENU
            </button>
          </div>

          {/* mobile difficulty */}
          <div className="mx-auto w-full max-w-[550px] lg:hidden">
            <DiffPicker
              compact
              value={g.difficulty}
              onSelect={g.setDifficulty}
              disabled={g.state === "playing" || g.state === "paused" || g.state === "countdown"}
            />
          </div>

          {/* d-pad for touch devices */}
          {coarse && (
            <div className="mx-auto mt-2 lg:hidden">
              <DPad onDir={g.pressDirection} onCenter={onCenter} centerIcon={centerIcon} />
            </div>
          )}
        </section>

        {/* right — difficulty & controls */}
        <aside className="order-3 hidden flex-col gap-5 lg:flex">
          <div className="panel panel-card rounded-2xl p-5 shadow-xl">
            <PanelLabel>CHẾ ĐỘ ĐỘ KHÓ</PanelLabel>
            <div className="mt-3.5">
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
      <footer className="mx-auto w-full max-w-[1100px] px-4 pb-5 pt-2">
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3 text-[10px] font-semibold tracking-[0.25em] text-slate-500">
          <span>SERPENTINE · ĂN TÁO · LỚN LÊN · CHINH PHỤC 1000 ĐIỂM</span>
          <span className="text-slate-500">KỶ LỤC LƯU TRỰC TIẾP TRÊN TRÌNH DUYỆT NÀY</span>
        </div>
      </footer>
    </div>
  );
}
