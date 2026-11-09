/**
 * Motion gate: the animations the owner asked for must really move. The
 * envelope entrance and opening, the hero names, the petal rain, the Ken Burns
 * zoom, the scroll reveals, and the envelope again after a refresh, on desktop
 * and phone, Chromium and WebKit, with the OS "reduce motion" preference on
 * and off. The owner's Windows has Animation effects off, so his browser
 * reports prefers-reduced-motion: reduce, while Playwright emulates
 * no-preference unless told otherwise: a probe on its defaults never sees
 * what he sees. Values are sampled over time; an end state alone passes a
 * page that snaps straight to its last frame.
 *
 * bun scripts/check-motion.ts [url]        (default http://127.0.0.1:4173/)
 */
import { chromium, webkit, devices, type Browser, type BrowserContextOptions, type Page } from 'playwright';

/** `system`: no emulation, the machine's own OS setting (the owner's PC reports reduce). */
type Motion = 'reduce' | 'no-preference' | 'system';
type EngineName = 'chromium' | 'webkit';
type Prop = 'opacity' | 'transform';
type Which = 'first' | 'last';

interface Scenario {
  engine: EngineName;
  device: 'desktop' | 'mobile';
  motion: Motion;
}

interface Result {
  check: string;
  ok: boolean;
  detail: string;
}

const url = process.argv[2] ?? 'http://127.0.0.1:4173/';

const SCENARIOS: Scenario[] = [
  { engine: 'chromium', device: 'desktop', motion: 'system' },
  { engine: 'chromium', device: 'desktop', motion: 'reduce' },
  { engine: 'chromium', device: 'desktop', motion: 'no-preference' },
  { engine: 'chromium', device: 'mobile', motion: 'reduce' },
  { engine: 'chromium', device: 'mobile', motion: 'no-preference' },
  { engine: 'webkit', device: 'mobile', motion: 'reduce' },
  { engine: 'webkit', device: 'mobile', motion: 'no-preference' },
];

const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));
const present = (values: string[]): string[] => values.filter((v) => v !== 'gone');
const distinct = (values: string[]): number => new Set(present(values)).size;
const nums = (values: string[]): number[] => present(values).map(Number).filter(Number.isFinite);
const round = (v: number): string => v.toFixed(2);

/** Passes through the middle on its way to (almost) fully shown. */
function ramps(values: number[]): boolean {
  const last = values[values.length - 1] ?? 0;
  return values.some((v) => v > 0.05 && v < 0.95) && last >= 0.95;
}

function trail(values: number[]): string {
  const step = Math.max(1, Math.floor(values.length / 8));
  return values.filter((_, i) => i % step === 0 || i === values.length - 1).map(round).join(' > ');
}

function contextFor(s: Scenario): BrowserContextOptions {
  const base = s.device === 'mobile' ? devices['iPhone 13'] : { viewport: { width: 1440, height: 900 } };
  return { ...base, reducedMotion: s.motion === 'system' ? null : s.motion };
}

/** Init script: records #env opacity from the first moment of every document, before any page script. */
function recordEntrance(): void {
  const out: string[] = [];
  (window as unknown as { __env: string[] }).__env = out;
  const t0 = performance.now();
  const tick = (): void => {
    const el = document.querySelector('#env');
    if (el) out.push(getComputedStyle(el).opacity);
    if (performance.now() - t0 < 4000) setTimeout(tick, 60);
  };
  tick();
}

/** Samples computed styles inside the page every `every` ms; clicks `click` first when given. */
async function sampleStyles(
  page: Page,
  probes: [string, Prop][],
  total: number,
  every: number,
  click?: string,
): Promise<string[][]> {
  return page.evaluate(
    async ({ probes, total, every, click }) => {
      if (click) document.querySelector<HTMLElement>(click)?.click();
      const out = probes.map(() => [] as string[]);
      const t0 = performance.now();
      while (performance.now() - t0 <= total) {
        probes.forEach(([selector, prop], i) => {
          const el = document.querySelector(selector);
          out[i]!.push(el ? getComputedStyle(el)[prop] : 'gone');
        });
        await new Promise((resolve) => setTimeout(resolve, every));
      }
      return out;
    },
    { probes, total, every, click },
  );
}

async function checkBoot(page: Page, s: Scenario): Promise<Result[]> {
  const state = await page.evaluate(() => ({
    reduce: matchMedia('(prefers-reduced-motion: reduce)').matches,
    engine: document.documentElement.dataset.engine ?? '-',
    still: document.documentElement.classList.contains('no-motion'),
    env: (window as unknown as { __env?: string[] }).__env ?? [],
  }));
  const env = nums(state.env);
  return [
    {
      check: s.motion === 'system' ? 'OS preference (not emulated)' : 'emulated preference applied',
      ok: s.motion === 'system' || state.reduce === (s.motion === 'reduce'),
      detail: `reduce=${state.reduce}`,
    },
    { check: 'wasm core running', ok: state.engine === 'wasm' && !state.still, detail: `engine=${state.engine} no-motion=${state.still}` },
    { check: 'envelope entrance fades in', ok: distinct(state.env) >= 3, detail: trail(env) || 'no #env' },
  ];
}

