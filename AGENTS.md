# Wedding Lan Thanh: Agent Guidelines

## Overview and Deployment
Single-page online wedding invitation for Hoang Lan & Tran Kim Thanh (29.11.2026). Built with Vite 8, TypeScript 7, self-hosted fonts, and WebAssembly motion core (no GSAP, no Lenis: removed 2026-11-05). Light theme, Vietnamese typography only, mobile-optimized.
- Public site: https://lanthanh.pages.dev (Cloudflare Pages "lanthanh").
- Guest link generator: https://lanthanh.pages.dev/moi.html (?to=, ?guest=, ?khach=, ?name=).
- Guest book admin: https://lanthanh.pages.dev/admin.html.
- Backend API: https://lanthanh-rsvp.hoanglan9569.workers.dev (Worker "lanthanh-rsvp" with KV).

## Commands
Run all repository commands with Bun:
- bun run dev: Vite dev server at http://127.0.0.1:5273.
- bun run build: Compile TS and build production bundle into dist/.
- bun run preview: Serve dist/ bundle locally at http://127.0.0.1:4173.
- bun run typecheck: Validate types without emitting files (tsc --noEmit).
- bun run optimize: Process photography into multi-size WebP and LQIP placeholders.
- bun run optimize:art: Downscale watercolor assets from assets-src/art/ to public/art/.
- bun run shots: Playwright visual regression, layout measurements, and diacritic audits.
- bun run sync:core: Copy wasm core from ../wasm-motion-core/runtime into src/vendor/motion-core (run after core changes; vendored files are committed).
- bun run perf <oldUrl> <newUrl>: Compare builds with Chrome CDP metrics.
- bun run deploy: Build site and deploy dist/ to Cloudflare Pages via Wrangler.
- bun run rsvp:list: List stored RSVP keys from Cloudflare KV.
- bun run rsvp:deploy: Deploy Worker script and config from worker/.

## Content Locations
- Fixed copy: index.html (static Vietnamese copy, invitations, ceremony times, footer).
- Dynamic data: src/data/wedding.ts (couple details, addresses, photos, schedule, music).
- Design tokens: src/styles/base.css (:root CSS variables for colors, spacing, typography).

## Animation Architecture
- Animated values computed in WebAssembly: tweens, scroll tracks and scrub damping, smooth scroll, card tilt damping, countdown split, petal rain (ready canvas matrices in device pixels).
- Source of truth: repos/wasm-motion-core (Rust crate + TS runtime). Never edit src/vendor/motion-core by hand; change upstream, build there, then bun run sync:core here.
- Animation modules: reveal.ts (reveals, character splitter), tracks.ts (scroll-driven values), scroll.ts (wheel smooth scroll, lock, anchors), hero.ts, intro.ts, decor.ts, countdown.ts, petals.ts.
- Animations start after loadCore resolves in src/main.ts. Without core, html.no-motion is added and shows everything; never hide initial states via CSS alone.
- Ken Burns hero zoom is a CSS keyframe animation, not a tween (keeps frame loop idle).

## Constraints
- Stylesheet limit: Every stylesheet must stay under 500 lines. Split before exceeding.
- Import cascade order in src/main.ts is strict:
  1. src/styles/base.css
  2. src/styles/components.css
  3. src/styles/intro.css
  4. src/styles/lightbox.css
  5. src/styles/sections.css
  6. src/styles/sections-couple.css
  7. src/styles/sections-info.css
  8. src/styles/ornaments.css

## QA Gate
Run bun run preview on port 4173 and execute bun scripts/shots.ts before submitting. Criteria:
- Overflow: Exactly 0 px horizontal overflow on desktop (1440x900) and mobile (iPhone 13).
- Errors: Zero console errors and zero uncaught exceptions.
- Reveals: Zero elements remaining faded (opacity < 0.9) after warm-up.
- Contrast: WCAG contrast ratio >= 6:1 against computed background colors.
- Diacritics: Canvas text metrics output "đủ dấu" across Playfair Display, Be Vietnam Pro, and Dancing Script for stacked (ế, ồ, ữ, ỗ) and sub-base marks (ặ, ọ).

## Pitfalls to Avoid
- Filter flattens preserve-3d: CSS filters (drop-shadow, blur) on transform-style: preserve-3d collapse 3D context. Place drop-shadow on nested pseudo-elements.
- Clip-path flap contrast: Envelope flap needs distinct shading from envelope body or opening animation appears stationary.
- Cormorant Garamond diacritic loss: Drops acute over ê (ế renders as ê). Headings and display serif must use Playfair Display.
- Serif digit 1 confusion: High-display serif digit 1 resembles capital I (29.11.2026 reads as 29.II.2026). Numbers, dates, countdowns must use Be Vietnam Pro.
- Smooth scroll limitations: Wheel-driven and desktop-only (disabled for coarse pointers / reduced motion). Overrides window.scrollTo; warm-up scripts must dispatch synthetic wheel events and call window.__scroll.disable() before screenshot stitching.
- Sealed WebAssembly exports: Instance exports are sealed; Object.assign throws in strict mode and animations silently fail. Copy to a fresh object and check document.documentElement.dataset.engine === 'wasm' after core changes (QA gate passes either way).
- Redundant style writes: Re-writing identical transform/opacity strings still triggers style recalculation. Runtime compares before writing; preserve this when adding properties.
- Wishes edge cache: GET /wishes is cached for 30s at Cloudflare edge. Admin approvals take up to 30s to appear publicly without cache-busting.
- Deferred ornament loading: High-res watercolor assets in src/styles/ornaments.css must only load after opening (scoped under html.is-open) to keep initial transfer under 630 KB.
- Replaced element inset: `inset: 0` never stretches a replaced element (canvas/img/video/iframe); the petal canvas needs width/height 100% or it stays 300x150 and the JS sizes its buffer from the wrong box.
- Time-sampled animation verification: verifying an animation by its end state proves nothing: sample the value over time (out/check-wedding.ts style probes).
- Overlay reveal timing: an IntersectionObserver ignores a covering overlay, so reveals outside .hero are armed on the intro:done event, not at boot.
