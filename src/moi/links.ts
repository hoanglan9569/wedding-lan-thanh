import { cleanGuestName } from '../modules/guest';
import { couple, weddingDate } from '../data/wedding';

export const DEFAULT_MESSAGE =
  `Trân trọng kính mời {ten} đến chung vui cùng ${couple.groom.name} & ${couple.bride.name} ` +
  `trong ngày cưới, ${weddingDate.weekday} ${weddingDate.day}.${weddingDate.month}.${weddingDate.year}.\n` +
  'Thiệp mời của {ten}: {link}';

/** Tách danh sách: mỗi dòng một tên, bỏ dòng trống và tên trùng. */
export function parseNames(raw: string): string[] {
  const seen = new Set<string>();
  const list: string[] = [];
  for (const line of raw.split('\n')) {
    const name = cleanGuestName(line);
    const key = name.toLocaleLowerCase('vi');
    if (!name || seen.has(key)) continue;
    seen.add(key);
    list.push(name);
  }
  return list;
}

/** Đường dẫn thiệp cho một khách: <gốc trang>/?to=<tên>. */
export function linkFor(name: string, base = window.location.origin + import.meta.env.BASE_URL): string {
  const url = new URL(base);
  url.searchParams.set('to', name);
  return url.toString();
}

export function messageFor(template: string, name: string, link: string): string {
  const text = template.trim() || DEFAULT_MESSAGE;
  const filled = text.replaceAll('{ten}', name).replaceAll('{link}', link);
  return text.includes('{link}') ? filled : `${filled}\n${link}`;
}
