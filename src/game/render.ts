import { COLS, ROWS, type Sim, type UiState } from "./core";

export interface View {
  w: number; // css px
  h: number;
  dpr: number;
}

const BG_A = "#0b1d15";
const BG_B = "#0d2118";

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function segColor(i: number, len: number, dead: boolean, now: number): string {
  if (dead) {
    const blink = Math.sin(now / 70) > 0;
    return blink ? "#f95f62" : "#7a2c30";
  }
  const t = len <= 1 ? 0 : i / (len - 1);
  const hue = lerp(84, 168, t);
  const sat = lerp(78, 62, t);
  const light = lerp(64, 40, t);
  return `hsl(${hue.toFixed(1)}, ${sat.toFixed(1)}%, ${light.toFixed(1)}%)`;
}

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const ang = (Math.PI / 4) * i - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.42;
    const x = cx + Math.cos(ang) * rad;
    const y = cy + Math.sin(ang) * rad;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

export function draw(
  ctx: CanvasRenderingContext2D,
  sim: Sim,
  view: View,
  state: UiState,
  now: number,
): void {
  const { w, h, dpr } = view;
  if (w <= 0 || h <= 0) return;
  const cell = w / COLS;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  // screen shake
  const shakeMag = sim.shake * sim.shake * 7;
  if (shakeMag > 0.05) {
    ctx.translate((Math.random() - 0.5) * shakeMag, (Math.random() - 0.5) * shakeMag);
  }

  // ---- board ----
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? BG_A : BG_B;
      ctx.fillRect(x * cell, y * cell, cell + 0.5, cell + 0.5);
    }
  }

  // faint grid shimmer lines
  ctx.strokeStyle = "rgba(163, 230, 53, 0.045)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 1; i < COLS; i++) {
    ctx.moveTo(i * cell + 0.5, 0);
    ctx.lineTo(i * cell + 0.5, h);
  }
  for (let i = 1; i < ROWS; i++) {
    ctx.moveTo(0, i * cell + 0.5);
    ctx.lineTo(w, i * cell + 0.5);
  }
  ctx.stroke();

  // inner wall glow
  ctx.strokeStyle = "rgba(163, 230, 53, 0.22)";
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, w - 2, h - 2);

  // ---- food (apple) ----
  {
    const pulse = 1 + Math.sin(now / 240) * 0.09;
    const fx = (sim.food.x + 0.5) * cell;
    const fy = (sim.food.y + 0.5) * cell;
    const r = cell * 0.34 * pulse;
    ctx.save();
    ctx.shadowColor = "rgba(249, 95, 98, 0.85)";
    ctx.shadowBlur = cell * 0.6;
    const g = ctx.createRadialGradient(fx - r * 0.35, fy - r * 0.4, r * 0.15, fx, fy, r);
    g.addColorStop(0, "rgba(255, 190, 170, 1)");
    g.addColorStop(0.45, "rgba(249, 95, 98, 1)");
    g.addColorStop(1, "rgba(190, 40, 60, 1)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(fx, fy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // leaf
    ctx.fillStyle = "#a3e635";
    ctx.beginPath();
    ctx.ellipse(fx + r * 0.35, fy - r * 1.05, r * 0.34, r * 0.16, -0.7, 0, Math.PI * 2);
    ctx.fill();
  }

  // ---- bonus berry (golden star) ----
  if (sim.bonus) {
    const remain = sim.bonus.expiresAt - now;
    const blinking = remain < 2200;
    const alpha = blinking ? (Math.sin(now / 85) > 0 ? 1 : 0.2) : 1;
    const bx = (sim.bonus.pos.x + 0.5) * cell;
    const by = (sim.bonus.pos.y + 0.5) * cell;
    const spin = now / 900;
    const r = cell * 0.42 * (1 + Math.sin(now / 180) * 0.1);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(bx, by);
    ctx.rotate(spin);
    ctx.shadowColor = "rgba(251, 191, 36, 0.9)";
    ctx.shadowBlur = cell * 0.7;
    ctx.fillStyle = "#fbbf24";
    drawStar(ctx, 0, 0, r);
    ctx.fill();
    ctx.fillStyle = "rgba(255, 240, 200, 0.9)";
    drawStar(ctx, 0, 0, r * 0.45);
    ctx.fill();
    ctx.restore();
  }

  // ---- snake ----
  const p = Math.min(1, Math.max(0, sim.acc / sim.tickMs));
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < sim.len && i < sim.trail.length; i++) {
    const a = sim.trail[Math.min(i + 1, sim.trail.length - 1)];
    const b = sim.trail[i];
    pts.push({ x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p) });
  }

  const bodyW = cell * 0.72;
  // body segments, tail -> head
  for (let i = pts.length - 1; i >= 1; i--) {
    ctx.strokeStyle = segColor(i, sim.len, sim.dead, now);
    ctx.lineWidth = bodyW * (1 - (i / sim.len) * 0.35);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo((pts[i].x + 0.5) * cell, (pts[i].y + 0.5) * cell);
    ctx.lineTo((pts[i - 1].x + 0.5) * cell, (pts[i - 1].y + 0.5) * cell);
    ctx.stroke();
  }

  // head
  if (pts.length > 0) {
    const hp = pts[0];
    const hx = (hp.x + 0.5) * cell;
    const hy = (hp.y + 0.5) * cell;
    const hr = cell * 0.46;
    ctx.save();
    if (!sim.dead) {
      ctx.shadowColor = "rgba(190, 242, 100, 0.9)";
      ctx.shadowBlur = cell * 0.55;
    }
    ctx.fillStyle = segColor(0, sim.len, sim.dead, now);
    ctx.beginPath();
    ctx.arc(hx, hy, hr, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // eyes tracking direction
    if (!sim.dead) {
      const d = sim.dir;
      const fx = d === 1 ? 1 : d === 3 ? -1 : 0;
      const fy = d === 2 ? 1 : d === 0 ? -1 : 0;
      const px = d === 0 || d === 2 ? 1 : 0; // perpendicular axis
      const py = d === 1 || d === 3 ? 1 : 0;
      const eo = hr * 0.42; // eye offset forward
      const es = hr * 0.3; // eye spread
      for (const s of [-1, 1]) {
        const ex = hx + fx * eo + px * s * es;
        const ey = hy + fy * eo + py * s * es;
        ctx.fillStyle = "#eaf6ee";
        ctx.beginPath();
        ctx.arc(ex, ey, hr * 0.26, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#08130d";
        ctx.beginPath();
        ctx.arc(ex + fx * hr * 0.09, ey + fy * hr * 0.09, hr * 0.13, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // X eyes
      ctx.strokeStyle = "#08130d";
      ctx.lineWidth = Math.max(1.5, cell * 0.07);
      ctx.lineCap = "round";
      const es = hr * 0.34;
      const r2 = hr * 0.18;
      for (const s of [-1, 1]) {
        const ex = hx + s * es;
        const ey = hy - hr * 0.05;
        ctx.beginPath();
        ctx.moveTo(ex - r2, ey - r2);
        ctx.lineTo(ex + r2, ey + r2);
        ctx.moveTo(ex + r2, ey - r2);
        ctx.lineTo(ex - r2, ey + r2);
        ctx.stroke();
      }
    }
  }

  // ---- particles ----
  for (const pt of sim.particles) {
    ctx.globalAlpha = Math.max(0, pt.life);
    ctx.fillStyle = pt.color;
    ctx.beginPath();
    ctx.arc(pt.x * cell, pt.y * cell, Math.max(0.4, pt.size * cell * pt.life), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // ---- floating score text ----
  for (const f of sim.floaters) {
    const t = 1 - f.life / f.total;
    ctx.globalAlpha = Math.max(0, 1 - t * t);
    ctx.fillStyle = f.color;
    ctx.font = `700 ${Math.round(cell * 0.52)}px "Space Grotesk", sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(f.text, f.x * cell, (f.y - t * 1.1) * cell);
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = "start";

  // ---- death flash ----
  if (sim.flash > 0.01) {
    ctx.fillStyle = `rgba(249, 95, 98, ${(sim.flash * 0.32).toFixed(3)})`;
    ctx.fillRect(-8, -8, w + 16, h + 16);
  }

  // dim when paused (DOM overlay also covers)
  if (state === "paused") {
    ctx.fillStyle = "rgba(4, 14, 9, 0.35)";
    ctx.fillRect(0, 0, w, h);
  }
}
