import { music } from '../data/wedding';
import * as anim from '../vendor/motion-core/anim';
import { asset } from './gallery';

const KEY = 'lanthanh:music';
const UNLOCK_EVENTS = ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown'] as const;

let audio: HTMLAudioElement | null = null;
let button: HTMLButtonElement | null = null;
let stopTimer = 0;
let unlockArmed = false;

function setPressed(on: boolean): void {
  button?.setAttribute('aria-pressed', String(on));
  button?.setAttribute('aria-label', on ? 'Tắt nhạc nền' : 'Bật nhạc nền');
}

function saveMuted(muted: boolean): void {
  try {
    if (muted) {
      localStorage.setItem(KEY, 'off');
      sessionStorage.setItem(KEY, 'off');
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
  anim.kill(audio);
  anim.to(audio, { volume: target }, { duration, ease: 'outSine' });
}

export async function startMusic(): Promise<void> {
  if (!audio) return;
  if (stopTimer) {
    window.clearTimeout(stopTimer);
    stopTimer = 0;
  } else if (!audio.paused) {
    setPressed(true);
    disarmUnlock();
    return;
  }
  try {
    anim.set(audio, { volume: 0 });
    await audio.play();
    disarmUnlock();
    fadeTo(music.volume, 2.2);
    setPressed(true);
  } catch {
    setPressed(false);
    if (musicWanted()) armUnlock();
  }
}

function stopMusic(): void {
  if (!audio) return;
  disarmUnlock();
  saveMuted(true);
  fadeTo(0, 0.6);
  if (stopTimer) window.clearTimeout(stopTimer);
  stopTimer = window.setTimeout(() => {
    stopTimer = 0;
    audio?.pause();
  }, 650);
  setPressed(false);
}

/** Nhạc nền: Canon in D (public domain). Chỉ phát sau thao tác của khách. */
export function initMusic(): void {
  button = document.querySelector<HTMLButtonElement>('#music-toggle');
  audio = new Audio(asset(music.src));
  audio.loop = true;
  audio.preload = 'none';
  anim.set(audio, { volume: 0 });
  audio.title = music.title;

  try {
    if (localStorage.getItem(KEY) !== 'off') sessionStorage.removeItem(KEY);
  } catch {
    /* chế độ riêng tư: bỏ qua */
  }

  button?.addEventListener('click', () => {
    if (audio?.paused || stopTimer) {
      saveMuted(false);
      void startMusic();
    } else {
      stopMusic();
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (!audio || audio.paused) return;
    if (document.hidden) fadeTo(0, 0.4);
    else fadeTo(music.volume, 1.2);
  });
}

export function musicWanted(): boolean {
  try {
    return localStorage.getItem(KEY) !== 'off' && sessionStorage.getItem(KEY) !== 'off';
  } catch {
    return true;
  }
}
