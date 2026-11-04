/**
 * Tranh trang trí nào thiếu tệp thì gỡ thẻ ảnh đi,
 * để trang không bao giờ hiện biểu tượng ảnh vỡ.
 */
export function pruneMissingArt(): void {
  const images = document.querySelectorAll<HTMLImageElement>('img[aria-hidden="true"]');
  images.forEach((img) => {
    if (img.complete && img.naturalWidth === 0) {
      img.remove();
      return;
    }
    img.addEventListener('error', () => img.remove(), { once: true });
  });
}
