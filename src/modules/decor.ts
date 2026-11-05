/** Đường kẻ chương trình vẽ dần theo cuộn, và các nét hoa sen bung ra. */
import * as anim from '../vendor/motion-core/anim';
import { reduceMotion } from './scroll';
import { addTrack } from './tracks';

export function initTimelineLine(): void {
  const list = document.querySelector<HTMLElement>('#timeline');
  if (!list) return;
  if (reduceMotion) {
    list.style.setProperty('--tl-progress', '1');
    return;
  }
  list.style.setProperty('--tl-progress', '0');
  let last = '0';
  addTrack({
    el: list,
    start: (top, _height, vh) => top - vh * 0.8,
    end: (top, height, vh) => top + height - vh * 0.72,
    from: 0,
    to: 1,
    scrub: 0.5,
    apply: (v) => {
      const next = v.toFixed(3);
      if (next === last) return;
      last = next;
      list.style.setProperty('--tl-progress', next);
    },
  });
}

/** Các nét hoa sen bung ra khi trôi vào khung nhìn. */
export function initOrnaments(): void {
  if (reduceMotion) return;
  const marks = document.querySelectorAll<HTMLElement>('.card__divider, .pair__amp, .footer__mark');
  marks.forEach((el) => {
    anim.set(el, { opacity: 0, scale: 0.55 });
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        io.disconnect();
        anim.fromTo(el, { opacity: 0, scale: 0.55 }, { opacity: 1, scale: 1 }, { duration: 1.2, ease: 'back' });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0 },
    );
    io.observe(el);
  });
}
