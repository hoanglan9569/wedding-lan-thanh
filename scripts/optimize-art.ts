/**
 * Thu nhỏ tranh trang trí (Krea 2) về đúng cỡ hiển thị trên trang.
 * Nguồn: assets-src/art/<ten>.webp  ->  public/art/<ten>.webp
 *   bun run optimize:art
 */
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

interface ArtTarget {
  name: string;
  width: number;
  quality: number;
  /** tên tệp nguồn nếu khác tên đích (bản nhỏ dùng chung một bản vẽ) */
  source?: string;
}

// Nguồn hoa hồng (Krea 2) được cắt nền bằng out/auto-warband-art/tools/wedding-rose-cutout.py;
// favicon*.png và apple-touch-icon.png cũng do script đó ghi thẳng vào public/.
const TARGETS: ArtTarget[] = [
  // Tranh nằm dưới chữ với độ mờ 0.14-0.7 nên nén mạnh vẫn không thấy khác.
  { name: 'corner-spray', width: 720, quality: 56 },
  // bản nhỏ cho màn phong bì: tải trước khi mở thiệp nên phải nhẹ
  { name: 'corner-sm', width: 400, quality: 52, source: 'corner-spray' },
  { name: 'divider', width: 900, quality: 60 },
  { name: 'wreath', width: 720, quality: 58 },
  { name: 'wreath-sm', width: 400, quality: 60, source: 'wreath' },
  { name: 'seal', width: 224, quality: 78 },
  { name: 'petal-fall', width: 1200, quality: 48 },
  { name: 'rose-sprig', width: 480, quality: 80 },
];

const SRC = path.join('assets-src', 'art');
const OUT = path.join('public', 'art');

async function shrink(target: ArtTarget): Promise<string> {
  const input = path.join(SRC, `${target.source ?? target.name}.webp`);
  const output = path.join(OUT, `${target.name}.webp`);
  const image = sharp(input).resize({ width: target.width, withoutEnlargement: true });
  const buffer = await image.webp({ quality: target.quality, alphaQuality: 90, effort: 6 }).toBuffer();
  await fs.promises.writeFile(output, buffer);
  const meta = await sharp(buffer).metadata();
  return `${output}: ${meta.width}x${meta.height}, ${(buffer.length / 1024).toFixed(1)} KB`;
}

async function main(): Promise<void> {
  await fs.promises.mkdir(OUT, { recursive: true });
  let total = 0;
  for (const target of TARGETS) {
    const line = await shrink(target);
    console.log(line);
    total += fs.statSync(path.join(OUT, `${target.name}.webp`)).size;
  }
  console.log(`tổng: ${(total / 1024).toFixed(1)} KB`);
}

await main();
