import { rsvp as rsvpConfig } from '../data/wedding';
import { refreshScroll } from './scroll';
import * as anim from '../vendor/motion-core/anim';

const KEY = 'lanthanh:wishes';

export interface Reply {
  name: string;
  side: string;
  attend: string;
  guests: number;
  wish: string;
  at: string;
}

function readLocal(): Reply[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as Reply[]) : [];
  } catch {
    return [];
  }
}

function writeLocal(list: Reply[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(-60)));
  } catch {
    /* hết chỗ lưu: bỏ qua */
  }
}

function wishCard(reply: Reply): HTMLElement {
  const card = document.createElement('article');
  card.className = 'wish';
  const text = document.createElement('p');
  text.className = 'wish__text';
  text.textContent = `“${reply.wish}”`;
  const who = document.createElement('p');
  who.className = 'wish__who';
  who.textContent = `${reply.name} · ${reply.side}`;
  card.append(text, who);
  return card;
}

export function renderWishes(list: Reply[]): void {
  const grid = document.querySelector<HTMLElement>('#wishes-grid');
  const empty = document.querySelector<HTMLElement>('#wishes-empty');
  if (!grid) return;
  const withText = list.filter((reply) => reply.wish.trim().length > 0);
  grid.replaceChildren(...withText.slice().reverse().map(wishCard));
  if (empty) empty.hidden = withText.length > 0;
  if (withText.length) {
    Array.from(grid.children).forEach((child, i) => {
      if (child instanceof HTMLElement) {
        anim.fromTo(child, { opacity: 0, y: 20 }, { opacity: 1, y: 0 }, { duration: 0.7, delay: i * 0.06 });
      }
    });
  }
  refreshScroll();
}

async function send(reply: Reply): Promise<boolean> {
  if (!rsvpConfig.endpoint) return false;
  try {
    const res = await fetch(rsvpConfig.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reply),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function burst(origin: HTMLElement): void {
  const rect = origin.getBoundingClientRect();
  for (let i = 0; i < 14; i += 1) {
    const dot = document.createElement('span');
    dot.style.cssText =
      'position:fixed;z-index:140;width:9px;height:13px;border-radius:50%;pointer-events:none;' +
      `background:${i % 2 ? '#e3a9b2' : '#f7e4e6'};left:${rect.left + rect.width / 2}px;top:${rect.top}px;`;
    document.body.appendChild(dot);
    anim.fromTo(
      dot,
      { x: 0, y: 0, rotate: 0, opacity: 1 },
      {
        x: (Math.random() - 0.5) * 320,
        y: -120 - Math.random() * 220,
        rotate: Math.random() * 320,
        opacity: 0,
      },
      { duration: 1.3 + Math.random(), ease: 'out2', onComplete: () => dot.remove() },
    );
  }
}

function readForm(form: HTMLFormElement): Reply {
  const data = new FormData(form);
  return {
    name: String(data.get('name') ?? '').trim(),
    side: String(data.get('side') ?? 'Nhà trai'),
    attend: String(data.get('attend') ?? 'Có'),
    guests: Number(data.get('guests') ?? 1) || 1,
    wish: String(data.get('wish') ?? '').trim(),
    at: new Date().toISOString(),
  };
}

function toggleGuests(form: HTMLFormElement): void {
  const field = form.querySelector<HTMLElement>('#guests-field');
  const attending = form.querySelector<HTMLInputElement>('input[name="attend"]:checked')?.value;
  field?.classList.toggle('field--hidden', attending === 'Không');
}

/** Form xác nhận tham dự + sổ lưu bút. */
export function initRsvp(): void {
  const form = document.querySelector<HTMLFormElement>('#rsvp-form');
  const status = document.querySelector<HTMLElement>('#rsvp-status');
  if (!form) return;

  toggleGuests(form);
  form.querySelectorAll('input[name="attend"]').forEach((input) => {
    input.addEventListener('change', () => toggleGuests(form));
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const reply = readForm(form);
    if (!reply.name) {
      if (status) {
        status.textContent = 'Bạn cho tụi mình xin tên với nhé.';
        status.className = 'form__status form__status--err';
      }
      form.querySelector<HTMLInputElement>('#f-name')?.focus();
      return;
    }

    const list = [...readLocal(), reply];
    writeLocal(list);

    const button = form.querySelector<HTMLButtonElement>('#rsvp-submit');
    if (button) {
      button.disabled = true;
      burst(button);
    }
    if (status) {
      status.className = 'form__status';
      const defaultText =
        reply.attend === 'Có'
          ? `Cảm ơn ${reply.name}! Hẹn gặp bạn ngày 29.11.2026 nhé.`
          : `Cảm ơn ${reply.name} đã phản hồi, tụi mình sẽ nhớ bạn trong ngày vui.`;
      status.textContent = reply.wish.trim()
        ? `Cảm ơn ${reply.name}! Lời chúc của bạn sẽ hiện ra sau khi gia đình duyệt.`
        : defaultText;
    }

    void send(reply).then((ok) => {
      if (ok || !status) return;
      status.textContent += ' (Phản hồi đã lưu trên máy bạn.)';
    });

    window.setTimeout(() => {
      if (button) button.disabled = false;
      form.reset();
      toggleGuests(form);
    }, 2600);
  });
}
