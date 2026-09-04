import { COLS, ROWS, type Sim, type UiState } from "./core";

export interface View {
  w: number; // css px
  h: number;
  dpr: number;
}

// Deep obsidian matrix background tiles
const BG_A = "#090f1e";
const BG_B = "#0c152a";

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Dynamic bioluminescent snake gradient */
function getSnakeColor(i: number, len: number, dead: boolean, now: number): string {
  if (dead) {
    const blink = Math.sin(now / 80) > 0;
    return blink ? "#f43f5e" : "#881337";
  }
  const t = len <= 1 ? 0 : i / (len - 1);
  // Head is bright electric cyan (188), body shifts to emerald (156) and teal (170)
  const hue = lerp(185, 150, t);
  const sat = lerp(95, 75, t);
  const light = lerp(62, 42, t);
  return `hsl(${hue.toFixed(1)}, ${sat.toFixed(1)}%, ${light.toFixed(1)}%)`;
}

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const ang = (Math.PI / 4) * i - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.44;
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

  // Screen shake
  const shakeMag = sim.shake * sim.shake * 8;
  if (shakeMag > 0.05) {
    ctx.translate((Math.random() - 0.5) * shakeMag, (Math.random() - 0.5) * shakeMag);
  }

  // ---- 1. Board Tiles & Subtle Holographic Grid ----
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? BG_A : BG_B;
      ctx.fillRect(x * cell, y * cell, cell + 0.5, cell + 0.5);
    }
  }

  // Faint cyan grid shimmer lines
  ctx.strokeStyle = "rgba(56, 189, 248, 0.05)";
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

  // ---- 2. Inner Wall Glow / Danger Zone Border ----
  if (sim.dangerActive) {
    const hazardPulse = 0.5 + Math.sin(now / 140) * 0.45;
    ctx.strokeStyle = `rgba(244, 63, 94, ${hazardPulse.toFixed(2)})`;
    ctx.lineWidth = 3.5;
    ctx.strokeRect(1.5, 1.5, w - 3, h - 3);

    // Neon Danger Banner
    ctx.save();
    ctx.font = `800 ${Math.round(cell * 0.44)}px "Outfit", sans-serif`;
    ctx.fillStyle = `rgba(251, 191, 36, ${(hazardPulse * 0.9).toFixed(2)})`;
    ctx.textAlign = "center";
    ctx.shadowColor = "rgba(244, 63, 94, 0.8)";
    ctx.shadowBlur = cell * 0.6;
    ctx.fillText("⚡ THỬ THÁCH 1000 ĐIỂM ⚡", w / 2, cell * 0.85);
    ctx.restore();
  } else {
    // Normal elegant cyan-emerald border
    ctx.strokeStyle = "rgba(34, 211, 238, 0.28)";
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, w - 2, h - 2);
  }

  // ---- 3. Obstacles (Sci-Fi Obsidian Monoliths) ----
  if (sim.obstacles && sim.obstacles.length > 0) {
    for (const ob of sim.obstacles) {
      const ox = ob.x * cell;
      const oy = ob.y * cell;
      const pad = cell * 0.12;
      const rw = cell - pad * 2;
      const rh = cell - pad * 2;
      const isTrap = sim.trapObstacle && sim.trapObstacle.x === ob.x && sim.trapObstacle.y === ob.y;

      ctx.save();
      // Outer glow
      ctx.shadowColor = isTrap ? "rgba(244, 63, 94, 1)" : "rgba(250, 204, 21, 0.5)";
      ctx.shadowBlur = cell * (isTrap ? 0.9 : 0.45);

      // Monolith body
      ctx.fillStyle = isTrap ? "#450a0a" : "#0f172a";
      ctx.beginPath();
      const rad = cell * 0.22;
      ctx.roundRect(ox + pad, oy + pad, rw, rh, rad);
      ctx.fill();

      // Neon laser border
      ctx.strokeStyle = isTrap ? "#f43f5e" : "#38bdf8";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Crystal energy facets
      ctx.strokeStyle = isTrap ? "#fde047" : "rgba(148, 163, 184, 0.7)";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(ox + pad + rw * 0.25, oy + pad + rh * 0.22);
      ctx.lineTo(ox + pad + rw * 0.5, oy + pad + rh * 0.52);
      ctx.lineTo(ox + pad + rw * 0.75, oy + pad + rh * 0.38);
      ctx.moveTo(ox + pad + rw * 0.5, oy + pad + rh * 0.52);
      ctx.lineTo(ox + pad + rw * 0.48, oy + pad + rh * 0.8);
      ctx.stroke();

      // Pulsing energy core
      const corePulse = 1 + Math.sin(now / 160) * 0.2;
      ctx.fillStyle = isTrap ? "#f43f5e" : "#facc15";
      ctx.beginPath();
      ctx.arc(ox + cell * 0.5, oy + cell * 0.5, cell * 0.09 * corePulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  // ---- 4. Food (Juicy 3D Ruby Apple & Grand Golden Apple) ----
  {
    const isGold = sim.isGoldenApple;
    const pulse = isGold ? 1 + Math.sin(now / 110) * 0.16 : 1 + Math.sin(now / 220) * 0.08;
    const fx = (sim.food.x + 0.5) * cell;
    const fy = (sim.food.y + 0.5) * cell;
    const r = cell * (isGold ? 0.44 : 0.35) * pulse;

    ctx.save();
    if (isGold) {
      // Grand Golden Apple (1000 PTS)
      // Rotating starlight halo
      ctx.save();
      ctx.translate(fx, fy);
      ctx.rotate(now / 1000);
      ctx.strokeStyle = "rgba(250, 204, 21, 0.35)";
      ctx.lineWidth = 1.5;
      drawStar(ctx, 0, 0, r * 1.6);
      ctx.stroke();
      ctx.restore();

      // Golden orb
      ctx.shadowColor = "rgba(250, 204, 21, 0.95)";
      ctx.shadowBlur = cell * 1.1;
      const g = ctx.createRadialGradient(fx - r * 0.35, fy - r * 0.4, r * 0.1, fx, fy, r);
      g.addColorStop(0, "#ffffff");
      g.addColorStop(0.3, "#fef08a");
      g.addColorStop(0.7, "#eab308");
      g.addColorStop(1, "#a16207");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(fx, fy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Golden Crown 👑
      ctx.save();
      ctx.shadowColor = "rgba(250, 204, 21, 0.9)";
      ctx.shadowBlur = cell * 0.5;
      ctx.font = `900 ${Math.round(cell * 0.5)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("👑", fx, fy - r * 0.85);

      // "1000" badge below
      ctx.font = `800 ${Math.round(cell * 0.4)}px "Outfit", sans-serif`;
      ctx.fillStyle = "#fef08a";
      ctx.fillText("1000", fx, fy + r * 1.5);
      ctx.restore();
    } else {
      // Juicy 3D Ruby Apple
      // Soft outer neon glow halo
      ctx.shadowColor = "rgba(244, 63, 94, 0.85)";
      ctx.shadowBlur = cell * 0.65;

      const g = ctx.createRadialGradient(fx - r * 0.35, fy - r * 0.38, r * 0.1, fx, fy, r);
      g.addColorStop(0, "#ffffff");
      g.addColorStop(0.35, "#fb7185");
      g.addColorStop(0.75, "#e11d48");
      g.addColorStop(1, "#881337");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(fx, fy, r, 0, Math.PI * 2);
      ctx.fill();

      // Top specular glossy shine spot
      ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
      ctx.beginPath();
      ctx.ellipse(fx - r * 0.32, fy - r * 0.35, r * 0.22, r * 0.12, -0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Cute emerald curled leaf
      ctx.save();
      ctx.fillStyle = "#10b981";
      ctx.shadowColor = "rgba(16, 185, 129, 0.6)";
      ctx.shadowBlur = cell * 0.2;
      ctx.beginPath();
      ctx.ellipse(fx + r * 0.36, fy - r * 1.05, r * 0.35, r * 0.18, -0.65, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // ---- 5. Bonus Star (Golden Berry) ----
  if (sim.bonus) {
    const remain = sim.bonus.expiresAt - now;
    const blinking = remain < 2200;
    const alpha = blinking ? (Math.sin(now / 85) > 0 ? 1 : 0.25) : 1;
    const bx = (sim.bonus.pos.x + 0.5) * cell;
    const by = (sim.bonus.pos.y + 0.5) * cell;
    const spin = now / 800;
    const r = cell * 0.42 * (1 + Math.sin(now / 160) * 0.1);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(bx, by);
    ctx.rotate(spin);
    ctx.shadowColor = "rgba(250, 204, 21, 0.95)";
    ctx.shadowBlur = cell * 0.75;
    ctx.fillStyle = "#facc15";
    drawStar(ctx, 0, 0, r);
    ctx.fill();
    ctx.fillStyle = "rgba(254, 240, 138, 0.9)";
    drawStar(ctx, 0, 0, r * 0.45);
    ctx.fill();
    ctx.restore();
  }

  // ---- 6. The Bioluminescent Snake ----
  const p = Math.min(1, Math.max(0, sim.acc / sim.tickMs));
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < sim.len && i < sim.trail.length; i++) {
    const a = sim.trail[Math.min(i + 1, sim.trail.length - 1)];
    const b = sim.trail[i];
    pts.push({ x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p) });
  }

  const bodyW = cell * 0.76;

  // Body segments (Tail -> Head) with glowing neon capsules
  for (let i = pts.length - 1; i >= 1; i--) {
    const segColor = getSnakeColor(i, sim.len, sim.dead, now);
    const segWidth = bodyW * (1 - (i / sim.len) * 0.28);

    // Outer bloom glow
    ctx.save();
    if (!sim.dead) {
      ctx.shadowColor = segColor;
      ctx.shadowBlur = cell * 0.35;
    }
    ctx.strokeStyle = segColor;
    ctx.lineWidth = segWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo((pts[i].x + 0.5) * cell, (pts[i].y + 0.5) * cell);
    ctx.lineTo((pts[i - 1].x + 0.5) * cell, (pts[i - 1].y + 0.5) * cell);
    ctx.stroke();
    ctx.restore();

    // Subtle center spine highlight line
    if (!sim.dead && i % 2 === 0) {
      ctx.save();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
      ctx.lineWidth = segWidth * 0.24;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo((pts[i].x + 0.5) * cell, (pts[i].y + 0.5) * cell);
      ctx.lineTo((pts[i - 1].x + 0.5) * cell, (pts[i - 1].y + 0.5) * cell);
      ctx.stroke();
      ctx.restore();
    }
  }

  // ---- 7. Cute Expressive Snake Head ----
  if (pts.length > 0) {
    const hp = pts[0];
    const hx = (hp.x + 0.5) * cell;
    const hy = (hp.y + 0.5) * cell;
    const hr = cell * 0.48;

    ctx.save();
    if (!sim.dead) {
      ctx.shadowColor = "rgba(56, 189, 248, 0.9)";
      ctx.shadowBlur = cell * 0.65;
    }

    // Head base with rich gradient
    const headGrad = ctx.createRadialGradient(hx - hr * 0.25, hy - hr * 0.3, hr * 0.1, hx, hy, hr);
    if (!sim.dead) {
      headGrad.addColorStop(0, "#a5f3fc");
      headGrad.addColorStop(0.5, "#22d3ee");
      headGrad.addColorStop(1, "#059669");
    } else {
      headGrad.addColorStop(0, "#fca5a5");
      headGrad.addColorStop(0.5, "#f43f5e");
      headGrad.addColorStop(1, "#881337");
    }
    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.arc(hx, hy, hr, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const d = sim.dir;
    const fx = d === 1 ? 1 : d === 3 ? -1 : 0;
    const fy = d === 2 ? 1 : d === 0 ? -1 : 0;
    const px = d === 0 || d === 2 ? 1 : 0;
    const py = d === 1 || d === 3 ? 1 : 0;

    // Animated Cute Forked Tongue (flicks when moving)
    if (!sim.dead && Math.sin(now / 90) > 0.4) {
      const tx = hx + fx * hr * 1.35;
      const ty = hy + fy * hr * 1.35;
      ctx.save();
      ctx.strokeStyle = "#fb7185";
      ctx.lineWidth = Math.max(1.6, cell * 0.08);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(hx + fx * hr * 0.8, hy + fy * hr * 0.8);
      ctx.lineTo(tx, ty);
      // Fork tips
      ctx.lineTo(tx + (fx + px * 0.7) * cell * 0.14, ty + (fy + py * 0.7) * cell * 0.14);
      ctx.moveTo(tx, ty);
      ctx.lineTo(tx + (fx - px * 0.7) * cell * 0.14, ty + (fy - py * 0.7) * cell * 0.14);
      ctx.stroke();
      ctx.restore();
    }

    // Eyes
    if (!sim.dead) {
      const eo = hr * 0.42; // eye forward offset
      const es = hr * 0.36; // eye side spread

      for (const s of [-1, 1]) {
        const ex = hx + fx * eo + px * s * es;
        const ey = hy + fy * eo + py * s * es;

        // Sclera (White eye background)
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(ex, ey, hr * 0.28, 0, Math.PI * 2);
        ctx.fill();

        // Big cute dark pupil
        const pupilOffset = hr * 0.08;
        const pux = ex + fx * pupilOffset;
        const puy = ey + fy * pupilOffset;
        ctx.fillStyle = "#0f172a";
        ctx.beginPath();
        ctx.arc(pux, puy, hr * 0.18, 0, Math.PI * 2);
        ctx.fill();

        // Dual shiny anime specular sparkles ✨
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(pux - hr * 0.05, puy - hr * 0.05, hr * 0.08, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(pux + hr * 0.05, puy + hr * 0.04, hr * 0.04, 0, Math.PI * 2);
        ctx.fill();

        // Soft pink blush cheeks 😊
        ctx.fillStyle = "rgba(251, 113, 133, 0.42)";
        ctx.beginPath();
        ctx.arc(ex - fx * hr * 0.1 + px * s * hr * 0.12, ey - fy * hr * 0.1 + py * s * hr * 0.12, hr * 0.15, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // Cute dizzy cartoon X X eyes
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = Math.max(2, cell * 0.09);
      ctx.lineCap = "round";
      const es = hr * 0.36;
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

  // ---- 8. Particles (Glowing Cyber Dust) ----
  for (const pt of sim.particles) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, pt.life);
    ctx.shadowColor = pt.color;
    ctx.shadowBlur = cell * 0.3;
    ctx.fillStyle = pt.color;
    ctx.beginPath();
    ctx.arc(pt.x * cell, pt.y * cell, Math.max(0.5, pt.size * cell * pt.life), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.globalAlpha = 1;

  // ---- 9. Floating Score Text ----
  for (const f of sim.floaters) {
    const t = 1 - f.life / f.total;
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - t * t);
    ctx.shadowColor = f.color;
    ctx.shadowBlur = cell * 0.5;
    ctx.fillStyle = f.color;
    ctx.font = `800 ${Math.round(cell * 0.54)}px "Outfit", sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(f.text, f.x * cell, (f.y - t * 1.2) * cell);
    ctx.restore();
  }
  ctx.globalAlpha = 1;

  // ---- 10. Death Flash ----
  if (sim.flash > 0.01) {
    ctx.fillStyle = `rgba(244, 63, 94, ${(sim.flash * 0.35).toFixed(3)})`;
    ctx.fillRect(-8, -8, w + 16, h + 16);
  }

  // Dim when paused
  if (state === "paused") {
    ctx.fillStyle = "rgba(6, 9, 19, 0.45)";
    ctx.fillRect(0, 0, w, h);
  }
}
