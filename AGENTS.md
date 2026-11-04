# Wedding Lan Thanh: Agent Guidelines

## Overview and Deployment
This repository contains the online wedding invitation for Hoang Lan and Tran Kim Thanh (29.11.2026). The site is a single-page application built with Vite 8, TypeScript 7, GSAP 3.15, and self-hosted fonts. It supports Vietnamese typography exclusively, enforces a light-theme aesthetic, and is optimized for mobile responsiveness.
- Public site: https://lanthanh.pages.dev (Cloudflare Pages project "lanthanh").
- Guest link generator: https://lanthanh.pages.dev/moi.html (accepts ?to=, ?guest=, ?khach=, ?name=).
- Guest book moderation portal: https://lanthanh.pages.dev/admin.html.
- Backend API: https://lanthanh-rsvp.hoanglan9569.workers.dev (Cloudflare Worker "lanthanh-rsvp" with Cloudflare KV).

## Commands
Run all repository commands with Bun:
- bun run dev: Start the Vite local development server at http://127.0.0.1:5273.
- bun run build: Compile TypeScript and build the production distribution into dist/.
- bun run preview: Serve the built dist/ bundle locally at http://127.0.0.1:4173.
- bun run typecheck: Validate TypeScript types without emitting files (tsc --noEmit).
- bun run optimize: Process raw high-resolution photography into multi-size WebP images and LQIP placeholders.
- bun run optimize:art: Downscale transparent watercolor assets from assets-src/art/ to display sizes in public/art/.
- bun run shots: Execute Playwright visual regression, layout measurements, and diacritic audits.
- bun run deploy: Build the site and deploy dist/ to Cloudflare Pages via Wrangler.
- bun run rsvp:list: List stored RSVP submission keys from Cloudflare KV.
- bun run rsvp:deploy: Deploy Cloudflare Worker script and configuration from worker/.

## Content Locations
- Fixed copy: index.html contains static Vietnamese copy, invitations, ceremony times, and footer text.
- Dynamic data: src/data/wedding.ts holds structured data, couple details, addresses, photo lists, schedule entries, and music paths.
- Design tokens: src/styles/base.css defines CSS variables in :root (color palettes, spacing, typography scales, shadows).

## Architecture and Style Constraints
- File length limit: Every stylesheet must stay strictly under 500 lines of code. Split stylesheets into modular files before reaching this threshold (for example sections.css, sections-couple.css, sections-info.css).
- Import cascade order: Stylesheet import order in src/main.ts is significant and must not be altered:
  1. src/styles/base.css
  2. src/styles/components.css
  3. src/styles/intro.css
  4. src/styles/lightbox.css
  5. src/styles/sections.css
  6. src/styles/sections-couple.css
  7. src/styles/sections-info.css
  8. src/styles/ornaments.css

## QA Gate
Before submitting changes, run bun run preview on port 4173 and execute bun scripts/shots.ts. The test suite must pass with all criteria satisfied:
- Horizontal overflow: Must report exactly 0 px overflow across both desktop (1440x900) and mobile (iPhone 13).
- Console errors: Zero console errors and zero uncaught page exceptions.
- Reveal animation check: Zero elements remaining faded (opacity < 0.9) after page warm-up.
- Contrast ratio: WCAG contrast ratio for all text elements must measure at or above 6:1 against computed background colors.
- Diacritic verification: Canvas ascent and descent measurements must output "đủ dấu" across Playfair Display, Be Vietnam Pro, and Dancing Script for stacked tone marks (ế, ồ, ữ, ỗ) and sub-base marks (ặ, ọ).

## Pitfalls to Avoid
- Filter flattens preserve-3d: Adding a CSS filter (such as drop-shadow or blur) to any container with transform-style: preserve-3d collapses the 3D rendering context. Place drop-shadow styling on nested pseudo-elements instead.
- Clip-path flap requires distinct tone: An envelope flap created with clip-path that shares the identical background color of the envelope body appears stationary during opening animations. The flap shape must use a distinct shading tone.
- Cormorant Garamond diacritic loss: Cormorant Garamond drops the acute mark over the letter ê in Vietnamese (causing ế to render erroneously as ê). Headings and display serif text must use Playfair Display.
- Serif digit 1 confusion: High-display serif numbers resemble letters (specifically, digit 1 reads as capital I, turning 29 . 11 . 2026 into 29 . II . 2026). Dates, times, countdowns, and schedule numbers must always be styled with Be Vietnam Pro.
- Lenis smooth scrolling limitations: Lenis is restricted to desktop pointer devices and must remain disabled on mobile devices. Because Lenis overrides programmatic window.scrollTo calls, automated warm-up scripts must dispatch synthetic wheel events.
- Edge cache on guest wishes: GET /wishes returns cache-control: max-age=30 at the Cloudflare edge. Approvals submitted via /admin.html take up to 30 seconds to reflect on the public wall unless cache-busting queries are used.
- Deferred ornament loading: High-resolution watercolor decorations in src/styles/ornaments.css must only load after envelope opening (scoped under html.is-open) to maintain initial payload transfer under 630 KB.
