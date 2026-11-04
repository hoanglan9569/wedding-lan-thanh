import { gsap, ScrollTrigger, reduceMotion } from './scroll';

/** Ken burns + parallax cho ảnh hero, chạy được cả trên điện thoại. */
export function initHero(): void {
  const media = document.querySelector<HTMLElement>('.hero__media');
  const image = media?.querySelector('img');
  const hero = document.querySelector<HTMLElement>('.hero');
  if (!media || !hero || reduceMotion) return;

  if (image) {
    gsap.to(image, {
      scale: 1.14,
      duration: 18,
      ease: 'none',
      repeat: -1,
      yoyo: true,
    });
  }

  gsap.to(media, {
    yPercent: 14,
    ease: 'none',
    scrollTrigger: {
      trigger: hero,
      start: 'top top',
      end: 'bottom top',
      scrub: 0.6,
      invalidateOnRefresh: true,
    },
  });

  const inner = hero.querySelector<HTMLElement>('.hero__inner');
  if (inner) {
    gsap.to(inner, {
      yPercent: -8,
      opacity: 0.1,
      ease: 'none',
      scrollTrigger: {
        trigger: hero,
        start: '40% top',
        end: 'bottom top',
        scrub: 0.4,
      },
    });
  }
}

/** Thanh điều hướng hiện ra sau khi rời hero. */
export function initTopbar(): void {
  const bar = document.querySelector<HTMLElement>('#topbar');
  const hero = document.querySelector<HTMLElement>('.hero');
  if (!bar || !hero) return;
  ScrollTrigger.create({
    trigger: hero,
    start: 'bottom 72%',
    onEnter: () => bar.classList.add('topbar--on'),
    onLeaveBack: () => bar.classList.remove('topbar--on'),
  });
}

/** Mở màn sau khi bấm "Mở thiệp": tên và ngày bay vào. */
export function playHeroIntro(): void {
  if (reduceMotion) return;
  const names = document.querySelectorAll<HTMLElement>('.hero__name, .hero__amp');
  const line = document.querySelector<HTMLElement>('.hero__dateline');
  const eyebrow = document.querySelector<HTMLElement>('.hero__eyebrow');
  const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
  if (eyebrow) tl.from(eyebrow, { opacity: 0, y: 18, duration: 0.9 }, 0);
  tl.from(names, { opacity: 0, y: 60, duration: 1.3, stagger: 0.12 }, 0.1);
  if (line) tl.from(line, { opacity: 0, y: 26, duration: 1 }, 0.55);
}

/** Hiệu ứng nghiêng nhẹ cho tấm thiệp khi rê chuột (bỏ qua trên cảm ứng). */
export function initCardTilt(): void {
  const card = document.querySelector<HTMLElement>('.card3d__inner');
  if (!card || reduceMotion || window.matchMedia('(pointer: coarse)').matches) return;
  const parent = card.parentElement;
  if (!parent) return;

  const move = (event: PointerEvent): void => {
    const rect = parent.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    gsap.to(card, {
      rotateY: px * 6,
      rotateX: -py * 5,
      transformPerspective: 1400,
      transformOrigin: 'center',
      duration: 0.7,
      ease: 'power2.out',
    });
  };

  const reset = (): void => {
    gsap.to(card, { rotateX: 0, rotateY: 0, duration: 1, ease: 'power3.out' });
  };

  parent.addEventListener('pointermove', move);
  parent.addEventListener('pointerleave', reset);
}
