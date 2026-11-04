import { music } from '../data/wedding';
import { gsap } from './scroll';
import { asset } from './gallery';

const KEY = 'lanthanh:music';

let audio: HTMLAudioElement | null = null;
let button: HTMLButtonElement | null = null;

function setPressed(on: boolean): void {
  button?.setAttribute('aria-pressed', String(on));
  button?.setAttribute('aria-label', on ? 'Tắt nhạc nền' : 'Bật nhạc nền');
  try {
    sessionStorage.setItem(KEY, on ? 'on' : 'off');
  } catch {
    /* chế độ riêng tư: bỏ qua */
  }
}

function fadeTo(target: number, duration = 1.4): void {
  if (!audio) return;
  gsap.to(audio, { volume: target, duration, ease: 'sine.out' });
}

export async function startMusic(): Promise<void> {
  if (!audio) return;
  try {
    audio.volume = 0;
    await audio.play();
    fadeTo(music.volume, 2.2);
    setPressed(true);
  } catch {
    setPressed(false);
  }
}

function stopMusic(): void {
  if (!audio) return;
  fadeTo(0, 0.6);
  window.setTimeout(() => audio?.pause(), 650);
  setPressed(false);
}

/** Nhạc nền: Canon in D (public domain). Chỉ phát sau thao tác của khách. */
export function initMusic(): void {
  button = document.querySelector<HTMLButtonElement>('#music-toggle');
  audio = new Audio(asset(music.src));
  audio.loop = true;
  audio.preload = 'none';
  audio.volume = 0;
  audio.title = music.title;

  button?.addEventListener('click', () => {
    if (audio?.paused) void startMusic();
    else stopMusic();
  });

  document.addEventListener('visibilitychange', () => {
    if (!audio || audio.paused) return;
    if (document.hidden) fadeTo(0, 0.4);
    else fadeTo(music.volume, 1.2);
  });
}

export function musicWanted(): boolean {
  try {
    return sessionStorage.getItem(KEY) !== 'off';
  } catch {
    return true;
  }
}
