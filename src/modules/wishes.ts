import { reduceMotion, refreshScroll } from './scroll';
import * as anim from '../vendor/motion-core/anim';

interface WishItem {
  id: string;
  name: string;
  side: string;
  wish: string;
  at: string;
}

const WISHES_ENDPOINT = 'https://lanthanh-rsvp.hoanglan9569.workers.dev/wishes';

function wishCard(item: WishItem): HTMLElement {
  const card = document.createElement('article');
  card.className = 'wish';
  const text = document.createElement('p');
  text.className = 'wish__text';
  text.textContent = `“${item.wish}”`;
  const who = document.createElement('p');
  who.className = 'wish__who';
  who.textContent = `${item.name} · ${item.side}`;
  card.append(text, who);
  return card;
}

export function initWishes(): void {
  const grid = document.querySelector<HTMLElement>('#wishes-grid');
  const empty = document.querySelector<HTMLElement>('#wishes-empty');
  if (!grid) return;

  fetch(WISHES_ENDPOINT)
    .then((res) => {
      if (!res.ok) throw new Error('Fetch failed');
      return res.json() as Promise<WishItem[]>;
    })
    .then((list) => {
      const withText = Array.isArray(list) ? list.filter((r) => r && r.wish && r.wish.trim().length > 0) : [];
      grid.replaceChildren(...withText.map(wishCard));
      if (empty) empty.hidden = withText.length > 0;
      if (!reduceMotion && withText.length > 0) {
        Array.from(grid.children).forEach((child, i) => {
          if (child instanceof HTMLElement) {
            anim.fromTo(child, { opacity: 0, y: 20 }, { opacity: 1, y: 0 }, { duration: 0.7, delay: i * 0.06 });
          }
        });
      }
      refreshScroll();
    })
    .catch(() => {
      grid.replaceChildren();
      if (empty) empty.hidden = false;
      refreshScroll();
    });
}
