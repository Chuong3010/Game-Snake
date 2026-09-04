/** Tiny WebAudio synth for arcade blips. No assets, gesture-safe. */

let ctx: AudioContext | null = null;
let muted = false;

try {
  muted = localStorage.getItem("serpentine.muted") === "1";
} catch {
  muted = false;
}

export function isMuted(): boolean {
  return muted;
}

export function setMuted(m: boolean): void {
  muted = m;
  try {
    localStorage.setItem("serpentine.muted", m ? "1" : "0");
  } catch {
    /* ignore */
  }
}

function ensureCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC: typeof AudioContext | undefined =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

interface BlipOpts {
  freq: number;
  end?: number; // slide target frequency
  dur?: number;
  type?: OscillatorType;
  vol?: number;
  delay?: number;
}

function blip({ freq, end, dur = 0.09, type = "square", vol = 0.045, delay = 0 }: BlipOpts): void {
  if (muted) return;
  const ac = ensureCtx();
  if (!ac) return;
  const t0 = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (end !== undefined) osc.frequency.exponentialRampToValueAtTime(Math.max(30, end), t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export const sfx = {
  /** user gesture warm-up (unlocks audio on mobile) */
  unlock(): void {
    ensureCtx();
  },
  click(): void {
    blip({ freq: 300, end: 210, dur: 0.06, type: "triangle", vol: 0.05 });
  },
  eat(): void {
    blip({ freq: 540, dur: 0.06, vol: 0.05 });
    blip({ freq: 810, dur: 0.08, vol: 0.05, delay: 0.055 });
  },
  bonus(): void {
    blip({ freq: 660, dur: 0.07, vol: 0.05 });
    blip({ freq: 880, dur: 0.07, vol: 0.05, delay: 0.07 });
    blip({ freq: 1320, dur: 0.12, vol: 0.055, delay: 0.14 });
  },
  bonusMiss(): void {
    blip({ freq: 340, end: 180, dur: 0.14, type: "sine", vol: 0.03 });
  },
  die(): void {
    blip({ freq: 320, end: 52, dur: 0.5, type: "sawtooth", vol: 0.06 });
    blip({ freq: 160, end: 40, dur: 0.55, type: "square", vol: 0.04, delay: 0.05 });
  },
  crash(): void {
    blip({ freq: 240, end: 35, dur: 0.65, type: "sawtooth", vol: 0.09 });
    blip({ freq: 130, end: 28, dur: 0.7, type: "square", vol: 0.08, delay: 0.025 });
    blip({ freq: 80, end: 20, dur: 0.75, type: "triangle", vol: 0.09, delay: 0.05 });
  },
  win(): void {
    [523, 659, 784, 1046].forEach((f, i) =>
      blip({ freq: f, dur: 0.12, type: "triangle", vol: 0.05, delay: i * 0.09 }),
    );
  },
  count(): void {
    blip({ freq: 440, dur: 0.07, type: "square", vol: 0.04 });
  },
  go(): void {
    blip({ freq: 880, dur: 0.14, type: "square", vol: 0.05 });
  },
  pause(): void {
    blip({ freq: 500, end: 320, dur: 0.1, type: "triangle", vol: 0.04 });
  },
  resume(): void {
    blip({ freq: 320, end: 520, dur: 0.1, type: "triangle", vol: 0.04 });
  },
};
