export const COLS = 21;
export const ROWS = 21;
export const CELLS = COLS * ROWS;

export const APPLE_POINTS = 10;
export const BONUS_POINTS = 50;
export const BONUS_EVERY = 5; // every Nth apple spawns a bonus berry
export const BONUS_TTL_MS = 6800;

/** Direction encoded as 0=up, 1=right, 2=down, 3=left */
export type Dir = 0 | 1 | 2 | 3;
export const DX = [0, 1, 0, -1] as const;
export const DY = [-1, 0, 1, 0] as const;

export const opposite = (d: Dir): Dir => (((d + 2) % 4) as Dir);

export interface Pt {
  x: number;
  y: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // 0..1
  decay: number;
  size: number;
  color: string;
  gravity: number;
}

export interface Floater {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number; // ms remaining
  total: number;
}

export interface Bonus {
  pos: Pt;
  expiresAt: number; // performance.now() ms
}

export interface Sim {
  trail: Pt[]; // [head, ...body]; invariant: trail.length === len + 1
  len: number; // snake length in cells
  grow: number; // pending growth
  dir: Dir; // currently applied direction
  queue: Dir[]; // buffered inputs
  food: Pt;
  bonus: Bonus | null;
  apples: number;
  tickMs: number;
  acc: number;
  particles: Particle[];
  floaters: Floater[];
  shake: number; // 0..1 decaying
  flash: number; // 0..1 decaying red flash
  dead: boolean;
  deathAt: number;
  autopilot: boolean;
}

export type DifficultyKey = "chill" | "classic" | "blitz";

export interface DifficultyCfg {
  key: DifficultyKey;
  name: string;
  tag: string;
  desc: string;
  baseMs: number;
  minMs: number;
  mult: number;
  hue: string; // css color used for accents
}

export const DIFFICULTIES: Record<DifficultyKey, DifficultyCfg> = {
  chill: {
    key: "chill",
    name: "CHILL",
    tag: "×1",
    desc: "A lazy glide through the garden.",
    baseMs: 168,
    minMs: 124,
    mult: 1,
    hue: "#43d9bd",
  },
  classic: {
    key: "classic",
    name: "CLASSIC",
    tag: "×2",
    desc: "The 1997 handset experience.",
    baseMs: 116,
    minMs: 78,
    mult: 2,
    hue: "#a3e635",
  },
  blitz: {
    key: "blitz",
    name: "BLITZ",
    tag: "×3",
    desc: "Twitch reflexes. Triple score.",
    baseMs: 78,
    minMs: 52,
    mult: 3,
    hue: "#ff8a70",
  },
};

export const DIFF_ORDER: DifficultyKey[] = ["chill", "classic", "blitz"];

export type UiState = "idle" | "countdown" | "playing" | "paused" | "over" | "won";

const rand = (n: number) => Math.floor(Math.random() * n);

function freeCell(sim: Pick<Sim, "trail" | "len">, avoid: Pt[]): Pt | null {
  const occupied = new Set<number>();
  for (let i = 0; i < sim.len && i < sim.trail.length; i++) {
    const p = sim.trail[i];
    occupied.add(p.y * COLS + p.x);
  }
  for (const a of avoid) occupied.add(a.y * COLS + a.x);
  if (occupied.size >= CELLS) return null;
  let p: Pt;
  do {
    p = { x: rand(COLS), y: rand(ROWS) };
  } while (occupied.has(p.y * COLS + p.x));
  return p;
}

export function makeSim(autopilot: boolean, cfg: DifficultyCfg): Sim {
  const cx = Math.floor(COLS / 2);
  const cy = Math.floor(ROWS / 2);
  const trail: Pt[] = [];
  for (let i = 0; i <= 3; i++) trail.push({ x: cx - i, y: cy }); // head moves right
  const sim: Sim = {
    trail,
    len: 3,
    grow: 0,
    dir: 1,
    queue: [],
    food: { x: cx + 5, y: cy },
    bonus: null,
    apples: 0,
    tickMs: cfg.baseMs,
    acc: 0,
    particles: [],
    floaters: [],
    shake: 0,
    flash: 0,
    dead: false,
    deathAt: 0,
    autopilot,
  };
  const f = freeCell(sim, []);
  if (f) sim.food = f;
  return sim;
}

export function respawnFood(sim: Sim): void {
  const avoid: Pt[] = [];
  if (sim.bonus) avoid.push(sim.bonus.pos);
  const f = freeCell(sim, avoid);
  if (f) sim.food = f;
}

export function spawnBonus(sim: Sim, now: number): void {
  const b = freeCell(sim, [sim.food]);
  if (b) sim.bonus = { pos: b, expiresAt: now + BONUS_TTL_MS };
}

export function spawnParticles(
  sim: Sim,
  x: number,
  y: number,
  colors: string[],
  count: number,
  speed: number,
  gravity = 0,
): void {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const v = (0.35 + Math.random() * 0.65) * speed;
    sim.particles.push({
      x,
      y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v,
      life: 1,
      decay: 1.4 + Math.random() * 1.6,
      size: 0.08 + Math.random() * 0.14,
      color: colors[rand(colors.length)],
      gravity,
    });
  }
  if (sim.particles.length > 240) sim.particles.splice(0, sim.particles.length - 240);
}

export function addFloater(sim: Sim, x: number, y: number, text: string, color: string): void {
  sim.floaters.push({ x, y, text, color, life: 900, total: 900 });
}

/** Greedy autopilot for the attract-mode demo snake. */
export function autopilotSteer(sim: Sim): void {
  const head = sim.trail[0];
  const opts: Dir[] = [0, 1, 2, 3].filter((d) => d !== opposite(sim.dir)) as Dir[];
  let best: Dir = sim.dir;
  let bestScore = -Infinity;
  for (const d of opts) {
    const nx = head.x + DX[d];
    const ny = head.y + DY[d];
    if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) continue;
    let hits = false;
    for (let i = 0; i < sim.len - 1 && i < sim.trail.length; i++) {
      if (sim.trail[i].x === nx && sim.trail[i].y === ny) {
        hits = true;
        break;
      }
    }
    if (hits) continue;
    const toFood = Math.abs(nx - sim.food.x) + Math.abs(ny - sim.food.y);
    const tail = sim.trail[Math.min(sim.len, sim.trail.length - 1)];
    const toTail = Math.abs(nx - tail.x) + Math.abs(ny - tail.y);
    const score = -toFood + toTail * 0.12 + Math.random() * 0.05;
    if (score > bestScore) {
      bestScore = score;
      best = d;
    }
  }
  sim.queue = [best];
}
