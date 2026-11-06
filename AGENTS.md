# Wedding Lan Thanh: Agent Guidelines

## Overview and Deployment
Wedding invitation for Hoang Lan & Tran Kim Thanh (29.11.2026). Vite 8, TS 7, WebAssembly motion core (no GSAP/Lenis). Pastel pink roses on pearl white, Vietnamese typography, mobile.
- Public: https://lanthanh.pages.dev (Cloudflare Pages).
- Guest links: https://lanthanh.pages.dev/moi.html (?to=, ?guest=, ?name=). Public, a Vite entry (moi.html + src/moi/, rolldownOptions.input), list saved in localStorage; gate `bun run check:moi [url]`.
- Guest book: https://lanthanh.pages.dev/admin.html.
- Backend: https://lanthanh-rsvp.hoanglan9569.workers.dev (Worker + KV).

## Commands
Run with Bun:
- bun run dev / build / preview: Vite dev (5273), build, preview dist/ (4173).
- bun run typecheck: Validate types (tsc --noEmit).
- bun run optimize / optimize:art: WebP/LQIP conversion or downscale art.
- bun run shots: Visual regression, layout, diacritics.
- bun run check:motion [url]: Motion gate.
- bun run sync:core: Copy wasm runtime to src/vendor/motion-core.
- bun run perf <old> <new>: Compare builds via Chrome CDP.
- bun run deploy: Deploy Cloudflare Pages via Wrangler.
- bun run rsvp:list / rsvp:deploy: List KV RSVP keys or deploy Worker.

## Content Locations
- Fixed copy: index.html (static copy, invitations, schedule, footer). Pair section shows only role and name (no parents, no Ut Nam / Truong Nu); card keeps parents and Ut Nam / Truong Nu.
- Dynamic data: src/data/wedding.ts (couple, addresses, photos, schedule, music).
- Design tokens: src/styles/base.css (:root). Palette: --accent (#8c4459), --accent-2, --rose-mist, --paper-pearl, rose gold --gold, --line-gold (no green).
- Art cutouts: out/auto-warband-art/tools/wedding-rose-cutout.py writes assets-src/art/*.webp, icons.

## Animation Architecture
- WebAssembly computes tweens, scroll tracks, smooth scroll, tilt damping, countdown, petal rain.
- Source: repos/wasm-motion-core (Rust + TS). Never edit src/vendor/motion-core; update upstream, build, sync:core.
- Modules: reveal.ts, tracks.ts, scroll.ts, hero.ts, intro.ts, decor.ts, countdown.ts, petals.ts.
- Core gate: Animations start after loadCore in src/main.ts. Without core, html.no-motion reveals all; never hide initial states in CSS.
- Ken Burns zoom: CSS keyframe animation, not a tween (keeps frame loop idle).

## Constraints
- Stylesheets: Under 500 lines each. Split before exceeding.
- Cascade in src/main.ts: base.css, components.css, intro.css, lightbox.css, sections.css, sections-couple.css, sections-info.css, ornaments.css.

## QA Gate
Run bun run preview (port 4173) and bun scripts/shots.ts before submitting:
- Overflow: 0 px horizontal overflow on desktop (1440x900), mobile (iPhone 13).
- Errors: 0 console errors, 0 uncaught exceptions.
- Reveals: 0 elements faded (opacity < 0.9) after warm-up.
- Contrast: WCAG >= 6:1 on computed backgrounds. ink-3 must stay at or darker than #6d525a on pearl paper (6.8:1; #7a5f67 fails at 5.6:1).
- Diacritics: Canvas metrics report "đủ dấu" for stacked (ế, ồ, ữ, ỗ) and sub-base (ặ, ọ) marks across fonts.
- Motion: bun run check:motion passes on preview and deployed site across desktop/phone, WebKit, reduced motion on/off/OS; includes "mouse wheel reaches the footer" on desktop, because programmatic scrollTo bypasses the wheel path.

## Pitfalls to Avoid
- Filter flattens preserve-3d: CSS filters on transform-style: preserve-3d collapse 3D context; put drop-shadow on nested pseudo-elements.
- Clip-path flap contrast: Flap needs distinct shading or opening animation appears stationary.
- Cormorant Garamond diacritic loss: Drops acute over ê (ế becomes ê). Headings and display serif must use Playfair Display.
- Serif digit 1 confusion: Display serif 1 resembles I (29.11.2026 reads 29.II.2026). Numbers, dates, countdowns use Be Vietnam Pro.
- Smooth scroll: Wheel-driven, desktop-only; overrides window.scrollTo. Warm-up scripts dispatch wheel events and call window.__scroll.disable(). The wheel target is clamped to a measured page bottom; a ResizeObserver on document.body in src/modules/scroll.ts re-measures it whenever the page height changes. Never replace it with a list of re-measure events (a stale bottom stranded guests at the guest book).
- WebKit smooth scroll: Programmatic scrollTo may stop short in WebKit with scroll-behavior: smooth; tests jump with behavior: 'instant'.
- Sealed WebAssembly exports: Instance exports are sealed; Object.assign throws in strict mode. Copy to fresh object; verify dataset.engine === 'wasm'.
- Redundant style writes: Rewriting identical transform/opacity triggers recalculation. Compare before writing.
- Wishes edge cache: GET /wishes cached 30s at edge; admin approvals take up to 30s without cache-busting.
- Watercolor alpha payload: Soft alpha keeps WebP large; quality cuts barely shrink files (art ~653 KB). Intro loads corner-sm (52 KB), seal (27 KB), wreath-sm (51 KB); high-res under html.is-open.
- Watercolor edge straight cuts: Frame washes need horizontal CSS mask fade to hide straight cuts. Cutout source: out/auto-warband-art/tools/wedding-rose-cutout.py.
- Cutout trim alpha: Trim must use strong alpha (> 0.5); faint watercolor stains at frame edge leave an empty strip and the centred motif sits off-axis; measure centring with out/wedding-rose/centre-shot.ts.
- Owner decision on cultural symbols: Owner rejected Chinese character 囍; never add Chinese characters or other unrequested cultural symbols. Pair section shows script '&' in rose wreath; card top shows 'L&T' monogram in wreath.
- Replaced element inset: inset: 0 never stretches canvas/img; petal canvas needs width/height 100% or JS sizes buffer from wrong 300x150 box.
- OS reduced motion: Owner PC reports prefers-reduced-motion: reduce; site ignores it on purpose (scroll.ts). Probes pass reducedMotion: null.
- Restored scroll on refresh: Keep history.scrollRestoration = 'manual' and scroll to top while #intro exists, or envelope fades on scrolled page.
- Overlay reveals: prepareReveals() hides elements at boot; armReveals('hero'|'rest') arms them later. Never hide when arming.
