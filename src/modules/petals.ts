import { reduceMotion } from './scroll';

interface Petal {
  x: number;
  y: number;
  size: number;
  speed: number;
  drift: number;
  spin: number;
  angle: number;
  alpha: number;
  hue: number;
}

const COLORS = ['238, 196, 203', '246, 220, 224', '226, 235, 224', '252, 246, 238'];

function petalCount(width: number): number {
  if (width < 620) return 12;
  if (width < 1100) return 18;
  return 26;
}

function makePetal(w: number, h: number, top = false): Petal {
  const scale = w < 620 ? 0.72 : 1;
  return {
    x: Math.random() * w,
    y: top ? -20 - Math.random() * h * 0.4 : Math.random() * h,
    size: (4 + Math.random() * 8) * scale,
    speed: 14 + Math.random() * 26,
    drift: (Math.random() - 0.5) * 26,
    spin: (Math.random() - 0.5) * 1.4,
    angle: Math.random() * Math.PI * 2,
    alpha: 0.18 + Math.random() * 0.3,
    hue: Math.floor(Math.random() * COLORS.length),
  };
}

function petalFill(ctx: CanvasRenderingContext2D, p: Petal): CanvasGradient {
  const rgb = COLORS[p.hue] ?? COLORS[0];
  const grad = ctx.createLinearGradient(0, -p.size, 0, p.size);
  grad.addColorStop(0, `rgba(${rgb}, 0.12)`);
  grad.addColorStop(0.55, `rgba(${rgb}, 0.9)`);
  grad.addColorStop(1, `rgba(${rgb}, 0.3)`);
  return grad;
}

function drawPetal(ctx: CanvasRenderingContext2D, p: Petal): void {
  const r = p.size;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.angle);
  // chao nghiêng như cánh hoa thật: bề ngang hẹp lại rồi mở ra
  ctx.scale(Math.max(0.3, Math.abs(Math.cos(p.angle * 0.85))), 1);
  ctx.globalAlpha = p.alpha;
  ctx.fillStyle = petalFill(ctx, p);
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.bezierCurveTo(r * 0.74, -r * 0.42, r * 0.6, r * 0.62, 0, r);
  ctx.bezierCurveTo(-r * 0.6, r * 0.62, -r * 0.74, -r * 0.42, 0, -r);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** Mưa cánh sen trên hero: nhẹ cho điện thoại, tự dừng khi không nhìn thấy. */
export function initPetals(canvas: HTMLCanvasElement): void {
  if (reduceMotion) {
    canvas.remove();
    return;
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let petals: Petal[] = [];
  let width = 0;
  let height = 0;
  let raf = 0;
  let last = performance.now();
  let visible = true;

  const resize = (): void => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    petals = Array.from({ length: petalCount(width) }, () => makePetal(width, height));
  };

  const frame = (now: number): void => {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    ctx.clearRect(0, 0, width, height);
    for (const p of petals) {
      p.y += p.speed * dt;
      p.x += Math.sin(p.angle) * p.drift * dt;
      p.angle += p.spin * dt;
      if (p.y - p.size > height) Object.assign(p, makePetal(width, height, true));
      drawPetal(ctx, p);
    }
    raf = requestAnimationFrame(frame);
  };

  const start = (): void => {
    if (raf || !visible) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };

  const stop = (): void => {
    if (!raf) return;
    cancelAnimationFrame(raf);
    raf = 0;
  };

  resize();
  start();

  window.addEventListener('resize', () => {
    stop();
    resize();
    start();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else start();
  });

  const io = new IntersectionObserver(
    ([entry]) => {
      visible = entry?.isIntersecting ?? true;
      if (visible) start();
      else stop();
    },
    { threshold: 0.02 },
  );
  io.observe(canvas);
}
