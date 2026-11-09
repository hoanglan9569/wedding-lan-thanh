# Wedding Lan Thanh: Agent Guidelines

## Overview and Deployment
Hoang Lan & Tran Kim Thanh (29.11.2026) invitation. Vite 8, TS 7, WebAssembly motion core (no GSAP/Lenis). Pastel pink roses on pearl white, Vietnamese typography, mobile.
- Public: https://lanthanh.pages.dev (Cloudflare Pages), guest book admin.html, Worker backend lanthanh-rsvp.hoanglan9569.workers.dev (KV).
- Guest links: https://lanthanh.pages.dev/moi.html (?to=, ?guest=, ?name=). Vite entry (moi.html + src/moi/), list in localStorage; gate `bun run check:moi [url]`.
- Link previews: functions/_middleware.ts sets og:url, canonical, description per guest link; Messenger opens og:url. Names: DOM-free src/modules/guest-name.ts. Clear cache via Sharing Debugger 'Scrape Again'.

## Commands
Run with Bun:
- dev / build / preview: Vite dev (5273), build, preview dist/ (4173).
- typecheck / optimize / optimize:art: Validate types; WebP/LQIP conversion or downscale art.
- shots / check:motion [url]: Visual regression and motion gate.
- sync:core / perf <old> <new>: Copy wasm runtime to src/vendor/motion-core; compare builds via CDP.
- deploy / rsvp:list / rsvp:deploy: Cloudflare Pages via Wrangler; KV RSVP keys and Worker.

## Content Locations
- Fixed copy: index.html (invitations, schedule, footer). Pair section shows role and name; card keeps parents and Ut Nam / Truong Nu.
- Dynamic data: src/data/wedding.ts (couple, addresses, photos, schedule, music).
- Design tokens: src/styles/base.css (:root). Palette: --accent (#8c4459), --accent-2, --rose-mist, --paper-pearl, rose gold --gold, --line-gold (no green).
- Art cutouts: out/auto-warband-art/tools/wedding-rose-cutout.py writes assets-src/art/*.webp, icons.

## Animation Architecture
- WebAssembly computes tweens, scroll tracks, smooth scroll, tilt damping, countdown, petal rain.
- Source: repos/wasm-motion-core (Rust + TS). Never edit src/vendor/motion-core; update upstream, build, sync:core.
- Modules: reveal.ts, tracks.ts, scroll.ts, hero.ts, intro.ts, decor.ts, countdown.ts, petals.ts.
- Core gate: Start after loadCore in src/main.ts; without core, html.no-motion reveals all (never hide initial states in CSS).
- Ken Burns zoom: CSS keyframe animation, not a tween (keeps frame loop idle).

## Constraints
- Stylesheets: Under 500 lines each. Split before exceeding.
- Cascade in src/main.ts: base.css, components.css, intro.css, lightbox.css, sections.css, sections-couple.css, sections-info.css, ornaments.css.

## QA Gate
Run bun run preview (4173) and bun scripts/shots.ts before submitting:
- Overflow: 0 px horizontal overflow on desktop (1440x900) and mobile (iPhone 13).
- Errors and reveals: 0 console errors, 0 uncaught exceptions, 0 elements faded (opacity < 0.9) after warm-up.
- Contrast: WCAG >= 6:1. ink-3 must stay at or darker than #6d525a on pearl paper (6.8:1; #7a5f67 fails at 5.6:1).
- Diacritics: Canvas metrics report "đủ dấu" for stacked (ế, ồ, ữ, ỗ) and sub-base (ặ, ọ) marks across fonts.
- Motion: bun run check:motion passes on preview and deployed site across desktop/phone, WebKit, reduced motion on/off/OS; includes wheel reaching footer on desktop.

## Pitfalls to Avoid
- Filter flattens preserve-3d: CSS filters on transform-style: preserve-3d collapse 3D context; put drop-shadow on nested pseudo-elements.
- Clip-path flap contrast: Flap needs distinct shading or opening animation appears stationary.
- Cormorant Garamond diacritic loss: Drops acute over ê (ế becomes ê). Headings and display serif must use Playfair Display.
- Serif digit 1 confusion: Display serif 1 resembles I (29.11.2026 reads 29.II.2026). Numbers, dates, countdowns use Be Vietnam Pro.
- Smooth scroll: Wheel-driven, desktop-only; overrides window.scrollTo. Warm-up dispatches wheel events and calls window.__scroll.disable(). ResizeObserver on body in src/modules/scroll.ts clamps wheel target to bottom; never use re-measure event lists.
- WebKit smooth scroll: Programmatic scrollTo may stop short in WebKit with scroll-behavior: smooth; tests jump with behavior: 'instant'.
- Redundant style writes: Rewriting identical transform/opacity triggers recalculation. Compare before writing.
- Wishes edge cache: GET /wishes cached 30s at edge; admin approvals take up to 30s without cache-busting.
- Watercolor alpha: Soft alpha keeps WebP large; quality cuts barely shrink files. Intro loads corner-sm, seal, wreath-sm; high-res under html.is-open.
- Watercolor edge straight cuts: Frame washes need horizontal CSS mask fade to hide straight cuts.
- Cultural symbols: Owner rejected Chinese character 囍; never add Chinese characters or unrequested cultural symbols. Pair section shows '&' in rose wreath; card top shows 'L&T' in wreath.
- Replaced element inset: inset: 0 never stretches canvas/img; petal canvas needs width/height 100% or JS sizes buffer from wrong 300x150 box.
- OS reduced motion: Owner PC reports prefers-reduced-motion: reduce; site ignores it on purpose (scroll.ts). Probes pass reducedMotion: null.
- Restored scroll on refresh: Keep history.scrollRestoration = 'manual' and scroll to top while #intro exists, or envelope fades on scrolled page.
- Sealed wasm exports: Object.assign on instance exports throws; copy to fresh object, check dataset.engine === 'wasm'.
- Overlay reveals: prepareReveals() hides at boot, armReveals('hero'|'rest') arms later; never hide when arming.
- Cutout trim: trim on strong alpha (> 0.5) or motif sits off-axis; check with out/wedding-rose/centre-shot.ts.
- Music mute persistence: Calling a helper that writes 'off' to storage inside audio.play().catch(...) turns browser autoplay rejection (wheel/touchmove opening or delayed timer) into a permanent mute flag; persist mute only on explicit user click.
- WebKit audio gesture token: Calling audio.play() 3.28s after a tap inside a requestAnimationFrame callback loses the mobile WebKit user gesture token; trigger startMusic() synchronously inside the opening gesture handler.