async function checkKenBurns(page: Page): Promise<Result> {
  const detail = await page.evaluate(() => {
    const img = document.querySelector('.hero__media img');
    const list = img?.getAnimations() ?? [];
    const long = list.find((a) => a.playState === 'running' && Number(a.effect?.getTiming().duration) >= 1000);
    return long ? `running ${String(long.effect?.getTiming().duration)} ms` : `not running (${list.length} animations)`;
  });
  return { check: 'hero Ken Burns zoom', ok: detail.startsWith('running'), detail };
}

async function checkOpening(page: Page): Promise<Result[]> {
  const probes: [string, Prop][] = [
    ['#env-flap', 'transform'],
    ['#env-card', 'transform'],
    ['.hero__name', 'opacity'],
    ['#intro', 'opacity'],
  ];
  const [flap = [], card = [], names = [], overlay = []] = await sampleStyles(page, probes, 4200, 100, '#intro-open');
  await wait(400);
  const gone = (await page.locator('#intro').count()) === 0;
  const fade = nums(overlay);
  return [
    { check: 'envelope flap turns', ok: distinct(flap) >= 4, detail: `${distinct(flap)} distinct transforms` },
    { check: 'card slides out', ok: distinct(card) >= 4, detail: `${distinct(card)} distinct transforms` },
    { check: 'hero names fly in', ok: ramps(nums(names)), detail: trail(nums(names)) },
    {
      check: 'overlay fades out, then leaves',
      ok: gone && fade.some((v) => v > 0.05 && v < 0.95),
      detail: `${trail(fade)} | removed=${gone}`,
    },
  ];
}

async function checkPetals(page: Page): Promise<Result> {
  const frames = await page.evaluate(async () => {
    const canvas = document.querySelector<HTMLCanvasElement>('#petals');
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !canvas.width) return null;
    const painted: number[] = [];
    const sums: number[] = [];
    for (let f = 0; f < 3; f += 1) {
      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let n = 0;
      let sum = 0;
      for (let i = 3; i < data.length; i += 4 * 7) {
        if (data[i]! > 20) {
          n += 1;
          sum = (sum + i) % 1e9;
        }
      }
      painted.push(n);
      sums.push(sum);
      await new Promise((resolve) => setTimeout(resolve, 220));
    }
    return { size: `${canvas.width}x${canvas.height}`, painted, moved: new Set(sums).size > 1 };
  });
  if (!frames) return { check: 'petal rain on the hero', ok: false, detail: 'no #petals canvas' };
  const ok = Math.min(...frames.painted) > 20 && frames.moved;
  return { check: 'petal rain on the hero', ok, detail: `${frames.size}, painted ${frames.painted.join('/')}, moving=${frames.moved}` };
}

async function checkReveal(page: Page, which: Which): Promise<Result> {
  const top = await page.evaluate((pick) => {
    const below = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]')).filter(
      (el) => !el.closest('.hero') && el.getBoundingClientRect().top > window.innerHeight,
    );
    const el = pick === 'first' ? below[0] : below[below.length - 1];
    if (!el) return -1;
    const kid = el.firstElementChild;
    const target = el.dataset.reveal === 'stagger' && kid instanceof HTMLElement ? kid : el;
    target.setAttribute('data-probe', pick);
    return el.getBoundingClientRect().top + window.scrollY;
  }, which);
  const check = `reveal on scroll (${which} below the fold)`;
  if (top < 0) return { check, ok: false, detail: 'no reveal below the fold' };
  // instant: with CSS scroll-behavior smooth, WebKit sometimes stops a long programmatic scroll short
  await page.evaluate((y) => window.scrollTo({ top: Math.max(0, y - window.innerHeight * 0.5), behavior: 'instant' }), top);
  const [values = []] = await sampleStyles(page, [[`[data-probe="${which}"]`, 'opacity']], 1700, 80);
  const v = nums(values);
  return { check, ok: (v[0] ?? 1) < 0.5 && ramps(v), detail: trail(v) };
}

/** Desktop smooth scroll clamps the wheel to a measured page bottom: a stale bottom strands the
 *  guest at the guest book (owner bug 2026-11-06). Wheel from the top and require the real bottom. */
async function checkWheelToFooter(page: Page): Promise<Result> {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await wait(400);
  await page.mouse.move(720, 450);
  for (let i = 0; i < 120; i++) {
    await page.mouse.wheel(0, 500);
    await wait(40);
  }
  await wait(1500);
  const r = await page.evaluate(() => ({
    y: Math.round(window.scrollY),
    max: document.documentElement.scrollHeight - window.innerHeight,
    footer: Math.round(document.querySelector('.footer')!.getBoundingClientRect().top),
  }));
  return {
    check: 'mouse wheel reaches the footer',
    ok: r.y >= r.max - 2 && r.footer < 900,
    detail: `scrollY ${r.y} of ${r.max}, footer top ${r.footer}px`,
  };
}

