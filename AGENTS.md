# Wedding Lan Thanh: Agent Guidelines

## Overview and Deployment
Single-page online wedding invitation for Hoang Lan & Tran Kim Thanh (29.11.2026). Built with Vite 8, TypeScript 7, self-hosted fonts, and WebAssembly motion core (no GSAP/Lenis). Light theme, Vietnamese typography, mobile-optimized.
- Public site: https://lanthanh.pages.dev (Cloudflare Pages "lanthanh").
- Guest link generator: https://lanthanh.pages.dev/moi.html (?to=, ?guest=, ?khach=, ?name=).
- Guest book admin: https://lanthanh.pages.dev/admin.html.
- Backend API: https://lanthanh-rsvp.hoanglan9569.workers.dev (Worker "lanthanh-rsvp" with KV).

## Commands
Run all repository commands with Bun:
- bun run dev: Vite dev server (port 5273).
- bun run build: Compile TS and build production bundle into dist/.
- bun run preview: Serve dist/ bundle (port 4173).
- bun run typecheck: Validate types (tsc --noEmit).
- bun run optimize: Convert photos to multi-size WebP and LQIP placeholders.
- bun run optimize:art: Downscale watercolor assets to public/art/.
- bun run shots: Visual regression, layout, and diacritic audits.
- bun run check:motion [url]: Motion gate (see QA Gate).
- bun run sync:core: Copy wasm runtime to src/vendor/motion-core (committed).
- bun run perf <oldUrl> <newUrl>: Compare builds with Chrome CDP metrics.
- bun run deploy: Build and deploy to Cloudflare Pages via Wrangler.
- bun run rsvp:list: List stored RSVP keys from Cloudflare KV.
- bun run rsvp:deploy: Deploy Worker script from worker/.

## Content Locations
- Fixed copy: index.html (static Vietnamese copy, invitations, ceremony times, footer).
- Dynamic data: src/data/wedding.ts (couple details, addresses, photos, schedule, music).
- Design tokens: src/styles/base.css (:root CSS variables for colors, spacing, typography).

## Animation Architecture
- Animated values computed in WebAssembly: tweens, scroll tracks, smooth scroll, tilt damping, countdown, petal rain.
- Source of truth: repos/wasm-motion-core (Rust + TS). Never edit src/vendor/motion-core directly; change upstream, build, then bun run sync:core.
- Modules: reveal.ts (reveals, splitter), tracks.ts (scroll tracks), scroll.ts (smooth scroll), hero.ts, intro.ts, decor.ts, countdown.ts, petals.ts.
- Animations start after loadCore resolves in src/main.ts. Without core, html.no-motion is added and shows everything; never hide initial states via CSS alone.
- Ken Burns hero zoom is a CSS keyframe animation, not a tween (keeps frame loop idle).

## Constraints
- Stylesheet limit: Every stylesheet must stay under 500 lines. Split before exceeding.
- Import cascade order in src/main.ts is strict: base.css, components.css, intro.css, lightbox.css, sections.css, sections-couple.css, sections-info.css, ornaments.css (all under src/styles/).

## QA Gate
Run bun run preview on port 4173 and execute bun scripts/shots.ts before submitting. Criteria:
- Overflow: Exactly 0 px horizontal overflow on desktop (1440x900) and mobile (iPhone 13).
- Errors: Zero console errors and zero uncaught exceptions.
- Reveals: Zero elements remaining faded (opacity < 0.9) after warm-up.
- Contrast: WCAG contrast ratio >= 6:1 against computed background colors.
- Diacritics: Canvas text metrics output "đủ dấu" across Playfair Display, Be Vietnam Pro, and Dancing Script for stacked (ế, ồ, ữ, ỗ) and sub-base marks (ặ, ọ).
- Motion: bun run check:motion passes on the preview, then on https://lanthanh.pages.dev after deploy. It samples envelope, petals, Ken Burns, reveals and a reload over time on Chromium desktop/phone and WebKit phone, reduced motion on, off and as the OS reports it.

## Pitfalls to Avoid
- Filter flattens preserve-3d: CSS filters (drop-shadow, blur) on transform-style: preserve-3d collapse 3D context. Place drop-shadow on nested pseudo-elements.
- Clip-path flap contrast: Envelope flap needs distinct shading from envelope body or opening animation appears stationary.
- Cormorant Garamond diacritic loss: Drops acute over ê (ế renders as ê). Headings and display serif must use Playfair Display.
- Serif digit 1 confusion: High-display serif digit 1 resembles capital I (29.11.2026 reads as 29.II.2026). Numbers, dates, countdowns must use Be Vietnam Pro.
- Smooth scroll limitations: Wheel-driven and desktop-only (disabled for coarse pointers). Overrides window.scrollTo; warm-up scripts must dispatch synthetic wheel events and call window.__scroll.disable() before screenshot stitching.
- Sealed WebAssembly exports: Instance exports are sealed; Object.assign throws in strict mode and animations silently fail. Copy to a fresh object and check document.documentElement.dataset.engine === 'wasm' after core changes.
- Redundant style writes: Re-writing identical transform/opacity strings still triggers style recalculation. Runtime compares before writing; preserve this when adding properties.
- Wishes edge cache: GET /wishes is cached for 30s at Cloudflare edge. Admin approvals take up to 30s to appear publicly without cache-busting.
- Deferred ornament loading: High-res watercolor assets in src/styles/ornaments.css must only load after opening (scoped under html.is-open) to keep initial transfer under 630 KB.
- Replaced element inset: `inset: 0` never stretches a replaced element (canvas/img/video/iframe); the petal canvas needs width/height 100% or it stays 300x150 and the JS sizes its buffer from the wrong box.
- OS reduced motion: the owner's PC reports prefers-reduced-motion: reduce (Windows Animation effects off) while Playwright emulates no-preference by default, so earlier probes saw motion he never saw. The site deliberately ignores the preference (comment in scroll.ts); probes of his view pass reducedMotion: null.
- Restored scroll on refresh: keep history.scrollRestoration = 'manual' and the scroll to top while #intro exists, or the envelope fades onto an already-scrolled page.
- Overlay reveal timing: reveals are hidden by prepareReveals() at boot and only armed later by armReveals('hero'|'rest'); never set the hidden state at arming time.
