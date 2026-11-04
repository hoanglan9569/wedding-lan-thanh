import { gsap, reduceMotion, lockScroll, refreshScroll } from './scroll';
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

/** Bẻ dấu niêm phong, mở nắp, rút tấm thiệp lên rồi tan vào ảnh cưới. */
function openSequence(overlay: HTMLElement, done: () => void): void {
  const flap = overlay.querySelector<HTMLElement>('#env-flap');
  const card = overlay.querySelector<HTMLElement>('#env-card');
  const seal = overlay.querySelector<HTMLElement>('#intro-open');
  const hint = overlay.querySelector<HTMLElement>('#intro-hint');
  const front = overlay.querySelector<HTMLElement>('.env__front');

  const tl = gsap.timeline({ onComplete: done, defaults: { overwrite: 'auto' } });
  tl.to(hint, { opacity: 0, duration: 0.3, ease: 'power1.out' }, 0)
    // dấu sáp bị bẻ: nảy lên rồi vỡ ra tại chỗ, không trượt xuống đè chữ
    .to(seal, { scale: 1.18, rotate: -10, duration: 0.2, ease: 'power2.out' }, 0)
    .to(seal, { scale: 0.52, rotate: 16, opacity: 0, duration: 0.32, ease: 'power2.in' }, 0.2)
    .to(flap, { rotateX: -168, duration: 1.05, ease: 'power2.inOut' }, 0.3)
    .set(flap, { zIndex: -2 }, 0.82)
    .to(front, { opacity: 0, duration: 0.45, ease: 'power1.out' }, 0.5)
    // thiệp rút lên: đổi lớp đúng lúc còn nằm trong phong bì nên không thấy nhảy lớp
    .set(card, { zIndex: 6 }, 0.95)
    .to(card, { yPercent: -62, scale: 1.03, duration: 1.1, ease: 'power3.out' }, 0.98)
    .to(card, { scale: 1.34, duration: 0.9, ease: 'power2.in' }, '+=0.3')
    .add(() => playHeroIntro(), '<0.1')
    .to(overlay, { opacity: 0, duration: 0.62, ease: 'power2.inOut' }, '<0.12');
}

function entrance(overlay: HTMLElement): void {
  const env = overlay.querySelector<HTMLElement>('#env');
  const hint = overlay.querySelector<HTMLElement>('#intro-hint');
  gsap.from(env, { opacity: 0, y: 40, scale: 0.94, duration: 1.2, ease: 'power3.out', delay: 0.12 });
  gsap.from(hint, { opacity: 0, y: 12, duration: 0.9, ease: 'power2.out', delay: 0.8 });
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
  if (!reduceMotion) entrance(overlay);

  let opened = false;
  const open = (): void => {
    if (opened) return;
    opened = true;
    unbind();
    if (reduceMotion) finish(overlay, true);
    else openSequence(overlay, () => finish(overlay, false));
  };
  const unbind = bindOpeners(overlay, open);
}
