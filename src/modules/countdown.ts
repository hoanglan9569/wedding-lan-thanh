import { weddingDate } from '../data/wedding';
import { gsap, reduceMotion } from './scroll';

type Unit = 'days' | 'hours' | 'minutes' | 'seconds';

const UNITS: Unit[] = ['days', 'hours', 'minutes', 'seconds'];

function parts(ms: number): Record<Unit, string> {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return {
    days: String(days).padStart(2, '0'),
    hours: String(hours).padStart(2, '0'),
    minutes: String(minutes).padStart(2, '0'),
    seconds: String(seconds).padStart(2, '0'),
  };
}

function flip(el: HTMLElement, value: string): void {
  if (el.textContent === value) return;
  if (reduceMotion) {
    el.textContent = value;
    return;
  }
  // Không bao giờ để opacity về 0: chữ số luôn đọc được, kể cả ngay lúc lật
  gsap.timeline()
    .to(el, { yPercent: -26, opacity: 0.28, duration: 0.13, ease: 'power2.in' })
    .add(() => {
      el.textContent = value;
    })
    .fromTo(
      el,
      { yPercent: 26, opacity: 0.28 },
      { yPercent: 0, opacity: 1, duration: 0.27, ease: 'power3.out' },
    );
}

/** Đếm ngược tới giờ tiệc 11:00 ngày 29.11.2026 (GMT+7). */
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
    const value = parts(left);
    for (const [unit, el] of cells) flip(el, value[unit]);
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
