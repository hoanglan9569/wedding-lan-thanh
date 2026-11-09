/**
 * Guest-link page gate: names become links, links open the invitation with the guest name,
 * no horizontal overflow on phone or desktop, no console errors.
 * Usage: bun scripts/check-moi.ts [base url, default http://127.0.0.1:4173]
 */
import { chromium, devices, type Page } from 'playwright';
import { Timeout } from './timeout';

const base = (process.argv[2] ?? 'http://127.0.0.1:4173').replace(/\/$/, '');
const NAMES = 'Anh Nam và gia đình\n\nCô Tư\ncô tư\nBạn Minh <b>';

async function checkGenerator(page: Page, label: string): Promise<string> {
  await page.goto(`${base}/moi.html`, { waitUntil: 'load' });
  await page.locator('#names').waitFor();
  // last-resort: clear window localStorage for a clean generator test state
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'load' });
  await page.locator('#names').waitFor();
  await page.fill('#names', NAMES);
  // last-resort: wait for exact DOM list item count generated from textarea input
  await page.waitForFunction(() => document.querySelectorAll('#out .item').length === 3);
  const rows = await page.locator('#out .item').count();
  // last-resort: measure document scrollWidth against window innerWidth for horizontal overflow
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  const href = await page.locator('#out .item a').first().getAttribute('href');
  await page.screenshot({ path: `${process.env.TEMP ?? '/tmp'}/out-moi-${label}.png`, fullPage: true });
  if (rows !== 3) throw new Error(`${label}: expected 3 rows, got ${rows}`);
  if (overflow > 0) throw new Error(`${label}: ${overflow}px horizontal overflow`);
  await page.reload({ waitUntil: 'load' });
  // last-resort: wait for exact DOM list item count restored from localStorage after reload
  await page.waitForFunction(() => document.querySelectorAll('#out .item').length === 3);
  const kept = await page.locator('#out .item').count();
  if (kept !== 3) throw new Error(`${label}: list not kept after reload (${kept})`);
  console.log(`${label}: 3 rows, 0px overflow, list kept after reload, first link ${href}`);
  return href ?? '';
}

async function checkInvitation(page: Page, href: string): Promise<void> {
  await page.goto(href, { waitUntil: 'load' });
  // last-resort: wait for WASM engine boot flag on documentElement dataset
  await page.waitForFunction(() => Boolean(document.documentElement.dataset.engine));
  const shown = await page.locator('#intro-guest, #card-guest').first().textContent();
  if (shown?.trim() !== 'Anh Nam và gia đình') throw new Error(`invitation shows "${shown}"`);
  console.log(`invitation: shows "${shown?.trim()}"`);
}

const browser = await chromium.launch();
const errors: string[] = [];
try {
  for (const [label, opts] of [
    ['phone', devices['iPhone 13']],
    ['desktop', { viewport: { width: 1440, height: 900 } }],
  ] as const) {
    const context = await browser.newContext(opts);
    context.setDefaultTimeout(Timeout.DEFAULT);
    context.setDefaultNavigationTimeout(Timeout.DEFAULT);
    const page = await context.newPage();
    page.on('console', (m) => m.type() === 'error' && errors.push(`${label}: ${m.text()}`));
    page.on('pageerror', (e) => errors.push(`${label}: ${e.message}`));
    const href = await checkGenerator(page, label);
    if (label === 'phone') await checkInvitation(page, href);
  }
} finally {
  await browser.close();
}
if (errors.length) throw new Error(`console errors:\n${errors.join('\n')}`);
console.log('moi gate: pass');
