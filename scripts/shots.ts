/**
 * Chụp ảnh kiểm tra giao diện (desktop + mobile) và dò lỗi bố cục.
 * Cần Playwright (có sẵn ở workspace cha, hoặc `bun add -d playwright`).
 *   bun scripts/shots.ts [url] [outDir]
 */
import { chromium, devices, type Page } from 'playwright';
import { mkdir } from 'node:fs/promises';

const url = process.argv[2] ?? 'http://127.0.0.1:4173/';
const outDir = process.argv[3] ?? 'F:/work/deepseek-general/out/wedding-shots';

const SECTIONS = [
  '#hero',
  '#countdown',
  '#letter',
  '#pair',
  '#invitation',
  '#events',
  '#album',
  '#venue',
  '#rsvp',
  '#wishes',
];

interface Report {
  view: string;
  errors: string[];
  overflow: number;
  checks: string[];
  shots: string[];
}

/** Đo bằng số thay vì nhìn ảnh: nút mở thiệp, ảnh hero phủ kín, nhạc, album. */
async function measure(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const out: string[] = [];
    const paper = document.querySelector('.intro__paper');
    if (paper) {
      const box = paper.getBoundingClientRect();
      out.push(
        `thiệp mở màn: ${Math.round(box.width)}x${Math.round(box.height)} trong ${
          window.innerWidth
        }x${window.innerHeight}, tràn dọc ${Math.max(0, Math.round(box.bottom - window.innerHeight))}px`,
      );
    }
    const btn = document.querySelector('#intro-open');
    if (!btn) out.push('intro-open: MISSING');
    else {
      const rect = btn.getBoundingClientRect();
      out.push(
        `intro-open: opacity=${getComputedStyle(btn).opacity} ${Math.round(rect.width)}x${Math.round(
          rect.height,
        )} top=${Math.round(rect.top)}`,
      );
    }
    const hero = document.querySelector('.hero');
    const img = document.querySelector<HTMLImageElement>('.hero__media img');
    if (hero && img) {
      const gap = Math.round(hero.getBoundingClientRect().height - img.getBoundingClientRect().height);
      out.push(`hero phủ: thiếu ${gap}px (âm là dư, tốt)`);
    }
    out.push(`album: ${document.querySelectorAll('#album-grid .shot').length} ảnh`);
    out.push(`nút nhạc: ${document.querySelector('#music-toggle') ? 'có' : 'thiếu'}`);
    return out;
  });
}

async function openCard(page: Page): Promise<void> {
  await page.waitForSelector('#intro-open', { timeout: 15000 });
  await page.click('#intro-open');
  await page.waitForTimeout(1800);
}

/** Cuộn hết trang một lượt để mọi hiệu ứng xuất hiện đã chạy xong. */
async function warmUp(page: Page): Promise<void> {
  // Lăn chuột thật (Lenis chỉ nhận wheel) và cả scrollTo cho ngữ cảnh cảm ứng.
  // Trang cao dần khi ảnh tải xong nên phải đo lại mỗi vòng, không tính trước.
  for (let step = 0; step < 80; step += 1) {
    const atBottom = await page.evaluate((delta) => {
      window.scrollBy(0, delta);
      return window.scrollY + window.innerHeight >= document.body.scrollHeight - 4;
    }, 320);
    await page.mouse.wheel(0, 320);
    await page.waitForTimeout(110);
    if (atBottom) break;
  }
  await page.waitForTimeout(1200);
  await page.mouse.wheel(0, -40000);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(900);
}

/**
 * Dấu tiếng Việt chồng hai tầng (ế, ồ, ữ, ặ) phải cao hơn chữ trần.
 * Phông nào vẽ thiếu dấu thì chiều cao bằng nhau: báo lỗi ngay tại đây.
 */
async function diacritics(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    // 'duoi' = dấu nằm dưới chữ (nặng), phải đo phần chìm thay vì phần nhô
    const pairs: [string, string, 'tren' | 'duoi'][] = [
      ['ế', 'ê', 'tren'],
      ['ồ', 'ô', 'tren'],
      ['ữ', 'ư', 'tren'],
      ['ỗ', 'ô', 'tren'],
      ['ặ', 'ă', 'duoi'],
      ['ọ', 'o', 'duoi'],
    ];
    const fonts = ['Playfair Display', 'Be Vietnam Pro', 'Dancing Script'];
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return ['không đo được'];
    const bad: string[] = [];
    for (const font of fonts) {
      ctx.font = `64px "${font}"`;
      for (const [marked, plain, side] of pairs) {
        const read = (text: string): number =>
          side === 'tren'
            ? ctx.measureText(text).actualBoundingBoxAscent
            : ctx.measureText(text).actualBoundingBoxDescent;
        const a = read(marked);
        const b = read(plain);
        if (a - b < 1.5) bad.push(`${font} "${marked}" ${a.toFixed(1)} = "${plain}" ${b.toFixed(1)}`);
      }
    }
    return bad;
  });
}

