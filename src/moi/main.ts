/** Trang tạo link mời (moi.html): danh sách khách -> link riêng + lời nhắn, lưu trên máy người dùng. */
import './moi.css';
import { DEFAULT_MESSAGE, linkFor, messageFor, parseNames } from './links';

const STORE = { names: 'lanthanh:moi:names', message: 'lanthanh:moi:message' };

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const names = $<HTMLTextAreaElement>('names');
const message = $<HTMLTextAreaElement>('message');
const out = $<HTMLOListElement>('out');
const hint = $<HTMLParagraphElement>('hint');
const toast = $<HTMLDivElement>('toast');
let toastTimer = 0;

function load(key: string, fallback: string): string {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* chế độ riêng tư: không lưu được thì thôi */
  }
}

function say(text: string): void {
  toast.textContent = text;
  toast.classList.add('is-on');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('is-on'), 1600);
}

async function copy(text: string, done: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    document.body.append(area);
    area.select();
    document.execCommand('copy');
    area.remove();
  }
  say(done);
}

function button(label: string, onClick: () => void, cls = 'ghost small'): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = cls;
  btn.textContent = label;
  btn.addEventListener('click', onClick);
  return btn;
}

function shareButton(name: string, text: string): HTMLButtonElement | null {
  if (typeof navigator.share !== 'function') return null;
  return button(
    'Gửi',
    () => {
      navigator.share({ title: `Thiệp mời ${name}`, text }).catch(() => undefined);
    },
    'small',
  );
}

function row(name: string): HTMLLIElement {
  const link = linkFor(name);
  const text = messageFor(message.value, name, link);
  const item = document.createElement('li');
  item.className = 'item';
  const who = document.createElement('b');
  who.textContent = name;
  const a = document.createElement('a');
  a.href = link;
  a.target = '_blank';
  a.rel = 'noopener';
  a.textContent = link.replace(/^https?:\/\//, '');
  const tools = document.createElement('div');
  tools.className = 'tools';
  const share = shareButton(name, text);
  if (share) tools.append(share);
  tools.append(
    button('Chép lời mời', () => void copy(text, `Đã chép lời mời cho ${name}`), share ? 'ghost small' : 'small'),
    button('Chép link', () => void copy(link, `Đã chép link của ${name}`)),
  );
  item.append(who, a, tools);
  return item;
}

function render(): void {
  const list = parseNames(names.value);
  out.replaceChildren(...list.map(row));
  hint.textContent = list.length ? `${list.length} link đã sẵn sàng.` : 'Nhập tên khách ở trên, link hiện ra ngay bên dưới.';
}

function copyAll(): void {
  const list = parseNames(names.value);
  if (!list.length) return say('Chưa có tên nào');
  void copy(list.map((n) => `${n}: ${linkFor(n)}`).join('\n'), `Đã chép ${list.length} link`);
}

function init(): void {
  names.value = load(STORE.names, '');
  message.value = load(STORE.message, DEFAULT_MESSAGE);
  names.addEventListener('input', () => {
    save(STORE.names, names.value);
    render();
  });
  message.addEventListener('input', () => {
    save(STORE.message, message.value);
    render();
  });
  $('resetMessage').addEventListener('click', () => {
    message.value = DEFAULT_MESSAGE;
    save(STORE.message, DEFAULT_MESSAGE);
    render();
  });
  $('copyAll').addEventListener('click', copyAll);
  $('clear').addEventListener('click', () => {
    if (names.value && !window.confirm('Xoá cả danh sách khách?')) return;
    names.value = '';
    save(STORE.names, '');
    render();
  });
  render();
}

init();
