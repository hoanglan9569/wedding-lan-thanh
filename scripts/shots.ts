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
  const height = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < height; y += 360) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(130);
  }
  await page.waitForTimeout(1000);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(700);
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
