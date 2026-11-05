import { weddingDate } from '../data/wedding';
import * as anim from '../vendor/motion-core/anim';
import { getCore } from '../vendor/motion-core/core';

type Unit = 'days' | 'hours' | 'minutes' | 'seconds';

const UNITS: Unit[] = ['days', 'hours', 'minutes', 'seconds'];

function pad(value: number): string {
  return value < 10 ? `0${Math.max(0, value)}` : String(value);
}

/** Lật số: không bao giờ để opacity về 0 nên chữ số luôn đọc được. */
function flip(el: HTMLElement, value: string): void {
  if (el.textContent === value) return;
  if (!getCore()) {
    el.textContent = value;
    return;
  }
  anim.fromTo(el, { yPercent: 0, opacity: 1 }, { yPercent: -26, opacity: 0.28 }, {
    duration: 0.13,
    ease: 'in2',
    onComplete: () => {
      el.textContent = value;
      anim.fromTo(el, { yPercent: 26, opacity: 0.28 }, { yPercent: 0, opacity: 1 }, { duration: 0.27, ease: 'out3' });
    },
  });
}

/** Đếm ngược tới giờ tiệc 11:00 ngày 29.11.2026 (GMT+7); phép chia do wasm làm. */
export function initCountdown(): void {
  const grid = document.querySelector<HTMLElement>('#countdown-grid');
  const done = document.querySelector<HTMLElement>('#countdown-done');
  if (!grid) return;

  const cells = new Map<Unit, HTMLElement>();
  for (const unit of UNITS) {
    const el = grid.querySelector<HTMLElement>(`[data-cd="${unit}"]`);
    if (el) cells.set(unit, el);
  }

  const target = new Date(weddingDate.isoMain).getTime();

  const tick = (): void => {
    const left = target - Date.now();
    const core = getCore();
    const total = Math.max(0, Math.floor(left / 1000));
    let parts: number[];
    if (core) {
      core.countdown(total);
      const base = core.motionCountdown;
      parts = [
        core.motionOut[base]!,
        core.motionOut[base + 1]!,
        core.motionOut[base + 2]!,
        core.motionOut[base + 3]!,
      ];
    } else {
      parts = [Math.floor(total / 86400), Math.floor((total % 86400) / 3600), Math.floor((total % 3600) / 60), total % 60];
    }
    UNITS.forEach((unit, i) => {
      const el = cells.get(unit);
      if (el) flip(el, pad(parts[i]!));
    });
    if (left <= 0 && done) {
      done.hidden = false;
      grid.style.opacity = '0.45';
      window.clearInterval(timer);
    }
  };

  tick();
  const timer = window.setInterval(tick, 1000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) tick();
  });
}
