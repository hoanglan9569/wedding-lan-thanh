import { defineConfig } from 'vite';

// Base path is deploy-target dependent:
//   Cloudflare Pages / custom domain -> '/'
//   GitHub Pages project site        -> '/wedding-lan-thanh/'
const base = process.env.VITE_BASE ?? '/';

export default defineConfig({
  base,
  build: {
    target: 'es2022',
    cssTarget: 'safari16',
    assetsInlineLimit: 2048,
    chunkSizeWarningLimit: 700,
    rolldownOptions: {
      // moi.html: public guest-link generator, shares fonts and name cleaning with the invitation.
      input: { main: 'index.html', moi: 'moi.html' },
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5273,
  },
});
