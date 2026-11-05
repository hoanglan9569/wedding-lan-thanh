import './styles/base.css';
import './styles/components.css';
import './styles/intro.css';
import './styles/lightbox.css';
import './styles/sections.css';
import './styles/sections-couple.css';
import './styles/sections-info.css';
import './styles/ornaments.css';

import { loadCore } from './vendor/motion-core/core';
import { initSmoothScroll, initAnchors, lockScroll, refreshScroll } from './modules/scroll';
import { prepareReveals, armReveals } from './modules/reveal';
import { initHero, initTopbar, initCardTilt } from './modules/hero';
import { initPetals } from './modules/petals';
import { initCountdown } from './modules/countdown';
import { initCalendar } from './modules/calendar';
import { initGallery } from './modules/gallery';
import { initRsvp } from './modules/rsvp';
import { initWishes } from './modules/wishes';
import { initMusic } from './modules/music';
import { applyGuestName } from './modules/guest';
import { pruneMissingArt } from './modules/art';
import { initTimelineLine, initOrnaments } from './modules/decor';
import { initIntro } from './modules/intro';

// F5 giữa trang: trình duyệt khôi phục chỗ cuộn cũ, khách quay lại thấy trang
// nằm giữa chừng sau lớp phủ. Thiệp luôn mở lại từ đầu trang.
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

function boot(): void {
  if (document.querySelector('#intro')) window.scrollTo(0, 0);
  pruneMissingArt();
  initSmoothScroll();
  applyGuestName();
  initGallery((open) => lockScroll(open));
  initCalendar();
  initCountdown();
  initRsvp();
  initWishes();
  initMusic();
  initHero();
  initTopbar();
  initCardTilt();
  initTimelineLine();
  initAnchors();

  const overlay = document.querySelector('#intro');
  const animated = prepareReveals();
  armReveals('hero');
  if (!animated || !overlay) {
    armReveals('rest');
    initOrnaments();
  } else {
    document.addEventListener(
      'intro:done',
      () => {
        armReveals('rest');
        initOrnaments();
      },
      { once: true },
    );
  }

  const canvas = document.querySelector<HTMLCanvasElement>('#petals');
  if (canvas) initPetals(canvas);

  initIntro();

  window.addEventListener('load', () => refreshScroll(), { once: true });
}

/** Lõi wasm nạp trước mọi thứ: hoạt hình chỉ bật khi chắc chắn có lõi. */
async function start(): Promise<void> {
  const disabled = new URLSearchParams(location.search).get('engine') === 'js';
  const core = await loadCore({ disabled });
  document.documentElement.dataset.engine = core ? 'wasm' : 'none';
  boot();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => void start(), { once: true });
} else {
  void start();
}
