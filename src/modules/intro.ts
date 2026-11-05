import * as anim from '../vendor/motion-core/anim';
import { getCore } from '../vendor/motion-core/core';
import { reduceMotion, lockScroll, refreshScroll } from './scroll';
import { playHeroIntro } from './hero';
import { startMusic, musicWanted } from './music';

function finish(overlay: HTMLElement, playHero: boolean): void {
  overlay.classList.add('intro--gone');
  overlay.setAttribute('aria-hidden', 'true');
  overlay.remove();
  // tranh trang trí chỉ tải sau khi mở thiệp, để lần đầu vào trang thật nhẹ
  document.documentElement.classList.add('is-open');
  lockScroll(false);
  window.scrollTo(0, 0);
  refreshScroll();
  if (playHero) playHeroIntro();
  if (musicWanted()) void startMusic();
}

/**
 * Bẻ dấu niêm phong, mở nắp, rút tấm thiệp lên rồi tan vào ảnh cưới.
 * Mốc thời gian (giây) giữ nguyên như bản GSAP cũ; `hold` để tween chờ đúng
 * lượt mới chạm vào phần tử.
 */
function openSequence(overlay: HTMLElement, done: () => void): void {
  const flap = overlay.querySelector<HTMLElement>('#env-flap');
  const card = overlay.querySelector<HTMLElement>('#env-card');
  const seal = overlay.querySelector<HTMLElement>('#intro-open');
  const hint = overlay.querySelector<HTMLElement>('#intro-hint');
  const front = overlay.querySelector<HTMLElement>('.env__front');

  if (hint) anim.to(hint, { opacity: 0 }, { duration: 0.3, ease: 'out2' });
  if (seal) {
    anim.fromTo(seal, { scale: 1, rotate: 0 }, { scale: 1.18, rotate: -10 }, { duration: 0.2, ease: 'out2' });
    anim.fromTo(
      seal,
      { scale: 1.18, rotate: -10, opacity: 1 },
      { scale: 0.52, rotate: 16, opacity: 0 },
      { delay: 0.2, duration: 0.32, ease: 'in2', hold: true },
    );
  }
  if (flap) {
    anim.fromTo(flap, { rotateX: 0 }, { rotateX: -168 }, { delay: 0.3, duration: 1.05, ease: 'inOut2', hold: true });
    anim.after(0.82, () => {
      flap.style.zIndex = '-2';
    });
  }
  if (front) anim.to(front, { opacity: 0 }, { delay: 0.5, duration: 0.45, ease: 'out2', hold: true });
  if (card) {
    anim.after(0.95, () => {
      card.style.zIndex = '6';
    });
    anim.fromTo(
      card,
      { yPercent: 0, scale: 1 },
      { yPercent: -62, scale: 1.03 },
      { delay: 0.98, duration: 1.1, ease: 'out3', hold: true },
    );
    anim.fromTo(card, { scale: 1.03 }, { scale: 1.34 }, { delay: 2.38, duration: 0.9, ease: 'in2', hold: true });
  }
  anim.after(2.48, () => playHeroIntro());
  anim.to(overlay, { opacity: 0 }, { delay: 2.6, duration: 0.62, ease: 'inOut2', hold: true });
  anim.after(3.28, done);
}

function entrance(overlay: HTMLElement): void {
  const env = overlay.querySelector<HTMLElement>('#env');
  const hint = overlay.querySelector<HTMLElement>('#intro-hint');
  if (env) {
    anim.fromTo(
      env,
      { opacity: 0, y: 40, scale: 0.94 },
      { opacity: 1, y: 0, scale: 1 },
      { delay: 0.12, duration: 1.2, ease: 'out3' },
    );
  }
  if (hint) {
    anim.fromTo(hint, { opacity: 0, y: 12 }, { opacity: 1, y: 0 }, { delay: 0.8, duration: 0.9, ease: 'out2' });
  }
}

/** Mở được bằng ba cách: bấm dấu niêm phong, cuộn xuống, hoặc bàn phím. */
function bindOpeners(overlay: HTMLElement, open: () => void): () => void {
  const seal = overlay.querySelector<HTMLElement>('#intro-open');
  let touchStart = 0;

  const onWheel = (event: WheelEvent): void => {
    if (event.deltaY > 6) open();
  };
  const onTouchStart = (event: TouchEvent): void => {
    touchStart = event.touches[0]?.clientY ?? 0;
  };
  const onTouchMove = (event: TouchEvent): void => {
    const y = event.touches[0]?.clientY ?? 0;
    if (touchStart - y > 22) open();
  };
  const onKey = (event: KeyboardEvent): void => {
    if ([' ', 'Spacebar', 'ArrowDown', 'PageDown', 'Enter'].includes(event.key)) open();
  };

  seal?.addEventListener('click', open);
  window.addEventListener('wheel', onWheel, { passive: true });
  window.addEventListener('touchstart', onTouchStart, { passive: true });
  window.addEventListener('touchmove', onTouchMove, { passive: true });
  window.addEventListener('keydown', onKey);

  return () => {
    seal?.removeEventListener('click', open);
    window.removeEventListener('wheel', onWheel);
    window.removeEventListener('touchstart', onTouchStart);
    window.removeEventListener('touchmove', onTouchMove);
    window.removeEventListener('keydown', onKey);
  };
}

export function initIntro(): void {
  const overlay = document.querySelector<HTMLElement>('#intro');
  if (!overlay) return;

  lockScroll(true);
  const animated = !reduceMotion && getCore() !== null;
  if (animated) entrance(overlay);

  let opened = false;
  const open = (): void => {
    if (opened) return;
    opened = true;
    unbind();
    if (animated) openSequence(overlay, () => finish(overlay, false));
    else finish(overlay, true);
  };
  const unbind = bindOpeners(overlay, open);
}
