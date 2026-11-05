/**
 * Các hiệu ứng bám theo vị trí cuộn (parallax, đường kẻ chương trình).
 * Lõi wasm giữ dải cuộn, nội suy và độ trễ scrub; JS chỉ đo khung một lần sau
 * mỗi lần bố cục đổi rồi ghi giá trị ra style.
 */
import { EASE, getCore, type MotionCore } from '../vendor/motion-core/core';

export interface TrackSpec {
  el: HTMLElement;
  /** Mốc cuộn bắt đầu/kết thúc, tính từ khung của phần tử và chiều cao màn hình. */
  start: (top: number, height: number, vh: number) => number;
  end: (top: number, height: number, vh: number) => number;
  from: number;
  to: number;
  ease?: keyof typeof EASE;
  /** Giây làm mượt; 0 là bám cứng theo cuộn. */
  scrub?: number;
  apply: (value: number) => void;
}

const MAX = 32;
const specs: TrackSpec[] = [];

export function addTrack(spec: TrackSpec): void {
  if (specs.length >= MAX) return;
  specs.push(spec);
  refreshTracks();
}

/** Đo lại mốc cuộn (sau khi tải ảnh, xoay máy, mở thiệp). */
export function refreshTracks(): void {
  const core = getCore();
  if (!core) return;
  const vh = window.innerHeight;
  const scrollY = window.scrollY;
  for (let i = 0; i < specs.length; i += 1) {
    const spec = specs[i]!;
    const rect = spec.el.getBoundingClientRect();
    const top = rect.top + scrollY;
    core.track_set(
      i,
      spec.start(top, rect.height, vh),
      spec.end(top, rect.height, vh),
      spec.from,
      spec.to,
      EASE[spec.ease ?? 'none'],
      spec.scrub ?? 0,
    );
  }
}

export function tickTracks(core: MotionCore): void {
  for (let i = 0; i < specs.length; i += 1) specs[i]!.apply(core.motionOut[i]!);
}

export function trackCount(): number {
  return specs.length;
}
