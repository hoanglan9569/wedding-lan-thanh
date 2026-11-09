/**
 * So sánh hai bản dựng của trang bằng số liệu thật của Chrome (CDP):
 * byte tải về, thời gian chạy script, dựng layout và tính lại style.
 *   bun scripts/perf-page.ts http://127.0.0.1:4174/ http://127.0.0.1:4173/
 */
import { chromium, type CDPSession, type Page } from 'playwright';
import { retryUntil } from './retry';
import { Timeout } from './timeout';

const urls = process.argv.slice(2);
if (urls.length !== 2) {
  console.error('cần đúng hai URL: <cũ> <mới>');
  process.exit(1);
}

interface Result {
  url: string;
  jsBytes: number;
  wasmBytes: number;
  scriptMs: number;
  layoutMs: number;
  styleMs: number;
  taskMs: number;
  frames: number;
}

async function warmScroll(page: Page): Promise<void> {
  for (let i = 0; i < 24; i += 1) {
    await page.mouse.wheel(0, 420);
  }
  for (let i = 0; i < 24; i += 1) {
    await page.mouse.wheel(0, -420);
  }
}

async function collectMetrics(
  cdp: CDPSession,
  before: { metrics: { name: string; value: number }[] },
): Promise<{ scriptMs: number; layoutMs: number; styleMs: number; taskMs: number }> {
  const after = await cdp.send('Performance.getMetrics');
  const pick = (list: { name: string; value: number }[], name: string): number =>
    list.find((m) => m.name === name)?.value ?? 0;
  const delta = (name: string): number =>
    (pick(after.metrics, name) - pick(before.metrics, name)) * 1000;
  return {
    scriptMs: delta('ScriptDuration'),
    layoutMs: delta('LayoutDuration'),
    styleMs: delta('RecalcStyleDuration'),
    taskMs: delta('TaskDuration'),
  };
}

async function measureBytes(page: Page): Promise<{ jsBytes: number; wasmBytes: number }> {
  // last-resort: inspect performance resource entries for JS and WASM transfer sizes
  return page.evaluate(() => {
    let js = 0;
    let wasm = 0;
    for (const entry of performance.getEntriesByType('resource') as PerformanceResourceTiming[]) {
      const size = entry.encodedBodySize || entry.transferSize;
      if (entry.name.endsWith('.wasm')) wasm += size;
      else if (entry.initiatorType === 'script' || entry.name.endsWith('.js')) js += size;
    }
    return { jsBytes: js, wasmBytes: wasm };
  });
}

async function startFrameCounting(page: Page): Promise<void> {
  // last-resort: attach rAF frame counter to window to count rendered frames
  await page.evaluate(() => {
    const w = window as unknown as { __frames?: number };
    w.__frames = 0;
    const tick = (): void => {
      w.__frames = (w.__frames ?? 0) + 1;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

async function measure(url: string): Promise<Result> {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  context.setDefaultTimeout(Timeout.DEFAULT);
  context.setDefaultNavigationTimeout(Timeout.DEFAULT);
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'load' });
  // last-resort: wait for WASM engine initialization and envelope opacity to reach 1
  await page.waitForFunction(() => {
    const env = document.querySelector('#env');
    return Boolean(document.documentElement.dataset.engine && env && getComputedStyle(env).opacity === '1');
  });
  const { jsBytes, wasmBytes } = await measureBytes(page);
  const engine = (await page.locator('html').getAttribute('data-engine')) ?? 'none';
  console.log(`  engine: ${engine}`);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Performance.enable');
  const before = await cdp.send('Performance.getMetrics');

  await page.click('#intro-open');
  // last-resort: wait for envelope opening animation to complete and intro overlay removal
  await page.waitForFunction(() => document.documentElement.classList.contains('is-open') && !document.querySelector('#intro'));
  await startFrameCounting(page);
  await warmScroll(page);
  await retryUntil(
    async () => {
      // last-resort: poll until scroll settles at top and rAF frames have run
      const state = await page.evaluate(() => ({
        scrollY: window.scrollY,
        frames: (window as unknown as { __frames?: number }).__frames ?? 0,
      }));
      return state.frames > 20 && state.scrollY === 0;
    },
    { timeout: Timeout.SHORT, message: 'scroll did not settle' },
  );

  const metrics = await collectMetrics(cdp, before);
  // last-resort: read accumulated rAF frame count from window
  const frames = await page.evaluate(() => (window as unknown as { __frames?: number }).__frames ?? 0);
  await browser.close();
  return { url, jsBytes, wasmBytes, ...metrics, frames };
}

const rows: Result[] = [];
for (const url of urls) rows.push(await measure(url));

const kb = (n: number): string => `${(n / 1024).toFixed(1)} kB`;
for (const r of rows) {
  console.log(
    `${r.url}\n  js ${kb(r.jsBytes)} + wasm ${kb(r.wasmBytes)} | script ${r.scriptMs.toFixed(0)} ms | ` +
      `layout ${r.layoutMs.toFixed(0)} ms | style ${r.styleMs.toFixed(0)} ms | task ${r.taskMs.toFixed(0)} ms | ` +
      `${r.frames} khung`,
  );
}
const [a, b] = rows as [Result, Result];
console.log(
  `thay đổi: js ${(((b.jsBytes + b.wasmBytes) / a.jsBytes - 1) * 100).toFixed(0)}% | ` +
    `script ${((b.scriptMs / a.scriptMs - 1) * 100).toFixed(0)}% | task ${((b.taskMs / a.taskMs - 1) * 100).toFixed(0)}%`,
);
