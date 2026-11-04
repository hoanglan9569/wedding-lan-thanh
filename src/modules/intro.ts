import { gsap, reduceMotion, lockScroll, refreshScroll } from './scroll';
import { playHeroIntro } from './hero';
import { startMusic, musicWanted } from './music';

function finish(overlay: HTMLElement): void {
  overlay.classList.add('intro--gone');
  overlay.setAttribute('aria-hidden', 'true');
  overlay.remove();
  lockScroll(false);
  window.scrollTo(0, 0);
  refreshScroll();
  playHeroIntro();
  if (musicWanted()) void startMusic();
}

/** Màn "Mở thiệp": mở ra như tách hai cánh giấy rồi hiện hero. */
export function initIntro(): void {
  const overlay = document.querySelector<HTMLElement>('#intro');
  const button = document.querySelector<HTMLButtonElement>('#intro-open');
  if (!overlay || !button) return;

  lockScroll(true);

  if (reduceMotion) {
    button.addEventListener('click', () => finish(overlay));
    return;
  }

  const paper = overlay.querySelector<HTMLElement>('.intro__paper');
  gsap.from(paper, { opacity: 0, y: 34, scale: 0.97, duration: 1.1, ease: 'power3.out', delay: 0.15 });
  gsap.from(overlay.querySelectorAll('.intro__paper > *'), {
    opacity: 0,
    y: 18,
    duration: 0.9,
    stagger: 0.09,
    ease: 'power3.out',
    delay: 0.35,
  });

  button.addEventListener(
    'click',
    () => {
      const tl = gsap.timeline({ onComplete: () => finish(overlay) });
      tl.to(paper, { y: -26, scale: 1.03, duration: 0.5, ease: 'power2.out' })
        .to(paper, { opacity: 0, y: -60, duration: 0.6, ease: 'power2.in' }, '>-0.1')
        .to(overlay, { opacity: 0, duration: 0.7, ease: 'power2.inOut' }, '<0.1');
    },
    { once: true },
  );
}
