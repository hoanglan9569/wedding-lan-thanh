import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger, SplitText);

export const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const isCoarse = window.matchMedia('(pointer: coarse)').matches;

let lenis: Lenis | null = null;

/**
 * Cuộn mượt chỉ bật cho chuột. Trên điện thoại dùng cuộn gốc của hệ điều hành:
 * nhẹ máy hơn và không có thư viện nào chen vào giữa thao tác vuốt.
 */
export function initSmoothScroll(): void {
  if (reduceMotion || isCoarse) return;
  lenis = new Lenis({
    duration: 1.1,
    lerp: 0.11,
    smoothWheel: true,
    syncTouch: false,
    touchMultiplier: 1.6,
    autoRaf: false,
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis?.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  document.documentElement.style.scrollBehavior = 'auto';
}

export function lockScroll(locked: boolean): void {
  document.body.classList.toggle('is-locked', locked);
  if (!lenis) return;
  if (locked) lenis.stop();
  else lenis.start();
}

export function scrollToSection(hash: string): void {
  const target = document.querySelector<HTMLElement>(hash);
  if (!target) return;
  const offset = target.id === 'hero' ? 0 : -74;
  if (lenis) lenis.scrollTo(target, { offset, duration: 1.2 });
  else target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
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

type RevealKind = 'fade' | 'rise' | 'pop' | 'stagger' | 'mask' | 'card';

const FROM: Record<RevealKind, gsap.TweenVars> = {
  fade: { opacity: 0, y: 16, duration: 1.1 },
  rise: { opacity: 0, y: 46, duration: 1.15 },
  pop: { opacity: 0, scale: 0.72, duration: 1 },
  stagger: { opacity: 0, y: 30, duration: 0.9, stagger: 0.09 },
  mask: { opacity: 0, clipPath: 'inset(14% 14% 14% 14% round 2px)', scale: 1.06, duration: 1.4 },
  card: { opacity: 0, y: 70, rotateX: 11, transformPerspective: 1400, duration: 1.3 },
};

function revealTargets(el: HTMLElement, kind: RevealKind): Element[] | HTMLElement {
  if (kind !== 'stagger') return el;
  const kids = Array.from(el.children);
  return kids.length ? kids : el;
}

/**
 * Hiệu ứng xuất hiện chạy bằng IntersectionObserver chứ không bám ScrollTrigger:
 * cuộn kiểu gì (chuột, chạm, phím, nhảy tới mục) chữ cũng luôn hiện ra.
 */
function onFirstSight(el: HTMLElement, run: () => void): void {
  const io = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      io.disconnect();
      run();
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0 },
  );
  io.observe(el);
}

function setupReveal(el: HTMLElement): void {
  const kind = (el.dataset.reveal || 'fade') as RevealKind;
  const vars = FROM[kind] ?? FROM.fade;
  const targets = revealTargets(el, kind);
  gsap.set(targets, { ...vars, duration: 0 });
  onFirstSight(el, () => {
    gsap.to(targets, {
      opacity: 1,
      y: 0,
      scale: 1,
      rotateX: 0,
      clipPath: 'inset(0% 0% 0% 0% round 2px)',
      duration: (vars.duration as number) ?? 1,
      ease: 'power3.out',
      stagger: (vars.stagger as number) ?? 0,
      clearProps: 'clipPath,transformPerspective',
    });
  });
}

function setupSplit(el: HTMLElement): void {
  const split = new SplitText(el, { type: 'chars' });
  gsap.set(split.chars, { yPercent: 118, opacity: 0 });
  onFirstSight(el, () =>
    gsap.to(split.chars, {
      yPercent: 0,
      opacity: 1,
      duration: 1.15,
      ease: 'power4.out',
      stagger: 0.035,
    }),
  );
}

export function initReveals(): void {
  if (reduceMotion) {
    document.documentElement.classList.add('no-motion');
    return;
  }
  document.querySelectorAll<HTMLElement>('[data-reveal]').forEach(setupReveal);
  document.querySelectorAll<HTMLElement>('[data-split]').forEach(setupSplit);
  ScrollTrigger.refresh();
}

export function refreshScroll(): void {
  ScrollTrigger.refresh();
}

export { gsap, ScrollTrigger };
