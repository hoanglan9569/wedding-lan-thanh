import { gsap, ScrollTrigger, reduceMotion } from './scroll';

/** Đường kẻ dọc của phần chương trình được vẽ dần theo thao tác cuộn. */
export function initTimelineLine(): void {
  const list = document.querySelector<HTMLElement>('#timeline');
  if (!list) return;
  if (reduceMotion) {
    list.style.setProperty('--tl-progress', '1');
    return;
  }
  list.style.setProperty('--tl-progress', '0');
  ScrollTrigger.create({
    trigger: list,
    start: 'top 80%',
    end: 'bottom 72%',
    scrub: 0.5,
    onUpdate: (self) => list.style.setProperty('--tl-progress', self.progress.toFixed(3)),
  });
}

/** Các nét hoa sen bung ra khi trôi vào khung nhìn. */
export function initOrnaments(): void {
  if (reduceMotion) return;
  const marks = document.querySelectorAll<HTMLElement>('.card__divider, .pair__amp, .footer__mark');
  marks.forEach((el) => {
    gsap.from(el, {
      opacity: 0,
      scale: 0.55,
      duration: 1.2,
      ease: 'back.out(1.7)',
      scrollTrigger: { trigger: el, start: 'top 92%', once: true },
    });
  });
}
