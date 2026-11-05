import { album } from '../data/wedding';
import rawImages from '../data/images.json';
import * as anim from '../vendor/motion-core/anim';

interface ImageMeta {
  width: number;
  height: number;
  lqip: string;
}

interface LightboxItem {
  src: string;
  alt: string;
  caption: string;
}

const meta = rawImages as Record<string, ImageMeta>;

export function asset(path: string): string {
  const base = import.meta.env.BASE_URL || '/';
  return `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

function photoFigure(slug: string, alt: string, caption: string, index: number): HTMLElement {
  const fig = document.createElement('figure');
  fig.className = 'shot';
  fig.tabIndex = 0;
  fig.dataset.index = String(index);
  const info = meta[slug];
  if (info) {
    fig.style.backgroundImage = `url(${info.lqip})`;
    fig.style.backgroundSize = 'cover';
    fig.style.backgroundPosition = 'center';
  }
  fig.innerHTML = `
    <picture>
      <source type="image/webp" srcset="${asset(`photos/${slug}-640.webp`)} 640w, ${asset(
        `photos/${slug}-1080.webp`,
      )} 1080w, ${asset(`photos/${slug}-1600.webp`)} 1600w" sizes="(max-width: 860px) 48vw, 40vw" />
      <img src="${asset(`photos/${slug}-1280.jpg`)}" alt="${alt}" loading="lazy" decoding="async" />
    </picture>
    <figcaption>${caption}</figcaption>`;
  const img = fig.querySelector('img');
  img?.addEventListener('load', () => {
    fig.style.backgroundImage = 'none';
    anim.fromTo(img, { opacity: 0.2 }, { opacity: 1 }, { duration: 0.7 });
  });
  return fig;
}

function lightboxItems(): LightboxItem[] {
  return album.map((photo) => ({
    src: asset(`photos/${photo.slug}-1600.webp`),
    alt: photo.alt,
    caption: photo.caption,
  }));
}

class Lightbox {
  private items: LightboxItem[] = [];
  private index = 0;
  private readonly root = document.querySelector<HTMLElement>('#lightbox');
  private readonly img = document.querySelector<HTMLImageElement>('#lb-img');
  private readonly cap = document.querySelector<HTMLElement>('#lb-cap');

  constructor(private readonly onToggle: (open: boolean) => void) {
    document.querySelector('#lb-close')?.addEventListener('click', () => this.close());
    document.querySelector('#lb-prev')?.addEventListener('click', () => this.step(-1));
    document.querySelector('#lb-next')?.addEventListener('click', () => this.step(1));
    this.root?.addEventListener('click', (event) => {
      if (event.target === this.root) this.close();
    });
    document.addEventListener('keydown', (event) => {
      if (!this.root?.classList.contains('lightbox--on')) return;
      if (event.key === 'Escape') this.close();
      if (event.key === 'ArrowLeft') this.step(-1);
      if (event.key === 'ArrowRight') this.step(1);
    });
    this.bindSwipe();
  }

  private bindSwipe(): void {
    const stage = document.querySelector<HTMLElement>('.lightbox__stage');
    let startX = 0;
    stage?.addEventListener(
      'touchstart',
      (event) => {
        startX = event.changedTouches[0]?.clientX ?? 0;
      },
      { passive: true },
    );
    stage?.addEventListener(
      'touchend',
      (event) => {
        const dx = (event.changedTouches[0]?.clientX ?? 0) - startX;
        if (Math.abs(dx) > 46) this.step(dx < 0 ? 1 : -1);
      },
      { passive: true },
    );
  }

  open(items: LightboxItem[], index = 0): void {
    if (!this.root || !items.length) return;
    this.items = items;
    this.index = index;
    this.render(0);
    this.root.classList.add('lightbox--on');
    this.root.setAttribute('aria-hidden', 'false');
    this.onToggle(true);
  }

  close(): void {
    if (!this.root) return;
    this.root.classList.remove('lightbox--on');
    this.root.setAttribute('aria-hidden', 'true');
    this.onToggle(false);
  }

  private step(delta: number): void {
    if (this.items.length < 2) return;
    this.index = (this.index + delta + this.items.length) % this.items.length;
    this.render(delta);
  }

  private render(delta: number): void {
    const item = this.items[this.index];
    if (!item || !this.img) return;
    this.img.src = item.src;
    this.img.alt = item.alt;
    if (this.cap) this.cap.textContent = item.caption;
    anim.kill(this.img);
    anim.fromTo(
      this.img,
      { opacity: 0, x: delta * 28, scale: 0.985 },
      { opacity: 1, x: 0, scale: 1 },
      { duration: 0.5, ease: 'out3' },
    );
  }
}

/** Album + khung xem ảnh lớn (bàn phím, vuốt, bản đồ, thiệp giấy). */
export function initGallery(onToggle: (open: boolean) => void): void {
  const grid = document.querySelector<HTMLElement>('#album-grid');
  const box = new Lightbox(onToggle);

  album.forEach((photo, index) => {
    const fig = photoFigure(photo.slug, photo.alt, photo.caption, index);
    const open = (): void => box.open(lightboxItems(), index);
    fig.addEventListener('click', open);
    fig.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        open();
      }
    });
    grid?.appendChild(fig);
  });

  document.querySelector('#venue-map')?.addEventListener('click', () => {
    box.open([
      {
        src: asset('map/map-kim-center-1874.webp'),
        alt: 'Bản đồ đường đến Kim Center',
        caption: 'Đường đến Kim Center',
      },
    ]);
  });
}
