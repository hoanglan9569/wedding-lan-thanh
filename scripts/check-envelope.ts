// Envelope gate: the guest name never runs under the wax seal (short, real NFD and very long names, 4 viewports). Usage: bun scripts/check-envelope.ts [url]
import { chromium, devices } from 'playwright';
const base = process.argv[2] ?? 'http://127.0.0.1:4173';
const names = [
  'Gia+%C4%91i%CC%80nh+ba%CC%A3n+Pha%CC%A3m+Huy+Hoa%CC%80ng',
  'C%C3%B4+T%C6%B0',
  encodeURIComponent('Gia đình anh chị Nguyễn Hoàng Phương Trường Giang và các cháu'),
];
const sizes = {
  phone: devices['iPhone 13'],
  se: devices['iPhone SE'],
  desktop: { viewport: { width: 1440, height: 900 } },
  laptop: { viewport: { width: 1280, height: 640 } },
} as const;
const browser = await chromium.launch();
let bad = 0;
for (const [label, opts] of Object.entries(sizes)) {
  const page = await (await browser.newContext(opts)).newPage();
  for (const [i, n] of names.entries()) {
    await page.goto(`${base}/?to=${n}`, { waitUntil: 'load' });
    await page.waitForFunction(() => {
      const env = document.querySelector('#env');
      return Boolean(document.documentElement.dataset.engine && env && getComputedStyle(env).opacity === '1');
    });
    const r = await page.evaluate(() => {
      const g = document.querySelector('#intro-guest')!.getBoundingClientRect();
      const to = document.querySelector('.env__to')!.getBoundingClientRect();
      const s = document.querySelector('.seal__art')!.getBoundingClientRect();
      const env = document.querySelector('.env__pocket')!.getBoundingClientRect();
      return { text: document.querySelector('#intro-guest')!.textContent, gap: Math.round(to.top - s.bottom), lines: Math.round(g.height / parseFloat(getComputedStyle(document.querySelector('#intro-guest')!).lineHeight)), below: Math.round(env.bottom - g.bottom) };
    });
    if (r.gap < 1 || r.below < 0) bad++;
    console.log(label, i, JSON.stringify(r));
    if (i === 0 || i === 2) await page.locator('.env, #intro').first().screenshot({ path: `${process.env.TEMP ?? '/tmp'}/seal-${label}-${i}.png` });
  }
}
await browser.close();
console.log(bad ? `FAIL ${bad}` : 'PASS');
