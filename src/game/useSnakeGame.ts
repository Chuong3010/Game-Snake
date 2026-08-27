import { useCallback, useEffect, useRef, useState } from "react";
import {
  APPLE_POINTS,
  BONUS_EVERY,
  BONUS_POINTS,
  CELLS,
  COLS,
  DIFFICULTIES,
  DX,
  DY,
  makeSim,
  opposite,
  ROWS,
  autopilotSteer,
  respawnFood,
  spawnBonus,
  spawnParticles,
  addFloater,
  type Dir,
  type DifficultyKey,
  type Sim,
  type UiState,
} from "./core";
import { draw, type View } from "./render";
import { isMuted, setMuted as persistMuted, sfx } from "./audio";

const BEST_KEY = "serpentine.best.v1";

type BestMap = Record<DifficultyKey, number>;

function loadBest(): BestMap {
  const fallback: BestMap = { chill: 0, classic: 0, blitz: 0 };
  try {
    const raw = localStorage.getItem(BEST_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<BestMap>;
    return {
      chill: Number(parsed.chill) || 0,
      classic: Number(parsed.classic) || 0,
      blitz: Number(parsed.blitz) || 0,
    };
  } catch {
    return fallback;
  }
}

function saveBest(map: BestMap): void {
  try {
    localStorage.setItem(BEST_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export interface SnakeGame {
  canvasRef: (el: HTMLCanvasElement | null) => void;
  state: UiState;
  score: number;
  len: number;
  tickMs: number;
  bestMap: BestMap;
  isRecord: boolean;
  justSetRecord: boolean;
  difficulty: DifficultyKey;
  muted: boolean;
  countdown: number;
  start: () => void;
  togglePause: () => void;
  restart: () => void;
  toMenu: () => void;
  setDifficulty: (k: DifficultyKey) => void;
  toggleMute: () => void;
  pressDirection: (d: Dir) => void;
  onBoardPointerDown: (e: React.PointerEvent) => void;
  onBoardPointerUp: (e: React.PointerEvent) => void;
}

export function useSnakeGame(): SnakeGame {
  const canvasEl = useRef<HTMLCanvasElement | null>(null);
  const canvasRef = useCallback((el: HTMLCanvasElement | null) => {
    canvasEl.current = el;
  }, []);

  const [difficulty, setDifficultyState] = useState<DifficultyKey>("classic");
  const [state, setState] = useState<UiState>("idle");
  const [countdown, setCountdown] = useState(3);
  const [score, setScore] = useState(0);
  const [len, setLen] = useState(3);
  const [tickMs, setTickMs] = useState(DIFFICULTIES.classic.baseMs);
  const [bestMap, setBestMap] = useState<BestMap>(loadBest);
  const [justSetRecord, setJustSetRecord] = useState(false);
  const [muted, setMutedState] = useState(isMuted);

  const simRef = useRef<Sim>(makeSim(true, DIFFICULTIES.classic));
  const viewRef = useRef<View>({ w: 0, h: 0, dpr: 1 });
  const stateRef = useRef<UiState>("idle");
  const diffRef = useRef(DIFFICULTIES.classic);
  const scoreRef = useRef(0);
  const bestRef = useRef(bestMap);
  const timeouts = useRef<number[]>([]);
  const pointer = useRef<{ x: number; y: number; t: number } | null>(null);

  stateRef.current = state;
  diffRef.current = DIFFICULTIES[difficulty];
  bestRef.current = bestMap;

  const later = useCallback((fn: () => void, ms: number) => {
    timeouts.current.push(window.setTimeout(fn, ms));
  }, []);

  const clearTimers = useCallback(() => {
    for (const id of timeouts.current) clearTimeout(id);
    timeouts.current = [];
  }, []);

  /* ------------------------------------------------ actions */

  const resetSim = useCallback((autopilot: boolean) => {
    simRef.current = makeSim(autopilot, diffRef.current);
    scoreRef.current = 0;
    setScore(0);
    setLen(3);
    setTickMs(diffRef.current.baseMs);
  }, []);

  const finishRun = useCallback(
    (won: boolean) => {
      const key = diffRef.current.key;
      const prevBest = bestRef.current[key];
      const record = scoreRef.current > prevBest;
      if (record) {
        const next = { ...bestRef.current, [key]: scoreRef.current };
        setBestMap(next);
        saveBest(next);
      }
      setJustSetRecord(record);
      setState(won ? "won" : "over");
    },
    [],
  );

  const die = useCallback(() => {
    const sim = simRef.current;
    if (sim.dead) return;
    sim.dead = true;
    sim.deathAt = performance.now();
    sim.shake = 1;
    sim.flash = 1;
    const head = sim.trail[0];
    spawnParticles(sim, head.x + 0.5, head.y + 0.5, ["#f95f62", "#ff8a70", "#fbbf24", "#b8ec50"], 26, 7, 6);
    for (let i = 0; i < sim.len; i += 2) {
      const p = sim.trail[i];
      spawnParticles(sim, p.x + 0.5, p.y + 0.5, ["#f95f62", "#43d9bd"], 3, 4, 5);
    }
    if (sim.autopilot) return; // attract mode resets silently
    sfx.die();
    later(() => finishRun(false), 800);
  }, [finishRun, later]);

  const eatApple = useCallback(() => {
    const sim = simRef.current;
    const cfg = diffRef.current;
    const pts = APPLE_POINTS * cfg.mult;
    scoreRef.current += pts;
    setScore(scoreRef.current);
    sim.grow += 1;
    sim.apples += 1;
    sim.tickMs = Math.max(cfg.minMs, sim.tickMs * 0.985);
    setTickMs(sim.tickMs);
    setLen(sim.len + sim.grow);
    const f = sim.food;
    spawnParticles(sim, f.x + 0.5, f.y + 0.5, ["#f95f62", "#ff8a70", "#b8ec50", "#eaf6ee"], 16, 5.5, 4);
    addFloater(sim, f.x + 0.5, f.y + 0.2, `+${pts}`, "#d3f56e");
    sfx.eat();
    respawnFood(sim);
    if (sim.apples % BONUS_EVERY === 0) spawnBonus(sim, performance.now());
  }, []);

  const eatBonus = useCallback(() => {
    const sim = simRef.current;
    const cfg = diffRef.current;
    if (!sim.bonus) return;
    const pts = BONUS_POINTS * cfg.mult;
    scoreRef.current += pts;
    setScore(scoreRef.current);
    sim.grow += 2;
    setLen(sim.len + sim.grow);
    const b = sim.bonus.pos;
    spawnParticles(sim, b.x + 0.5, b.y + 0.5, ["#fbbf24", "#ffe08a", "#eaf6ee", "#ff8a70"], 26, 6.5, 3);
    addFloater(sim, b.x + 0.5, b.y + 0.2, `+${pts}`, "#ffe08a");
    sim.bonus = null;
    sfx.bonus();
  }, []);

  const step = useCallback(() => {
    const sim = simRef.current;
    if (sim.dead) return;
    if (sim.autopilot) autopilotSteer(sim);

    while (sim.queue.length > 0) {
      const d = sim.queue.shift() as Dir;
      if (d !== sim.dir && d !== opposite(sim.dir)) {
        sim.dir = d;
        break;
      }
    }

    const head = sim.trail[0];
    const nx = head.x + DX[sim.dir];
    const ny = head.y + DY[sim.dir];

    if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) {
      die();
      return;
    }
    const checkLen = sim.len - (sim.grow > 0 ? 0 : 1);
    for (let i = 0; i < checkLen && i < sim.trail.length; i++) {
      if (sim.trail[i].x === nx && sim.trail[i].y === ny) {
        die();
        return;
      }
    }

    sim.trail.unshift({ x: nx, y: ny });
    if (sim.grow > 0) {
      sim.grow -= 1;
      sim.len += 1;
    } else {
      sim.trail.pop();
    }

    if (nx === sim.food.x && ny === sim.food.y) {
      eatApple();
    } else if (sim.bonus && nx === sim.bonus.pos.x && ny === sim.bonus.pos.y) {
      eatBonus();
    }

    if (sim.len >= CELLS) {
      sim.dead = true;
      sfx.win();
      spawnParticles(sim, COLS / 2, ROWS / 2, ["#b8ec50", "#43d9bd", "#fbbf24", "#eaf6ee"], 60, 9, 2);
      later(() => finishRun(true), 700);
    }
  }, [die, eatApple, eatBonus, finishRun, later]);

  const start = useCallback(() => {
    sfx.unlock();
    clearTimers();
    resetSim(false);
    setJustSetRecord(false);
    setCountdown(3);
    setState("countdown");
    sfx.count();
  }, [clearTimers, resetSim]);

  const togglePause = useCallback(() => {
    const st = stateRef.current;
    if (st === "playing") {
      setState("paused");
      sfx.pause();
    } else if (st === "paused") {
      setCountdown(1);
      setState("countdown");
      sfx.resume();
    }
  }, []);

  const restart = useCallback(() => {
    start();
  }, [start]);

  const toMenu = useCallback(() => {
    clearTimers();
    resetSim(true);
    setJustSetRecord(false);
    setState("idle");
  }, [clearTimers, resetSim]);

  const setDifficulty = useCallback(
    (k: DifficultyKey) => {
      const st = stateRef.current;
      if (st === "playing" || st === "paused" || st === "countdown") return;
      sfx.unlock();
      sfx.click();
      setDifficultyState(k);
      diffRef.current = DIFFICULTIES[k];
      resetSim(st === "idle");
      if (st !== "idle") setState("idle");
    },
    [resetSim],
  );

  const toggleMute = useCallback(() => {
    setMutedState((m) => {
      persistMuted(!m);
      if (m) sfx.click();
      return !m;
    });
  }, []);

  const pressDirection = useCallback(
    (d: Dir) => {
      const st = stateRef.current;
      if (st === "over" || st === "won") return;
      if (st === "idle") {
        start();
      }
      const sim = simRef.current;
      const last = sim.queue.length > 0 ? sim.queue[sim.queue.length - 1] : sim.dir;
      if (d === last || d === opposite(last)) return;
      if (sim.queue.length < 3) sim.queue.push(d);
    },
    [start],
  );

  /* ------------------------------------------------ pointer (swipe / tap) */

  const onBoardPointerDown = useCallback((e: React.PointerEvent) => {
    pointer.current = { x: e.clientX, y: e.clientY, t: performance.now() };
  }, []);

  const onBoardPointerUp = useCallback(
    (e: React.PointerEvent) => {
      const p = pointer.current;
      pointer.current = null;
      if (!p) return;
      if ((e.target as HTMLElement).closest("button")) return;
      const dx = e.clientX - p.x;
      const dy = e.clientY - p.y;
      const dt = performance.now() - p.t;
      const dist = Math.hypot(dx, dy);
      const st = stateRef.current;

      if (dist >= 24) {
        const d: Dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : dy > 0 ? 2 : 0;
        pressDirection(d);
        return;
      }
      if (dist < 14 && dt < 400) {
        sfx.unlock();
        if (st === "idle") start();
        else if (st === "paused") togglePause();
        else if (st === "over" || st === "won") restart();
      }
    },
    [pressDirection, restart, start, togglePause],
  );

  /* ------------------------------------------------ keyboard + blur */

  const apiRef = useRef({ start, togglePause, restart, toMenu, setDifficulty, toggleMute, pressDirection });
  apiRef.current = { start, togglePause, restart, toMenu, setDifficulty, toggleMute, pressDirection };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const api = apiRef.current;
      const k = e.key;
      const dirMap: Record<string, Dir> = {
        ArrowUp: 0,
        ArrowRight: 1,
        ArrowDown: 2,
        ArrowLeft: 3,
        w: 0,
        W: 0,
        d: 1,
        D: 1,
        s: 2,
        S: 2,
        a: 3,
        A: 3,
      };
      if (k in dirMap) {
        e.preventDefault();
        api.pressDirection(dirMap[k]);
        return;
      }
      const st = stateRef.current;
      if (k === " " || k === "Enter") {
        e.preventDefault();
        if (st === "idle") api.start();
        else if (st === "countdown") return; // let the count finish
        else if (st === "playing" || st === "paused") api.togglePause();
        else api.restart();
        return;
      }
      if (k === "p" || k === "P") {
        api.togglePause();
        return;
      }
      if (k === "r" || k === "R") {
        if (st !== "idle") api.restart();
        return;
      }
      if (k === "m" || k === "M") {
        api.toggleMute();
        return;
      }
      if (k === "Escape") {
        if (st === "over" || st === "won") api.toMenu();
        else api.togglePause();
        return;
      }
      if (k === "1") api.setDifficulty("chill");
      if (k === "2") api.setDifficulty("classic");
      if (k === "3") api.setDifficulty("blitz");
    };

    const onHide = () => {
      if (stateRef.current === "playing") apiRef.current.togglePause();
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("blur", onHide);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("blur", onHide);
    };
  }, []);

  /* ------------------------------------------------ countdown */

  useEffect(() => {
    if (state !== "countdown") return;
    const id = window.setTimeout(
      () => {
        if (countdown > 1) {
          setCountdown((c) => c - 1);
          sfx.count();
        } else {
          simRef.current.acc = 0;
          setState("playing");
          sfx.go();
        }
      },
      countdown === 3 ? 720 : 640,
    );
    return () => clearTimeout(id);
  }, [state, countdown]);

  /* ------------------------------------------------ resize */

  useEffect(() => {
    const canvas = canvasEl.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(2.5, window.devicePixelRatio || 1);
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      viewRef.current = { w: rect.width, h: rect.height, dpr };
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  /* ------------------------------------------------ main loop */

  useEffect(() => {
    let raf = 0;
    let last = performance.now();

    const frame = (t: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(50, t - last);
      last = t;
      const sim = simRef.current;
      const st = stateRef.current;
      const running = st === "playing" || (sim.autopilot && !sim.dead);

      if (running) {
        sim.acc += dt;
        let guard = 0;
        while (sim.acc >= sim.tickMs && !sim.dead && guard < 4) {
          sim.acc -= sim.tickMs;
          step();
          guard += 1;
        }
        if (sim.dead) sim.acc = 0;

        // bonus expiry
        if (sim.bonus && t > sim.bonus.expiresAt) {
          const b = sim.bonus.pos;
          spawnParticles(sim, b.x + 0.5, b.y + 0.5, ["#fbbf24", "#6e8a79"], 8, 3, 2);
          sim.bonus = null;
          if (!sim.autopilot) sfx.bonusMiss();
        }
      }

      // attract-mode silent reset
      if (sim.autopilot && sim.dead && t - sim.deathAt > 900) {
        simRef.current = makeSim(true, diffRef.current);
      }

      // particles
      for (let i = sim.particles.length - 1; i >= 0; i--) {
        const p = sim.particles[i];
        p.life -= p.decay * (dt / 1000);
        if (p.life <= 0) {
          sim.particles.splice(i, 1);
          continue;
        }
        p.vy += p.gravity * (dt / 1000);
        p.x += p.vx * (dt / 1000);
        p.y += p.vy * (dt / 1000);
      }
      // floaters
      for (let i = sim.floaters.length - 1; i >= 0; i--) {
        sim.floaters[i].life -= dt;
        if (sim.floaters[i].life <= 0) sim.floaters.splice(i, 1);
      }
      sim.shake = Math.max(0, sim.shake - dt / 480);
      sim.flash = Math.max(0, sim.flash - dt / 520);

      const canvas = canvasEl.current;
      const ctx = canvas?.getContext("2d");
      if (ctx) draw(ctx, simRef.current, viewRef.current, st, t);
    };

    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      clearTimers();
    };
  }, [step, clearTimers]);

  const isRecord = score > 0 && score > bestMap[difficulty];

  return {
    canvasRef,
    state,
    score,
    len,
    tickMs,
    bestMap,
    isRecord,
    justSetRecord,
    difficulty,
    muted,
    countdown,
    start,
    togglePause,
    restart,
    toMenu,
    setDifficulty,
    toggleMute,
    pressDirection,
    onBoardPointerDown,
    onBoardPointerUp,
  };
}