/** Đo tương phản chữ trên nền theo công thức WCAG: dễ đọc mà không chói. */
async function contrast(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const picks = [
      '.letter__text p',
      '.card__when p',
      '.tl__addr',
      '.rsvp__note',
      '.person__parents',
      '.eyebrow',
      '.cd__lbl',
      '.field label',
    ];
    const nums = (value: string): number[] => (value.match(/\d+(\.\d+)?/g) ?? []).map(Number);
    const lum = (rgb: number[]): number => {
      const [r = 0, g = 0, b = 0] = rgb.map((v) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const backdrop = (el: Element): number[] => {
      let node: Element | null = el;
      while (node) {
        const bg = getComputedStyle(node).backgroundColor;
        if (bg && !bg.startsWith('rgba(0, 0, 0, 0')) return nums(bg);
        node = node.parentElement;
      }
      return [255, 255, 255];
    };
    return picks.flatMap((sel) => {
      const el = document.querySelector(sel);
      if (!el) return [];
      const a = lum(nums(getComputedStyle(el).color));
      const b = lum(backdrop(el));
      const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      return [`${sel} ${ratio.toFixed(1)}:1`];
    });
  });
}

/** Sau khi cuộn hết trang, không phần tử nào được phép còn mờ. */
async function stillHidden(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const bad: string[] = [];
    document.querySelectorAll<HTMLElement>('[data-reveal], [data-split]').forEach((el) => {
      const nodes = el.dataset.reveal === 'stagger' ? Array.from(el.children) : [el];
      for (const node of nodes) {
        const style = getComputedStyle(node as HTMLElement);
        const opacity = Number.parseFloat(style.opacity);
        if (opacity < 0.9) bad.push(`${node.nodeName}.${(node as HTMLElement).className} = ${opacity}`);
      }
    });
    return bad.slice(0, 10);
  });
}

async function shootSections(page: Page, view: string): Promise<string[]> {
  const shots: string[] = [];
  for (const id of SECTIONS) {
    const el = page.locator(id).first();
    if (!(await el.count())) continue;
    await el.scrollIntoViewIfNeeded();
    await page.waitForTimeout(900);
    const file = `${outDir}/${view}-${id.replace('#', '')}.jpg`;
    // Ảnh của cả khối: không cắt theo khung nhìn nên không báo lỗi giả.
    if (id === '#hero') await page.screenshot({ path: file, quality: 72, type: 'jpeg' });
    else await el.screenshot({ path: file, quality: 72, type: 'jpeg' });
    shots.push(file);
  }
  return shots;
}

async function run(view: string, width: number, height: number, mobile: boolean): Promise<Report> {
  const browser = await chromium.launch();
  const context = await browser.newContext(
    mobile
      ? { ...devices['iPhone 13'], locale: 'vi-VN' }
      : { viewport: { width, height }, deviceScaleFactor: 1, locale: 'vi-VN' },
  );
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text().slice(0, 200));
  });
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message.slice(0, 200)}`));

  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2400); // để hiệu ứng mở màn chạy xong rồi mới chụp
  const checks = await measure(page);
  await page.screenshot({ path: `${outDir}/${view}-intro.jpg`, quality: 72, type: 'jpeg' });
  await openCard(page);
  await warmUp(page);
  const hidden = await stillHidden(page);
  checks.push(`còn mờ sau khi cuộn: ${hidden.length ? hidden.join(' | ') : 'không có'}`);
  checks.push(`tương phản: ${(await contrast(page)).join(' · ')}`);
  const marks = await diacritics(page);
  checks.push(`dấu tiếng Việt: ${marks.length ? marks.join(' | ') : 'đủ dấu'}`);
  // Tắt cuộn mượt: nó giành quyền cuộn với trình chụp nên ảnh ghép bị lệch.
  await page.evaluate(() => (window as unknown as { __lenis?: { destroy(): void } }).__lenis?.destroy());
  await page.waitForTimeout(300);
  const shots = await shootSections(page, view);

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  await browser.close();
  return { view, errors, overflow, checks, shots: [`${outDir}/${view}-intro.jpg`, ...shots] };
}

await mkdir(outDir, { recursive: true });
const desktop = await run('desktop', 1440, 900, false);
const mobile = await run('mobile', 390, 844, true);

for (const report of [desktop, mobile]) {
  console.log(`\n== ${report.view} ==`);
  console.log(`overflow ngang: ${report.overflow}px`);
  console.log(`lỗi console: ${report.errors.length ? report.errors.join(' | ') : 'không có'}`);
  for (const line of report.checks) console.log(`  ${line}`);
  console.log(`ảnh: ${report.shots.length}`);
}