async function checkReload(page: Page): Promise<Result[]> {
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
  await wait(500);
  const before = await page.evaluate(() => Math.round(window.scrollY));
  await page.reload({ waitUntil: 'load' });
  await wait(1600);
  const state = await page.evaluate(() => {
    const rest = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]')).filter((el) => !el.closest('.hero'));
    const hidden = rest.filter((el) => {
      const kid = el.firstElementChild;
      const target = el.dataset.reveal === 'stagger' && kid instanceof HTMLElement ? kid : el;
      return Number(getComputedStyle(target).opacity) < 0.5;
    }).length;
    const env = (window as unknown as { __env?: string[] }).__env ?? [];
    return { y: Math.round(window.scrollY), intro: !!document.querySelector('#intro'), hidden, total: rest.length, env };
  });
  const ok = before > 0 && state.y === 0 && state.intro && state.hidden >= state.total * 0.5;
  return [
    {
      check: 'refresh starts at the envelope',
      ok,
      detail: `scrollY ${before} -> ${state.y}, intro=${state.intro}, ${state.hidden}/${state.total} reveals hidden`,
    },
    { check: 'entrance plays again after refresh', ok: distinct(state.env) >= 3, detail: trail(nums(state.env)) },
  ];
}

async function checkMusicReload(page: Page): Promise<Result[]> {
  await page.click('#intro-open');
  await wait(600);
  const secondVisit = await page.evaluate(() => ({
    pressed: document.querySelector('#music-toggle')?.getAttribute('aria-pressed'),
    local: localStorage.getItem('lanthanh:music'),
    session: sessionStorage.getItem('lanthanh:music'),
  }));
  await page.evaluate(() => document.querySelector<HTMLButtonElement>('#music-toggle')?.click());
  await wait(100);
  await page.reload({ waitUntil: 'load' });
  await wait(400);
  await page.click('#intro-open');
  await wait(600);
  const mutedVisit = await page.evaluate(() => ({
    pressed: document.querySelector('#music-toggle')?.getAttribute('aria-pressed'),
    local: localStorage.getItem('lanthanh:music'),
  }));
  return [
    {
      check: 'music plays on second visit when not muted',
      ok: secondVisit.pressed === 'true' && secondVisit.local !== 'off' && secondVisit.session !== 'off',
      detail: `pressed=${secondVisit.pressed} local=${secondVisit.local} session=${secondVisit.session}`,
    },
    {
      check: 'music stays muted on next visit only after muting',
      ok: mutedVisit.pressed === 'false' && mutedVisit.local === 'off',
      detail: `pressed=${mutedVisit.pressed} local=${mutedVisit.local}`,
    },
  ];
}

async function runScenario(browser: Browser, s: Scenario): Promise<Result[]> {
  const context = await browser.newContext(contextFor(s));
  await context.addInitScript(recordEntrance);
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  await page.goto(url, { waitUntil: 'load' });
  await wait(1800);
  const results = [...(await checkBoot(page, s)), await checkKenBurns(page), ...(await checkOpening(page))];
  results.push(await checkPetals(page));
  results.push(await checkReveal(page, 'first'));
  results.push(await checkReveal(page, 'last'));
  if (s.device === 'desktop') results.push(await checkWheelToFooter(page));
  results.push(...(await checkReload(page)));
  results.push(...(await checkMusicReload(page)));
  results.push({ check: 'no console errors', ok: errors.length === 0, detail: errors.join(' | ').slice(0, 200) || 'none' });
  await context.close();
  return results;
}

/** What this machine's OS asks for, as Chromium reads it with emulation switched off. */
async function osPreference(browser: Browser): Promise<string> {
  const context = await browser.newContext({ reducedMotion: null });
  const page = await context.newPage();
  const reduce = await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  await context.close();
  return reduce ? 'reduce' : 'no-preference';
}

/** A missing engine fails its scenarios (with the install hint) instead of skipping them quietly. */
async function launch(name: EngineName): Promise<Browser | string> {
  try {
    return await (name === 'chromium' ? chromium : webkit).launch();
  } catch (error) {
    return `${String(error).split('\n')[0]} (bunx playwright install ${name})`;
  }
}

async function main(): Promise<void> {
  const browsers = { chromium: await launch('chromium'), webkit: await launch('webkit') };
  console.log(`url: ${url}`);
  if (typeof browsers.chromium !== 'string') {
    console.log(`this machine's OS motion preference (Chromium, no emulation): ${await osPreference(browsers.chromium)}`);
  }
  let failed = 0;
  for (const s of SCENARIOS) {
    console.log(`\n## ${s.engine} ${s.device}, prefers-reduced-motion: ${s.motion}`);
    const browser = browsers[s.engine];
    const results = typeof browser === 'string' ? [{ check: 'browser launch', ok: false, detail: browser }] : await runScenario(browser, s);
    for (const r of results) {
      if (!r.ok) failed += 1;
      console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.check}: ${r.detail}`);
    }
  }
  await Promise.all(Object.values(browsers).map((b) => (typeof b === 'string' ? null : b.close())));
  console.log(failed ? `\n${failed} check(s) failed` : '\nall motion checks passed');
  process.exit(failed ? 1 : 0);
}

await main();
