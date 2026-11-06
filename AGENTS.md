# Wedding Lan Thanh: Agent Guidelines

## Overview and Deployment
Single-page wedding invitation for Hoang Lan & Tran Kim Thanh (29.11.2026). Vite 8, TS 7, WebAssembly motion core (no GSAP/Lenis). Pastel pink roses on pearl white light theme, Vietnamese typography, mobile-optimized.
- Public site: https://lanthanh.pages.dev (Cloudflare Pages "lanthanh").
- Guest links: https://lanthanh.pages.dev/moi.html (?to=, ?guest=, ?name=).
- Guest book admin: https://lanthanh.pages.dev/admin.html.
- Backend: https://lanthanh-rsvp.hoanglan9569.workers.dev (Worker with KV).

## Commands
Run repository commands with Bun:
- bun run dev / build / preview: Vite dev (port 5273), build, serve dist/ (port 4173).
- bun run typecheck: Validate types (tsc --noEmit).
- bun run optimize / optimize:art: Photo WebP/LQIP conversion or downscale art.
- bun run shots: Visual regression, layout, diacritic audits.
- bun run check:motion [url]: Motion gate (see QA Gate).
- bun run sync:core: Copy wasm runtime to src/vendor/motion-core.
- bun run perf <oldUrl> <newUrl>: Compare builds with Chrome CDP metrics.
- bun run deploy: Build and deploy to Cloudflare Pages via Wrangler.
- bun run rsvp:list / rsvp:deploy: List KV RSVP keys or deploy Worker.

## Content Locations
- Fixed copy: index.html (static copy, invitations, schedule, footer; couple parents lines removed).
- Dynamic data: src/data/wedding.ts (couple details, addresses, photos, schedule, music).
- Design tokens: src/styles/base.css (:root variables). Pastel pink roses on pearl white: tokens --accent (#8c4459), --accent-2, --rose-mist, --paper-pearl, rose gold --gold and --line-gold (no green).
- Art cutouts: out/auto-warband-art/tools/wedding-rose-cutout.py writes assets-src/art/*.webp and rose icons.

## Animation Architecture
- WebAssembly computes tweens, scroll tracks, smooth scroll, tilt damping, countdown, petal rain.
- Source of truth: repos/wasm-motion-core (Rust + TS). Never edit src/vendor/motion-core directly; update upstream, build, sync:core.
- Modules: reveal.ts, tracks.ts, scroll.ts, hero.ts, intro.ts, decor.ts, countdown.ts, petals.ts.
- Core gate: Animations start after loadCore in src/main.ts. Without core, html.no-motion reveals all; never hide initial states in CSS alone.
- Ken Burns zoom: CSS keyframe animation, not a tween (keeps frame loop idle).

## Constraints
- Stylesheets: Under 500 lines each. Split before exceeding.
- Cascade order in src/main.ts: base.css, components.css, intro.css, lightbox.css, sections.css, sections-couple.css, sections-info.css, ornaments.css.

## QA Gate
Run bun run preview (port 4173) and execute bun scripts/shots.ts before submitting:
- Overflow: Exactly 0 px horizontal overflow on desktop (1440x900) and mobile (iPhone 13).
- Errors: Zero console errors and zero uncaught exceptions.
- Reveals: Zero elements remaining faded (opacity < 0.9) after warm-up.
- Contrast: WCAG >= 6:1 against computed backgrounds. ink-3 must stay at or darker than #6d525a on pearl paper (gives 6.8:1; #7a5f67 fails at 5.6:1).
- Diacritics: Canvas metrics report "đủ dấu" for stacked (ế, ồ, ữ, ỗ) and sub-base marks (ặ, ọ) across fonts.
- Motion: bun run check:motion passes on preview and deployed site across desktop/phone, WebKit, reduced motion on/off/OS.

## Pitfalls to Avoid
- Filter flattens preserve-3d: CSS filters on transform-style: preserve-3d collapse 3D context; put drop-shadow on nested pseudo-elements.
- Clip-path flap contrast: Envelope flap needs distinct shading or opening animation appears stationary.
- Cormorant Garamond diacritic loss: Drops acute over ê (ế becomes ê). Headings and display serif must use Playfair Display.
- Serif digit 1 confusion: High-display serif 1 resembles I (29.11.2026 reads 29.II.2026). Numbers, dates, countdowns must use Be Vietnam Pro.
- Smooth scroll limitations: Wheel-driven, desktop-only. Overrides window.scrollTo; warm-up scripts dispatch synthetic wheel events and call window.__scroll.disable().
- WebKit smooth scroll: Programmatic scrollTo may stop short in WebKit with CSS scroll-behavior: smooth; test scripts jump with behavior: 'instant'.
- Sealed WebAssembly exports: Instance exports are sealed; Object.assign throws in strict mode. Copy to fresh object; verify dataset.engine === 'wasm'.
- Redundant style writes: Rewriting identical transform/opacity strings triggers style recalculation. Compare before writing.
- Wishes edge cache: GET /wishes is cached for 30s at Cloudflare edge. Admin approvals take up to 30s to appear without cache-busting.
- Watercolor alpha payload: Soft watercolor alpha keeps WebP large; color quality cuts barely shrink files (art total ~653 KB). Intro screen loads only corner-sm (52 KB), seal (27 KB), wreath-sm (51 KB). Scoped high-res assets load under html.is-open.
- Watercolor edge straight cuts: Krea watercolor washes touch frame edges (divider); a horizontal CSS mask fade hides the straight cut. Rose art cutout source is out/auto-warband-art/tools/wedding-rose-cutout.py.
- Song Hy 囍 typography: Render 囍 as CSS text (.hy with rose-gold gradient clipped to text and CJK font stack), never Krea art, because image models paint corrupt hanzi.
- Pearl paper contrast: ink-3 must stay at or darker than #6d525a for the 6:1 contrast gate (gives 6.8:1; #7a5f67 yields 5.6:1 and fails).
- Replaced element inset: inset: 0 never stretches canvas/img; petal canvas needs width/height 100% or JS sizes buffer from wrong 300x150 box.
- OS reduced motion: Owner PC reports prefers-reduced-motion: reduce while Playwright defaults to no-preference. Site ignores it on purpose (scroll.ts); pass reducedMotion: null.
- Restored scroll on refresh: Keep history.scrollRestoration = 'manual' and scroll to top while #intro exists, or envelope fades onto scrolled page.
- Overlay reveals: prepareReveals() hides elements at boot; armReveals('hero'|'rest') arms them later. Never hide at arming time.
