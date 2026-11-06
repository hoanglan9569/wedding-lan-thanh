import { cleanGuestName } from './guest-name';

export { cleanGuestName };

const KEYS = ['to', 'guest', 'khach', 'name'];

/** Tên khách lấy từ đường dẫn: ...?to=Anh%20Nam -> "Anh Nam". */
export function guestName(): string | null {
  const params = new URLSearchParams(window.location.search);
  for (const key of KEYS) {
    const raw = params.get(key);
    if (raw && cleanGuestName(raw)) return cleanGuestName(raw);
  }
  return null;
}

const MIN_PX = 13;

/** Shrink the envelope name until it fits its box below the seal (CSS sets the starting size). */
function fitIntroGuest(): void {
  const box = document.querySelector<HTMLElement>('.env__front');
  const guest = document.querySelector<HTMLElement>('#intro-guest');
  if (!box || !guest) return;
  guest.style.fontSize = '';
  let size = parseFloat(getComputedStyle(guest).fontSize);
  while (size > MIN_PX && (box.scrollHeight > box.clientHeight + 1 || guest.scrollWidth > guest.clientWidth + 1)) {
    size -= 1;
    guest.style.fontSize = `${size}px`;
  }
}

function watchIntroFit(): void {
  fitIntroGuest();
  void document.fonts?.ready.then(fitIntroGuest);
  let frame = 0;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(fitIntroGuest);
  });
}

export function applyGuestName(): void {
  const name = guestName();
  if (name) {
    document.querySelectorAll<HTMLElement>('#intro-guest, #card-guest').forEach((el) => {
      el.textContent = name;
    });
    const form = document.querySelector<HTMLInputElement>('#f-name');
    if (form && !form.value) form.value = name;
  }
  watchIntroFit();
}
