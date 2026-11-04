import './styles/base.css';
import './styles/components.css';
import './styles/sections.css';

import { initSmoothScroll, initReveals, initAnchors, lockScroll, refreshScroll } from './modules/scroll';
import { initHero, initTopbar, initCardTilt } from './modules/hero';
import { initPetals } from './modules/petals';
import { initCountdown } from './modules/countdown';
import { initCalendar } from './modules/calendar';
import { initGallery } from './modules/gallery';
import { initRsvp } from './modules/rsvp';
import { initMusic } from './modules/music';
import { applyGuestName } from './modules/guest';
import { initTimelineLine, initOrnaments } from './modules/decor';
import { initIntro } from './modules/intro';

function boot(): void {
  initSmoothScroll();
  applyGuestName();
  initGallery((open) => lockScroll(open));
  initCalendar();
  initCountdown();
  initRsvp();
  initMusic();
  initHero();
  initTopbar();
  initCardTilt();
  initTimelineLine();
  initOrnaments();
  initReveals();
  initAnchors();

  const canvas = document.querySelector<HTMLCanvasElement>('#petals');
  if (canvas) initPetals(canvas);

  initIntro();

  window.addEventListener('load', () => refreshScroll(), { once: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
