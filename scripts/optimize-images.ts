import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

interface GeneratedFile {
  relPath: string;
  bytes: number;
}

const MAX_WEBP_BYTES = 420 * 1024; // 420 KB
const MAX_OG_BYTES = 220 * 1024; // 220 KB

async function ensureDirs(dirs: string[]): Promise<void> {
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

async function writeWebp(
  src: string,
  outPath: string,
  width: number,
  initialQuality: number,
  effort: number
): Promise<GeneratedFile> {
  let quality = initialQuality;
  let buffer: Buffer;

  while (true) {
    buffer = await sharp(src)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality, effort })
      .toBuffer();

    if (buffer.length <= MAX_WEBP_BYTES || quality <= 50) {
      break;
    }
    quality -= 2;
  }

  await fs.promises.writeFile(outPath, buffer);
  return { relPath: outPath.replace(/\\/g, '/'), bytes: buffer.length };
}

async function writeJpeg(
  src: string,
  outPath: string,
  width: number | null,
  quality: number
): Promise<GeneratedFile> {
  let pipeline = sharp(src).rotate();
  if (width !== null) {
    pipeline = pipeline.resize({ width, withoutEnlargement: true });
  }
  const buffer = await pipeline
    .jpeg({ quality, progressive: true, mozjpeg: true })
    .toBuffer();

  await fs.promises.writeFile(outPath, buffer);
  return { relPath: outPath.replace(/\\/g, '/'), bytes: buffer.length };
}

async function generateLqip(src: string): Promise<string> {
  const buffer = await sharp(src)
    .rotate()
    .resize({ width: 24, withoutEnlargement: true })
    .webp({ quality: 40 })
    .toBuffer();
  return `data:image/webp;base64,${buffer.toString('base64')}`;
}

async function processPhotos(
  photos: { input: string; slug: string }[]
): Promise<GeneratedFile[]> {
  const results: GeneratedFile[] = [];
  const widths = [640, 1080, 1600, 2400];

  for (const { input, slug } of photos) {
    for (const w of widths) {
      const out = path.join('public', 'photos', `${slug}-${w}.webp`);
      results.push(await writeWebp(input, out, w, 82, 5));
    }
    const jpgOut = path.join('public', 'photos', `${slug}-1280.jpg`);
    results.push(await writeJpeg(input, jpgOut, 1280, 80));
  }
  return results;
}

async function processMap(
  input: string,
  slug: string
): Promise<GeneratedFile[]> {
  const results: GeneratedFile[] = [];
  const widths = [900, 1400, 1874];

  for (const w of widths) {
    const out = path.join('public', 'map', `${slug}-${w}.webp`);
    results.push(await writeWebp(input, out, w, 90, 6));
  }
  const jpgOut = path.join('public', 'map', `${slug}.jpg`);
  results.push(await writeJpeg(input, jpgOut, null, 88));
  return results;
}

async function processInvitation(
  input: string,
  slug: string
): Promise<GeneratedFile[]> {
  const results: GeneratedFile[] = [];
  const widths = [900, 1400, 2000];

  for (const w of widths) {
    const out = path.join('public', 'invitation', `${slug}-${w}.webp`);
    results.push(await writeWebp(input, out, w, 86, 5));
  }
  return results;
}

async function processOg(
  input: string,
  outPath: string
): Promise<GeneratedFile> {
  let quality = 82;
  let buffer: Buffer;

  while (true) {
    buffer = await sharp(input)
      .extract({ left: 0, top: 1250, width: 4672, height: 2520 })
      .resize(1200, 630)
      .jpeg({ quality, progressive: true, mozjpeg: true })
      .toBuffer();

    if (buffer.length <= MAX_OG_BYTES || quality <= 50) {
      break;
    }
    quality -= 4;
  }

  await fs.promises.writeFile(outPath, buffer);
  return { relPath: outPath.replace(/\\/g, '/'), bytes: buffer.length };
}

async function buildManifest(
  items: { input: string; slug: string }[]
): Promise<void> {
  const manifest: Record<string, { width: number; height: number; lqip: string }> = {};

  for (const { input, slug } of items) {
    const meta = await sharp(input).rotate().metadata();
    const lqip = await generateLqip(input);
    manifest[slug] = {
      width: meta.width ?? 0,
      height: meta.height ?? 0,
      lqip,
    };
  }

  const outDir = path.join('src', 'data');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  const outPath = path.join(outDir, 'images.json');
  await fs.promises.writeFile(outPath, JSON.stringify(manifest, null, 2) + '\n');
}

async function main(): Promise<void> {
  await ensureDirs([
    path.join('public', 'photos'),
    path.join('public', 'map'),
    path.join('public', 'invitation'),
    path.join('src', 'data'),
  ]);

  const photos = [
    { input: path.join('assets-src', 'originals', 'VAN06601.jpg'), slug: 'van06601' },
    { input: path.join('assets-src', 'originals', 'VAN06795.jpg'), slug: 'van06795' },
    { input: path.join('assets-src', 'originals', 'VAN06896.jpg'), slug: 'van06896' },
    { input: path.join('assets-src', 'originals', 'VAN09249.jpg'), slug: 'van09249' },
  ];
  const mapItem = { input: path.join('assets-src', 'map-kim-center.jpg'), slug: 'map-kim-center' };
  const invitationItem = {
    input: path.join('assets-src', 'invitation-nha-trai.jpg'),
    slug: 'invitation-nha-trai',
  };
  const ogInput = path.join('assets-src', 'originals', 'VAN06795.jpg');
  const ogOut = path.join('public', 'og.jpg');

  const allGenerated: GeneratedFile[] = [];
  allGenerated.push(...(await processPhotos(photos)));
  allGenerated.push(...(await processMap(mapItem.input, mapItem.slug)));
  allGenerated.push(...(await processInvitation(invitationItem.input, invitationItem.slug)));
  allGenerated.push(await processOg(ogInput, ogOut));

  await buildManifest([...photos, mapItem, invitationItem]);

  let totalBytes = 0;
  for (const file of allGenerated) {
    const kb = (file.bytes / 1024).toFixed(1);
    console.log(`${file.relPath}: ${kb} KB`);
    totalBytes += file.bytes;
  }
  const totalKb = (totalBytes / 1024).toFixed(1);
  console.log(`Total: ${totalKb} KB (${allGenerated.length} files)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
