# Wedding Lan Thanh: Agent Guidelines

## Overview and Deployment
Hoang Lan & Tran Kim Thanh (29.11.2026) invitation. Vite 8, TS 7, WASM motion core (no GSAP/Lenis). Pastel pink roses on pearl white, Vietnamese typography, mobile.
- Public: https://lanthanh.pages.dev (Cloudflare Pages), admin.html, Worker backend lanthanh-rsvp.hoanglan9569.workers.dev (KV).
- Guest links: https://lanthanh.pages.dev/moi.html (?to=, ?guest=, ?name=). Vite entry (moi.html + src/moi/), localStorage list; gate `bun run check:moi [url]`.
- Link previews: functions/_middleware.ts sets og:url, canonical, description; Messenger opens og:url. Names: src/modules/guest-name.ts. Clear cache: Sharing Debugger 'Scrape Again'.

## Commands
Run with Bun:
- dev / build / preview: Vite dev (5273), build, preview dist/ (4173).
- typecheck / optimize / optimize:art: Types; WebP/LQIP or downscale art.
- shots / check:motion [url]: Visual regression, motion gate.
- sync:core / perf <old> <new>: Copy wasm runtime to src/vendor/motion-core; compare builds.
- deploy / rsvp:list / rsvp:deploy: Pages via Wrangler; KV RSVP keys, Worker.

## Content Locations
- Fixed copy: index.html (invitations, schedule, footer). Pair shows role and name; card keeps parents, Ut Nam / Truong Nu.
- Dynamic data: src/data/wedding.ts (couple, addresses, photos, schedule, music).
- Design tokens: src/styles/base.css (:root). Palette: --accent (#8c4459), --accent-2, --rose-mist, --paper-pearl, rose gold --gold, --line-gold (no green).
- Art cutouts: out/auto-warband-art/tools/wedding-rose-cutout.py writes assets-src/art/*.webp, icons.

## Animation Architecture
- WASM computes tweens, scroll tracks, smooth scroll, tilt damping, countdown, petal rain.
- Source: repos/wasm-motion-core (Rust + TS). Never edit src/vendor/motion-core; sync:core.
- Modules: reveal.ts, tracks.ts, scroll.ts, hero.ts, intro.ts, decor.ts, countdown.ts, petals.ts.
- Core gate: Start after loadCore in src/main.ts; without core, html.no-motion reveals all (never hide initial in CSS).
- Ken Burns zoom: CSS keyframe animation, not a tween (keeps loop idle).

## Constraints
- Stylesheets: Under 500 lines each. Split before exceeding.
- Cascade in src/main.ts: base.css, components.css, intro.css, lightbox.css, sections.css, sections-couple.css, sections-info.css, ornaments.css.

## QA Gate
Run bun run preview (4173) and bun scripts/shots.ts:
- Overflow: 0 px horizontal on desktop (1440x900) and mobile (iPhone 13).
- Errors / reveals: 0 console errors/exceptions, 0 elements faded (< 0.9) after warm-up.
- Contrast: WCAG >= 6:1. ink-3 <= #6d525a on pearl paper (fails at #7a5f67).
- Diacritics: Canvas metrics report "đủ dấu" for stacked and sub-base marks.
- Motion: bun run check:motion passes on preview and live (desktop/mobile, WebKit, reduced motion); wheel reaches footer.

## Pitfalls to Avoid
- Filter flattens preserve-3d: CSS filters on transform-style: preserve-3d collapse 3D; put drop-shadow on pseudo-elements.
- Clip-path flap contrast: Flap needs distinct shading or opening animation appears stationary.
- Cormorant Garamond diacritic loss: Drops acute over ê (ế -> ê); headings/serif must use Playfair Display.
- Serif digit 1 confusion: Serif 1 resembles I (29.11 -> 29.II); numbers, dates, countdowns use Be Vietnam Pro.
- Smooth scroll: Wheel-driven, desktop-only; overrides window.scrollTo. Warm-up dispatches wheel and calls window.__scroll.disable(). ResizeObserver on body clamps wheel target; never use re-measure event lists.
- WebKit smooth scroll: scrollTo stops short in WebKit with scroll-behavior: smooth; tests jump with behavior: 'instant'.
- Redundant style writes: Rewriting identical transform/opacity triggers recalculation. Compare before writing.
- Wishes edge cache: GET /wishes cached 30s at edge; admin approvals take up to 30s without cache bust.
- Watercolor alpha: Soft alpha keeps WebP large; intro loads corner-sm, seal, wreath-sm; high-res under html.is-open.
- Watercolor straight cuts: Frame washes need horizontal CSS mask fade to hide straight cuts.
- Cultural symbols: Owner rejected 囍; never add Chinese characters or cultural symbols. Pair shows '&'; card shows 'L&T'.
- Replaced element inset: inset: 0 never stretches canvas/img; petal canvas needs width/height 100% or buffer uses default 300x150 box.
- OS reduced motion: Owner PC reports prefers-reduced-motion; site ignores it deliberately (scroll.ts). Probes pass reducedMotion: null.
- Restored scroll on refresh: history.scrollRestoration = 'manual' and scroll to top while #intro exists, or envelope fades on scrolled page.
- Sealed wasm exports: Object.assign on instance exports throws; copy to fresh object, check dataset.engine === 'wasm'.
- Overlay reveals: prepareReveals() hides at boot, armReveals() arms later; never hide when arming.
- Cutout trim: trim on strong alpha (> 0.5) or motif sits off-axis; check with out/wedding-rose/centre-shot.ts.
- Music mute persistence: Persist mute to storage only on explicit user click, never in audio.play().catch(...) autoplay rejection handlers.
- Autoplay interaction preservation: Never disable or gate user interaction paths (wheel/touchmove) to work around autoplay; unlock <audio> silently on gestures and keep wheel/touchmove opening intact.
- Intro overlay swipe gesture: Without touch-action: none on a fixed fullscreen intro overlay, mobile browsers treat swipe as native scroll/overscroll and fire touchcancel instead of touchend.
- Mobile background audio pause: When a mobile tab goes to background, OS pauses <audio> directly; visibilitychange and pageshow must call startMusic() when audio.paused is true, never return early.
- Audio unlock on touch: audio.play() on touchscreen pointerdown fires before activation and sets audio.paused = false before rejecting, making !audio.paused guards skip touchend/click.
- Hidden attribute display override: display: grid/flex overrides browser [hidden] rule unless [hidden] { display: none !important; } is in reset.
