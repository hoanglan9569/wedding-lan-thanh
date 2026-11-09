/**
 * Hero: parallax theo cuộn (lõi wasm giữ dải cuộn và độ trễ), chữ bay vào khi
 * mở thiệp, và thiệp nghiêng theo chuột với bộ giảm chấn trong wasm.
 * Hiệu ứng phóng ảnh chậm (ken burns) để CSS lo: không tốn khung JS nào.
 */
import * as anim from '../vendor/motion-core/anim';
import { getCore } from '../vendor/motion-core/core';
import { onFrame, wake } from '../vendor/motion-core/anim';
import { isCoarse } from './scroll';
import { addTrack } from './tracks';

export function initHero(): void {
  const media = document.querySelector<HTMLElement>('.hero__media');
  const hero = document.querySelector<HTMLElement>('.hero');
  if (!media || !hero) return;

  addTrack({
    el: hero,
    start: (top) => top,
    end: (top, height) => top + height,
    from: 0,
    to: 14,
    scrub: 0.6,
    apply: (v) => anim.set(media, { yPercent: v }),
  });

  const inner = hero.querySelector<HTMLElement>('.hero__inner');
  if (!inner) return;
  addTrack({
    el: hero,
    start: (top, height) => top + height * 0.4,
    end: (top, height) => top + height,
    from: 0,
    to: -8,
    scrub: 0.4,
    apply: (v) => anim.set(inner, { yPercent: v }),
  });
  addTrack({
    el: hero,
    start: (top, height) => top + height * 0.4,
    end: (top, height) => top + height,
    from: 1,
    to: 0.1,
    scrub: 0.4,
    apply: (v) => anim.set(inner, { opacity: v }),
  });
}

/** Thanh điều hướng hiện ra ngay sau khi mở thiệp để khách thấy nút nhạc nền. */
export function initTopbar(): void {
  const bar = document.querySelector<HTMLElement>('#topbar');
  const hero = document.querySelector<HTMLElement>('.hero');
  if (!bar || !hero) return;
  if (!document.querySelector('#intro')) bar.classList.add('topbar--on');
  document.addEventListener('intro:done', () => bar.classList.add('topbar--on'), { once: true });
}

/** Mở màn sau khi bấm "Mở thiệp": tên và ngày bay vào. */
export function playHeroIntro(): void {
  const names = document.querySelectorAll<HTMLElement>('.hero__name, .hero__amp');
  const line = document.querySelector<HTMLElement>('.hero__dateline');
  const eyebrow = document.querySelector<HTMLElement>('.hero__eyebrow');
  if (eyebrow) anim.fromTo(eyebrow, { opacity: 0, y: 18 }, { opacity: 1, y: 0 }, { duration: 0.9, ease: 'out4' });
  names.forEach((el, i) => {
    anim.fromTo(el, { opacity: 0, y: 60 }, { opacity: 1, y: 0 }, { duration: 1.3, delay: 0.1 + i * 0.12, ease: 'out4' });
  });
  if (line) {
    anim.fromTo(line, { opacity: 0, y: 26 }, { opacity: 1, y: 0 }, { duration: 1, delay: 0.55, ease: 'out4' });
  }
}

/** Hiệu ứng nghiêng nhẹ cho tấm thiệp khi rê chuột (bỏ qua trên cảm ứng). */
export function initCardTilt(): void {
  const card = document.querySelector<HTMLElement>('.card3d__inner');
  const core = getCore();
  if (!card || !core || isCoarse) return;
  const parent = card.parentElement;
  if (!parent) return;

  let busy = false;
  anim.set(card, { perspective: 1400 });
  onFrame((_now, dt) => {
    if (!busy) return false;
    busy = core.tilt_tick(dt) === 1;
    anim.set(card, {
      rotateY: core.motionOut[core.motionTiltX]!,
      rotateX: core.motionOut[core.motionTiltX + 1]!,
    });
    return busy;
  });

  parent.addEventListener('pointermove', (event) => {
    const rect = parent.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    core.tilt_target(px * 6, -py * 5, 0.12);
    busy = true;
    wake();
  });

  parent.addEventListener('pointerleave', () => {
    core.tilt_target(0, 0, 0.22);
    busy = true;
    wake();
  });
}
