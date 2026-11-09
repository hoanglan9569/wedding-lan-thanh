import { music } from '../data/wedding';
import * as anim from '../vendor/motion-core/anim';
import { asset } from './gallery';

const KEY = 'lanthanh:music:muted';
const LEGACY_KEY = 'lanthanh:music';
const GESTURE_EVENTS = ['touchend', 'pointerup', 'click', 'keydown'] as const;

let audio: HTMLAudioElement | null = null;
let button: HTMLButtonElement | null = null;
let stopTimer = 0;
let primed = false;
let started = false;
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

function onGesture(event: Event): void {
  if (button && event.target instanceof Node && button.contains(event.target)) return;
  if (!musicWanted()) return;
  if (started) {
    if (!playing || audio?.paused) void startMusic();
    return;
  }
  if (!audio || primed) return;
  primed = true;
  audio.muted = true;
  const p = audio.play();
  if (p) {
    p.then(() => {
      if (!started && audio) {
        audio.pause();
        audio.currentTime = 0;
        audio.muted = false;
      }
    }).catch(() => {
      primed = false;
      if (audio) audio.muted = false;
    });
  }
}

function fadeTo(target: number, duration = 1.4): void {
  if (!audio) return;
  anim.kill(audio);
  anim.to(audio, { volume: target }, { duration, ease: 'outSine' });
}

export async function startMusic(): Promise<void> {
  if (!audio) return;
  started = true;
  if (stopTimer) {
    window.clearTimeout(stopTimer);
    stopTimer = 0;
  }
  if (playing && !audio.paused && !audio.muted) {
    setPressed(true);
    return;
  }
  try {
    audio.muted = false;
    anim.set(audio, { volume: 0 });
    await audio.play();
    playing = true;
    fadeTo(music.volume, 2.2);
    setPressed(true);
  } catch {
    try {
      audio.muted = true;
      anim.set(audio, { volume: 0 });
      await audio.play();
      audio.muted = false;
      if (!audio.paused) {
        playing = true;
        fadeTo(music.volume, 2.2);
        setPressed(true);
        return;
      }
    } catch {
      if (audio) audio.muted = false;
    }
    playing = false;
    setPressed(false);
  }
}

function stopMusic(): void {
  if (!audio) return;
  playing = false;
  saveMuted(true);
  fadeTo(0, 0.6);
  if (stopTimer) window.clearTimeout(stopTimer);
  stopTimer = window.setTimeout(() => {
    stopTimer = 0;
    audio?.pause();
  }, 650);
  setPressed(false);
}

/** Nhạc nền: Canon in D (public domain). Chỉ phát sau khi mở thiệp xong. */
export function initMusic(): void {
  button = document.querySelector<HTMLButtonElement>('#music-toggle');
  audio = new Audio(asset(music.src));
  audio.loop = true;
  audio.preload = 'auto';
  anim.set(audio, { volume: 0 });
  audio.title = music.title;

  try {
    localStorage.removeItem(LEGACY_KEY);
    sessionStorage.removeItem(LEGACY_KEY);
  } catch {
    /* chế độ riêng tư: bỏ qua */
  }

  audio.addEventListener('pause', () => {
    if (musicWanted()) playing = false;
  });

  for (const type of GESTURE_EVENTS) {
    window.addEventListener(type, onGesture, { capture: true, passive: true });
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
    if (!audio) return;
    if (document.hidden) {
      if (!audio.paused) fadeTo(0, 0.4);
    } else if (started && musicWanted()) {
      if (audio.paused) {
        playing = false;
        void startMusic();
      } else {
        fadeTo(music.volume, 1.2);
      }
    }
  });

  window.addEventListener('pageshow', (event) => {
    if (event.persisted && started && musicWanted() && audio?.paused) {
      playing = false;
      void startMusic();
    }
  });
}

export function musicWanted(): boolean {
  try {
    return localStorage.getItem(KEY) !== '1' && sessionStorage.getItem(KEY) !== '1';
  } catch {
    return true;
  }
}
