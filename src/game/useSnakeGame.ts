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
  spawnObstacle,
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
  godMode: boolean;
  toggleGodMode: () => void;
  trigger1020Cheat: () => void;
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
  const [godMode, setGodMode] = useState(false);

  const simRef = useRef<Sim>(makeSim(true, DIFFICULTIES.classic));
  const viewRef = useRef<View>({ w: 0, h: 0, dpr: 1 });
  const stateRef = useRef<UiState>("idle");
  const diffRef = useRef(DIFFICULTIES.classic);
  const scoreRef = useRef(0);
  const bestRef = useRef(bestMap);
  const godModeRef = useRef(false);
  const timeouts = useRef<number[]>([]);
  const pointer = useRef<{ x: number; y: number; t: number } | null>(null);

  stateRef.current = state;
  diffRef.current = DIFFICULTIES[difficulty];
  bestRef.current = bestMap;
  godModeRef.current = godMode;

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
    simRef.current.godMode = godModeRef.current;
    scoreRef.current = 0;
    setScore(0);
    setLen(3);
    setTickMs(diffRef.current.baseMs);
  }, []);

  const toggleGodMode = useCallback(() => {
    setGodMode((prev) => {
      const next = !prev;
      godModeRef.current = next;
      simRef.current.godMode = next;
      if (next) {
        addFloater(simRef.current, COLS / 2, 4, "🛡️ VƯỢT BẪY 1000: BẬT", "#10b981");
        simRef.current.shake = 0.5;
        sfx.eat();
      } else {
        addFloater(simRef.current, COLS / 2, 4, "🛡️ VƯỢT BẪY 1000: TẮT", "#94a3b8");
      }
      return next;
    });
  }, []);

  const trigger1020Cheat = useCallback(() => {
    const sim = simRef.current;
    sim.godMode = true;
    godModeRef.current = true;
    setGodMode(true);
    scoreRef.current = 1020;
    setScore(1020);
    sim.obstacles = [];
    spawnParticles(sim, COLS / 2, ROWS / 2, ["#fbbf24", "#38bdf8", "#10b981", "#ffffff"], 50, 8, 3);
    addFloater(sim, COLS / 2, 3.5, "🏆 VƯỢT 1000 ĐIỂM: 1020 PTS!", "#fbbf24");
    addFloater(sim, COLS / 2, 4.8, "👑 BẬC THẦY RẮN SĂN MỒI!", "#38bdf8");
    sfx.win();
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
    // Scale points by difficulty multiplier: Chill = 10, Classic = 20, Blitz = 30
    let pts = APPLE_POINTS * cfg.mult;
    
    if (!sim.godMode) {
      // Ensure the score lands exactly on 990 without overshooting for trap setup
      if (scoreRef.current < 990 && scoreRef.current + pts > 990) {
        pts = 990 - scoreRef.current;
      } else if (scoreRef.current >= 990) {
        pts = 0;
      }
      scoreRef.current = Math.min(990, scoreRef.current + pts);
    } else {
      // GOD MODE / NORMAL PLAY: Bypass trap and allow scoring past 1000+!
      scoreRef.current += pts;
    }

    const curScore = scoreRef.current;
    setScore(curScore);
    sim.grow += 1;
    sim.apples += 1;

    // Gradual difficulty / speed ramp-up
    if (curScore < 850) {
      sim.tickMs = Math.max(cfg.minMs, sim.tickMs * 0.985);
    } else if (curScore < 950) {
      // 850 - 950: Danger Zone speeds up significantly
      sim.tickMs = Math.max(54, sim.tickMs * 0.96);
    } else if (curScore < 1000) {
      // 950 - 990: Climax speed
      sim.tickMs = Math.max(46, sim.tickMs * 0.94);
    } else {
      // Past 1000: smooth comfortable speed
      sim.tickMs = Math.max(56, sim.tickMs);
    }
    setTickMs(sim.tickMs);
    setLen(sim.len + sim.grow);

    const f = sim.food;
    spawnParticles(sim, f.x + 0.5, f.y + 0.5, ["#f95f62", "#ff8a70", "#b8ec50", "#eaf6ee"], 16, 5.5, 4);
    addFloater(sim, f.x + 0.5, f.y + 0.2, `+${pts}`, "#d3f56e");
    sfx.eat();

    // 850 Milestone: Activate Danger Zone + Natural Obstacles appear
    if (curScore >= 850 && !sim.dangerActive) {
      sim.dangerActive = true;
      sim.shake = 0.7;
      sim.flash = 0.5;
      spawnObstacle(sim, 3);
      addFloater(sim, COLS / 2, 3, "⚠️ THỬ THÁCH 1000 ĐIỂM!", "#f95f62");
      addFloater(sim, COLS / 2, 4.5, "CHƯỚNG NGẠI VẬT XUẤT HIỆN!", "#fbbf24");
    } else if (curScore >= 850 && curScore < 980 && curScore % 30 === 0) {
      // Gradually spawn 1 more obstacle every 30 points
      if (sim.obstacles.length < 7) {
        spawnObstacle(sim, 1);
        addFloater(sim, COLS / 2, 3, "⚠️ ĐỊA HÌNH SỤP ĐỔ!", "#ff8a70");
      }
    }

    // 990 Milestone:
    if (!sim.godMode && curScore >= 990) {
      sim.isGoldenApple = true;
      sim.shake = 1.0;
      addFloater(sim, COLS / 2, 3, "👑 TÁO HOÀNG KIM 1000 ĐIỂM!", "#fbbf24");
      addFloater(sim, COLS / 2, 4.5, "🔥 CHỈ CÒN 10 ĐIỂM ĐỂ THẮNG!", "#ffe08a");
    } else if (sim.godMode && curScore >= 990 && curScore < 1000) {
      sim.isGoldenApple = true;
      addFloater(sim, COLS / 2, 3, "👑 TÁO VÀNG VƯỢT MỐC!", "#fbbf24");
    }

    // 1000 Milestone: Grand Champion Triumph!
    if (curScore >= 1000 && !sim.reached1000) {
      sim.reached1000 = true;
      sim.shake = 1.2;
      sim.flash = 0.4;
      spawnParticles(sim, COLS / 2, ROWS / 2, ["#fbbf24", "#38bdf8", "#10b981", "#ffffff"], 60, 10, 3);
      addFloater(sim, COLS / 2, 3, "🏆 KỶ LỤC 1000 ĐIỂM!", "#fbbf24");
      addFloater(sim, COLS / 2, 4.5, "👑 HUYỀN THOẠI RẮN SĂN MỒI!", "#38bdf8");
      sfx.win();
    }

    respawnFood(sim);

    // Bonus stars:
    if ((curScore < 800 || sim.godMode) && sim.apples % BONUS_EVERY === 0) {
      spawnBonus(sim, performance.now());
    }
  }, []);

  const eatBonus = useCallback(() => {
    const sim = simRef.current;
    const cfg = diffRef.current;
    if (!sim.bonus) return;
    let pts = BONUS_POINTS * cfg.mult;
    if (!sim.godMode && scoreRef.current + pts > 840) {
      pts = Math.max(0, 840 - scoreRef.current);
    }
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

    // Wall collision
    if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) {
      die();
      return;
    }

    // Body collision
    const checkLen = sim.len - (sim.grow > 0 ? 0 : 1);
    for (let i = 0; i < checkLen && i < sim.trail.length; i++) {
      if (sim.trail[i].x === nx && sim.trail[i].y === ny) {
        die();
        return;
      }
    }

    // 990 FATAL AMBUSH TRAP:
    // Only triggers in normal mode (not in godMode and not in autopilot)
    if (!sim.godMode && scoreRef.current >= 990 && !sim.trapTriggered && !sim.autopilot) {
      sim.stepsAt990 = (sim.stepsAt990 || 0) + 1;
      const isEnteringFood = nx === sim.food.x && ny === sim.food.y;
      const distToFood = Math.abs(nx - sim.food.x) + Math.abs(ny - sim.food.y);

      if (isEnteringFood || distToFood <= 1 || sim.stepsAt990 >= 10) {
        sim.trapTriggered = true;
        const trapX = nx;
        const trapY = ny;
        sim.obstacles.push({ x: trapX, y: trapY, createdAt: performance.now() });
        sim.trapObstacle = { x: trapX, y: trapY };
        spawnParticles(sim, trapX + 0.5, trapY + 0.5, ["#f95f62", "#ff8a70", "#94a3b8", "#fbbf24", "#ffffff"], 40, 10, 5);
        addFloater(sim, trapX + 0.5, trapY - 0.5, "💥 ĐÁ SỤP BẤT NGỜ!", "#f95f62");
        sim.shake = 1.8;
        sim.flash = 0.8;
      }
    }

    // Obstacle collision
    if (sim.obstacles && sim.obstacles.length > 0) {
      for (let i = 0; i < sim.obstacles.length; i++) {
        const ob = sim.obstacles[i];
        if (ob.x === nx && ob.y === ny) {
          if (sim.godMode) {
            // Smash rock in God Mode
            sim.obstacles.splice(i, 1);
            spawnParticles(sim, nx + 0.5, ny + 0.5, ["#fbbf24", "#38bdf8", "#10b981", "#ffffff"], 25, 7, 3);
            addFloater(sim, nx + 0.5, ny, "⚡ PHÁ ĐÁ!", "#38bdf8");
            sim.shake = 0.5;
            sfx.eat();
            break;
          } else {
            spawnParticles(sim, nx + 0.5, ny + 0.5, ["#94a3b8", "#f95f62", "#fbbf24", "#e2e8f0"], 30, 8, 4);
            addFloater(sim, nx + 0.5, ny, "💥 VA PHẢI ĐÁ!", "#f95f62");
            sim.shake = 1.5;
            sfx.crash();
            die();
            return;
          }
        }
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

  const apiRef = useRef({
    start,
    togglePause,
    restart,
    toMenu,
    setDifficulty,
    toggleMute,
    pressDirection,
    toggleGodMode,
    trigger1020Cheat,
  });
  apiRef.current = {
    start,
    togglePause,
    restart,
    toMenu,
    setDifficulty,
    toggleMute,
    pressDirection,
    toggleGodMode,
    trigger1020Cheat,
  };

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

      // Secret shortcuts
      if (k === "g" || k === "G") {
        api.toggleGodMode();
        return;
      }
      if (k === "8" && st === "playing") {
        api.trigger1020Cheat();
        return;
      }
      if (k === "9" && st === "playing") {
        scoreRef.current = 840;
        setScore(840);
        addFloater(simRef.current, COLS / 2, 4, "⚡ TEST: 840 ĐIỂM", "#fbbf24");
        return;
      }
      if (k === "0" && st === "playing") {
        const mult = diffRef.current.mult;
        const testTarget = 990 - APPLE_POINTS * mult;
        scoreRef.current = testTarget;
        setScore(testTarget);
        simRef.current.dangerActive = true;
        if (simRef.current.obstacles.length === 0) {
          spawnObstacle(simRef.current, 3);
        }
        addFloater(simRef.current, COLS / 2, 4, `👑 TEST: ${testTarget} ĐIỂM`, "#fbbf24");
        return;
      }
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
    godMode,
    toggleGodMode,
    trigger1020Cheat,
  };
}
