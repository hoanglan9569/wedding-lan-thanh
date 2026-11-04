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
}

const TARGETS: ArtTarget[] = [
  // Tranh nằm dưới chữ với độ mờ 0.14-0.55 nên nén mạnh vẫn không thấy khác.
  { name: 'corner-spray', width: 760, quality: 70 },
  { name: 'divider', width: 900, quality: 74 },
  { name: 'wreath', width: 760, quality: 70 },
  { name: 'seal', width: 256, quality: 86 },
  { name: 'petal-fall', width: 1200, quality: 56 },
];

const SRC = path.join('assets-src', 'art');
const OUT = path.join('public', 'art');

async function shrink(target: ArtTarget): Promise<string> {
  const input = path.join(SRC, `${target.name}.webp`);
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
