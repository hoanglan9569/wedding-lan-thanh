/**
 * Hiệu ứng xuất hiện khi trôi vào khung nhìn, và tách chữ cho tên cô dâu chú
 * rể. Mọi con số do lõi wasm tính; ở đây chỉ còn IntersectionObserver và DOM.
 */
import * as anim from '../vendor/motion-core/anim';
import { getCore } from '../vendor/motion-core/core';

type Kind = 'fade' | 'rise' | 'pop' | 'stagger' | 'mask' | 'card';

interface Recipe {
  from: anim.Props;
  duration: number;
  stagger?: number;
}

const NATURAL: anim.Props = { opacity: 1, y: 0, yPercent: 0, scale: 1, rotateX: 0, clip: 0 };

const RECIPES: Record<Kind, Recipe> = {
  fade: { from: { opacity: 0, y: 16 }, duration: 1.1 },
  rise: { from: { opacity: 0, y: 46 }, duration: 1.15 },
  pop: { from: { opacity: 0, scale: 0.72 }, duration: 1 },
  stagger: { from: { opacity: 0, y: 30 }, duration: 0.9, stagger: 0.09 },
  mask: { from: { opacity: 0, clip: 14, scale: 1.06 }, duration: 1.4 },
  card: { from: { opacity: 0, y: 70, rotateX: 11, perspective: 1400 }, duration: 1.3 },
};

function naturalOf(from: anim.Props): anim.Props {
  const to: anim.Props = {};
  for (const key of Object.keys(from) as (keyof anim.Props)[]) {
    if (key === 'perspective') to.perspective = from.perspective;
    else to[key] = NATURAL[key] ?? 0;
  }
  return to;
}

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

function targetsOf(el: HTMLElement, kind: Kind): HTMLElement[] {
  if (kind !== 'stagger') return [el];
  const kids = Array.from(el.children).filter((kid): kid is HTMLElement => kid instanceof HTMLElement);
  return kids.length ? kids : [el];
}

/** Ẩn ngay, trả về hàm bật hiệu ứng (gắn IntersectionObserver) để gọi sau. */
function setupReveal(el: HTMLElement): () => void {
  const kind = (el.dataset.reveal || 'fade') as Kind;
  const recipe = RECIPES[kind] ?? RECIPES.fade;
  const targets = targetsOf(el, kind);
  const to = naturalOf(recipe.from);
  for (const target of targets) anim.set(target, recipe.from);
  return () =>
    onFirstSight(el, () => {
      targets.forEach((target, i) => {
        anim.fromTo(target, recipe.from, to, {
          duration: recipe.duration,
          delay: (recipe.stagger ?? 0) * i,
          ease: 'out3',
        });
      });
    });
}

/** Tách từng chữ cái thành span, giữ nguyên khoảng trắng và dấu tiếng Việt. */
function splitChars(el: HTMLElement): HTMLElement[] {
  const text = el.textContent ?? '';
  const chars: HTMLElement[] = [];
  el.textContent = '';
  for (const ch of Array.from(text)) {
    const span = document.createElement('span');
    span.className = 'split-char';
    span.textContent = ch;
    el.appendChild(span);
    if (ch.trim()) chars.push(span);
  }
  return chars;
}

function setupSplit(el: HTMLElement): () => void {
  const chars = splitChars(el);
  const from: anim.Props = { yPercent: 118, opacity: 0 };
  const to: anim.Props = { yPercent: 0, opacity: 1 };
  for (const char of chars) anim.set(char, from);
  return () =>
    onFirstSight(el, () => {
      chars.forEach((char, i) => {
        anim.fromTo(char, from, to, { duration: 1.15, delay: 0.035 * i, ease: 'out4' });
      });
    });
}

const armers = { hero: [] as (() => void)[], rest: [] as (() => void)[] };

/**
 * Ẩn mọi phần tử có hiệu ứng ngay khi trang dựng, kể cả khi khách F5 giữa
 * trang: nếu đợi tới lúc mở thiệp mới ẩn thì trang hiện sẵn toàn bộ.
 * Trả về false khi không có lõi: lúc đó trang để nguyên, hiện đủ nội dung.
 */
export function prepareReveals(): boolean {
  if (!getCore()) {
    document.documentElement.classList.add('no-motion');
    return false;
  }
  const inHero = (el: HTMLElement): boolean => el.closest('.hero') !== null;
  const add = (el: HTMLElement, arm: () => void): void => {
    armers[inHero(el) ? 'hero' : 'rest'].push(arm);
  };
  document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => add(el, setupReveal(el)));
  document.querySelectorAll<HTMLElement>('[data-split]').forEach((el) => add(el, setupSplit(el)));
  return true;
}

/**
 * Bật hiệu ứng: `hero` ngay từ đầu, `rest` chỉ sau khi thiệp mở, nếu không
 * chúng chạy hết sau lớp phủ và khách cuộn xuống thấy trang đứng im.
 */
export function armReveals(scope: 'hero' | 'rest'): void {
  for (const arm of armers[scope]) arm();
  armers[scope] = [];
}
