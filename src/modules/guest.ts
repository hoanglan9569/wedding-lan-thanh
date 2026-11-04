const KEYS = ['to', 'guest', 'khach', 'name'];
const MAX = 64;

function clean(raw: string): string {
  return raw
    .replace(/[<>{}[\]\\|`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX);
}

/** Tên khách lấy từ đường dẫn: ...?to=Anh%20Nam -> "Anh Nam". */
export function guestName(): string | null {
  const params = new URLSearchParams(window.location.search);
  for (const key of KEYS) {
    const raw = params.get(key);
    if (raw && clean(raw)) return clean(raw);
  }
  return null;
}

export function applyGuestName(): void {
  const name = guestName();
  if (!name) return;
  document.querySelectorAll<HTMLElement>('#intro-guest, #card-guest').forEach((el) => {
    el.textContent = name;
  });
  const form = document.querySelector<HTMLInputElement>('#f-name');
  if (form && !form.value) form.value = name;
}
