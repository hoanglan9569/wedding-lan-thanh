const MAX = 64;

/**
 * Làm sạch tên khách. Không dùng DOM: trang thiệp, trang tạo link (moi.html)
 * và functions/_middleware.ts (xem trước link) dùng chung để tên luôn khớp.
 */
export function cleanGuestName(raw: string): string {
  // NFC: links typed on iOS/macOS often carry decomposed marks (i + U+0300), which some fonts stack badly.
  return raw
    .normalize('NFC')
    .replace(/[<>{}[\]\\|`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX);
}
