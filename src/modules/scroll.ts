/**
 * Cuộn: cuộn mượt cho chuột (lõi wasm giữ đích và độ trễ), khoá cuộn, nhảy
 * tới mục, và nhịp cập nhật cho các hiệu ứng bám cuộn. Trên điện thoại dùng
 * cuộn gốc của hệ điều hành: nhẹ máy và không chen vào thao tác vuốt.
 */
import { getCore } from '../vendor/motion-core/core';
import { onFrame, wake } from '../vendor/motion-core/anim';
import { refreshTracks, tickTracks } from './tracks';

// The OS "reduce motion" preference is deliberately not read. The owner's own PC
// reports it (Windows Animation effects off), and honouring it left his page with
// no motion at all; he wants every guest to get the opening, the petal rain and
// the reveals. scripts/check-motion.ts runs every check with it on and off.
export const isCoarse = window.matchMedia('(pointer: coarse)').matches;

const SETTLE_MS = 900;
let smooth = false;
let locked = false;
let driven = -1;
let busyUntil = 0;

function maxScroll(): number {
  return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
}

function keepAwake(): void {
  busyUntil = performance.now() + SETTLE_MS;
  wake();
}

function frame(now: number, dt: number): boolean {
  const core = getCore();
  if (!core) return false;
  let need = now < busyUntil;

  if (smooth && !locked) {
    // chỉ ghi khi lõi báo còn đang chạy: scrollTo thừa cũng bắt tính lại style
    if (core.scroll_step(dt)) {
      driven = core.motionOut[core.motionScroll]!;
      window.scrollTo(0, driven);
      need = true;
    }
  }

  core.scroll_tick(window.scrollY, dt);
  tickTracks(core);
  return need;
}

/** Bánh xe chuột đẩy đích, lõi wasm kéo trang tới đích đó từng khung. */
export function initSmoothScroll(): void {
  const core = getCore();
  if (!core) return;
  onFrame(frame);

  window.addEventListener(
    'scroll',
    () => {
      if (smooth && Math.abs(window.scrollY - driven) > 2) core.scroll_set(window.scrollY, 1);
      keepAwake();
    },
    { passive: true },
  );
  window.addEventListener('resize', () => {
    core.scroll_bounds(maxScroll(), 0);
    refreshTracks();
    keepAwake();
  });

  if (isCoarse) return;
  smooth = true;
  // tay cầm để công cụ kiểm tra tắt cuộn mượt trước khi chụp ảnh ghép
  (window as unknown as { __scroll?: { disable(): void } }).__scroll = {
    disable: () => {
      smooth = false;
    },
  };
  core.scroll_bounds(maxScroll(), 0.13);
  core.scroll_set(window.scrollY, 1);
  window.addEventListener(
    'wheel',
    (event) => {
      if (locked || event.ctrlKey || event.defaultPrevented) return;
      event.preventDefault();
      core.scroll_by(event.deltaY * (event.deltaMode === 1 ? 24 : 1));
      keepAwake();
    },
    { passive: false },
  );
  document.documentElement.style.scrollBehavior = 'auto';
}

export function lockScroll(on: boolean): void {
  locked = on;
  document.body.classList.toggle('is-locked', on);
  const core = getCore();
  if (!on && core) core.scroll_set(window.scrollY, 1);
}

export function scrollToSection(hash: string): void {
  const target = document.querySelector<HTMLElement>(hash);
  if (!target) return;
  const offset = target.id === 'hero' ? 0 : -74;
  const y = target.getBoundingClientRect().top + window.scrollY + offset;
  const core = getCore();
  if (smooth && core) {
    core.scroll_set(y, 0);
    keepAwake();
    return;
  }
  window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
}

export function initAnchors(): void {
  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const hash = link.getAttribute('href');
      if (!hash || hash === '#' || !document.querySelector(hash)) return;
      event.preventDefault();
      scrollToSection(hash);
    });
  });
}

/** Đo lại sau khi ảnh tải xong hoặc thiệp vừa mở. */
export function refreshScroll(): void {
  const core = getCore();
  core?.scroll_bounds(maxScroll(), 0);
  refreshTracks();
  keepAwake();
}
