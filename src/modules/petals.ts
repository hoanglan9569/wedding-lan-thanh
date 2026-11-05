/**
 * Mưa cánh sen trên hero. Lõi wasm chạy toàn bộ mô phỏng và trả về ma trận
 * canvas tính sẵn theo pixel thiết bị, nên JS mỗi khung chỉ còn setTransform
 * và fill; gradient và đường cong dựng một lần rồi dùng lại.
 */
import { getCore } from '../vendor/motion-core/core';
import { onFrame, wake } from '../vendor/motion-core/anim';
import { reduceMotion } from './scroll';

const COLORS = ['238, 196, 203', '246, 220, 224', '226, 235, 224', '252, 246, 238'];

function unitPetal(): Path2D {
  const p = new Path2D();
  p.moveTo(0, -1);
  p.bezierCurveTo(0.74, -0.42, 0.6, 0.62, 0, 1);
  p.bezierCurveTo(-0.6, 0.62, -0.74, -0.42, 0, -1);
  p.closePath();
  return p;
}

/** Toạ độ gradient nằm trong hệ đơn vị nên bốn gradient dựng một lần là đủ. */
function unitFills(ctx: CanvasRenderingContext2D): CanvasGradient[] {
  return COLORS.map((rgb) => {
    const grad = ctx.createLinearGradient(0, -1, 0, 1);
    grad.addColorStop(0, `rgba(${rgb}, 0.12)`);
    grad.addColorStop(0.55, `rgba(${rgb}, 0.9)`);
    grad.addColorStop(1, `rgba(${rgb}, 0.3)`);
    return grad;
  });
}

export function initPetals(canvas: HTMLCanvasElement): void {
  const core = getCore();
  if (reduceMotion || !core) {
    canvas.remove();
    return;
  }
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  const path = unitPetal();
  const fills = unitFills(ctx);
  const fieldCount = core.petalsFieldCount;
  let visible = true;
  let count = 0;

  const resize = (): void => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    count = core.petals_resize(rect.width, rect.height, dpr, 0);
  };

  const draw = (): void => {
    const data = core.petalsOut;
    const end = count * fieldCount;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let hue = 0; hue < fills.length; hue += 1) {
      ctx.fillStyle = fills[hue]!;
      for (let o = 0; o < end; o += fieldCount) {
        if (data[o + 7] !== hue) continue;
        ctx.setTransform(data[o]!, data[o + 1]!, data[o + 2]!, data[o + 3]!, data[o + 4]!, data[o + 5]!);
        ctx.globalAlpha = data[o + 6]!;
        ctx.fill(path);
      }
    }
  };

  resize();
  onFrame((_now, dt) => {
    if (!visible) return false;
    core.petals_step(dt);
    draw();
    return true;
  });
  wake();

  window.addEventListener('resize', () => {
    resize();
    wake();
  });

  const io = new IntersectionObserver(
    ([entry]) => {
      visible = entry?.isIntersecting ?? true;
      if (visible) wake();
    },
    { threshold: 0.02 },
  );
  io.observe(canvas);
}
