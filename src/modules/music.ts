import { music } from '../data/wedding';
import { asset } from './gallery';

const KEY = 'lanthanh:music:muted';
const LEGACY_KEY = 'lanthanh:music';
const UNLOCK_EVENTS = ['touchend', 'click', 'keydown'] as const;

let audio: HTMLAudioElement | null = null;
let button: HTMLButtonElement | null = null;
let stopTimer = 0;
let fadeRaf = 0;
let unlockArmed = false;
let playing = false;

function setPressed(on: boolean): void {
  button?.setAttribute('aria-pressed', String(on));
  button?.setAttribute('aria-label', on ? 'Tắt nhạc nền' : 'Bật nhạc nền');
}

function saveMuted(muted: boolean): void {
  try {
    localStorage.removeItem(LEGACY_KEY);
    sessionStorage.removeItem(LEGACY_KEY);
    if (muted) {
      localStorage.setItem(KEY, '1');
      sessionStorage.setItem(KEY, '1');
    } else {
      localStorage.removeItem(KEY);
      sessionStorage.removeItem(KEY);
    }
  } catch {
    /* chế độ riêng tư: bỏ qua */
  }
}

function onUnlockGesture(event: Event): void {
  if (button && event.target instanceof Node && button.contains(event.target)) return;
  if (!musicWanted()) {
    disarmUnlock();
    return;
  }
  void startMusic();
}

function armUnlock(): void {
  if (unlockArmed) return;
  unlockArmed = true;
  for (const type of UNLOCK_EVENTS) {
    window.addEventListener(type, onUnlockGesture, { capture: true, passive: true });
  }
}

function disarmUnlock(): void {
  if (!unlockArmed) return;
  unlockArmed = false;
  for (const type of UNLOCK_EVENTS) {
    window.removeEventListener(type, onUnlockGesture, { capture: true });
  }
}

function fadeTo(target: number, duration = 1.4): void {
  if (!audio) return;
  if (fadeRaf) cancelAnimationFrame(fadeRaf);
  const start = audio.volume;
  const t0 = performance.now();
  const durMs = Math.max(1, duration * 1000);
  const step = (now: number): void => {
    if (!audio) return;
    const p = Math.min(1, (now - t0) / durMs);
    const eased = Math.sin((p * Math.PI) / 2);
    audio.volume = Math.min(1, Math.max(0, start + (target - start) * eased));
    if (p < 1) fadeRaf = requestAnimationFrame(step);
    else fadeRaf = 0;
  };
  fadeRaf = requestAnimationFrame(step);
}

export async function startMusic(): Promise<void> {
  if (!audio) return;
  if (stopTimer) {
    window.clearTimeout(stopTimer);
    stopTimer = 0;
  }
  if (playing && !audio.paused) {
    setPressed(true);
    disarmUnlock();
    return;
  }
  try {
    if (audio.volume < 0.08) audio.volume = 0.08;
    await audio.play();
    playing = true;
    disarmUnlock();
    fadeTo(music.volume, 1.8);
    setPressed(true);
  } catch {
    playing = false;
    setPressed(false);
    if (musicWanted()) armUnlock();
  }
}

function stopMusic(): void {
  if (!audio) return;
  playing = false;
  disarmUnlock();
  saveMuted(true);
  fadeTo(0, 0.5);
  if (stopTimer) window.clearTimeout(stopTimer);
  stopTimer = window.setTimeout(() => {
    stopTimer = 0;
    audio?.pause();
  }, 550);
  setPressed(false);
}

/** Nhạc nền: Canon in D (public domain). Chỉ phát sau thao tác của khách. */
export function initMusic(): void {
  button = document.querySelector<HTMLButtonElement>('#music-toggle');
  audio = new Audio(asset(music.src));
  audio.loop = true;
  audio.preload = 'auto';
  audio.volume = 0.08;
  audio.title = music.title;

  try {
    localStorage.removeItem(LEGACY_KEY);
    sessionStorage.removeItem(LEGACY_KEY);
  } catch {
    /* chế độ riêng tư: bỏ qua */
  }

  button?.addEventListener('click', () => {
    if (!playing || audio?.paused || stopTimer) {
      saveMuted(false);
      void startMusic();
    } else {
      stopMusic();
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (!audio || !playing || audio.paused) return;
    if (document.hidden) fadeTo(0, 0.4);
    else fadeTo(music.volume, 1.2);
  });
}

export function musicWanted(): boolean {
  try {
    return localStorage.getItem(KEY) !== '1' && sessionStorage.getItem(KEY) !== '1';
  } catch {
    return true;
  }
}
