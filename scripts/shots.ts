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
  shots: string[];
}

async function openCard(page: Page): Promise<void> {
  await page.waitForSelector('#intro-open', { timeout: 15000 });
  await page.click('#intro-open');
  await page.waitForTimeout(1800);
}

async function shootSections(page: Page, view: string): Promise<string[]> {
  const shots: string[] = [];
  for (const id of SECTIONS) {
    const el = page.locator(id).first();
    if (!(await el.count())) continue;
    await el.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1200);
    const file = `${outDir}/${view}-${id.replace('#', '')}.jpg`;
    await page.screenshot({ path: file, quality: 72, type: 'jpeg' });
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
  await page.screenshot({ path: `${outDir}/${view}-intro.jpg`, quality: 72, type: 'jpeg' });
  await openCard(page);
  const shots = await shootSections(page, view);

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  await browser.close();
  return { view, errors, overflow, shots: [`${outDir}/${view}-intro.jpg`, ...shots] };
}

await mkdir(outDir, { recursive: true });
const desktop = await run('desktop', 1440, 900, false);
const mobile = await run('mobile', 390, 844, true);

for (const report of [desktop, mobile]) {
  console.log(`\n== ${report.view} ==`);
  console.log(`overflow ngang: ${report.overflow}px`);
  console.log(`lỗi console: ${report.errors.length ? report.errors.join(' | ') : 'không có'}`);
  console.log(`ảnh: ${report.shots.length}`);
}
