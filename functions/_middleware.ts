/**
 * Guest link previews: Messenger and Zalo open the card's og:url, so a guest link
 * (/?to=Name) must carry its own og:url and canonical, not the homepage.
 * Runs on Cloudflare Pages in front of static files (functions/_middleware.ts).
 */
import { cleanGuestName } from '../src/modules/guest-name';

const KEYS = ['to', 'guest', 'khach', 'name'];
const HTML_PATHS = new Set(['/', '/index.html']);

interface Context {
  request: Request;
  next: () => Promise<Response>;
}

export function guestFromUrl(url: URL): string | null {
  for (const key of KEYS) {
    const raw = url.searchParams.get(key);
    if (raw && cleanGuestName(raw)) return cleanGuestName(raw);
  }
  return null;
}

/** The guest's own link, normalised to ?to= so every alias shares one preview. */
export function guestUrl(url: URL, name: string): string {
  const out = new URL('/', url.origin);
  out.searchParams.set('to', name);
  return out.toString();
}

function setContent(value: string) {
  return { element: (el: HTMLRewriterElement) => void el.setAttribute('content', value) };
}

export async function onRequest({ request, next }: Context): Promise<Response> {
  const response = await next();
  const url = new URL(request.url);
  if (request.method !== 'GET' || !HTML_PATHS.has(url.pathname)) return response;
  if (!response.headers.get('content-type')?.includes('text/html')) return response;
  const name = guestFromUrl(url);
  if (!name) return response;
  const link = guestUrl(url, name);
  const description = `Trân trọng kính mời ${name} đến chung vui cùng gia đình chúng tôi.`;
  return new HTMLRewriter()
    .on('link[rel="canonical"]', { element: (el) => void el.setAttribute('href', link) })
    .on('meta[property="og:url"]', setContent(link))
    .on('meta[property="og:description"]', setContent(description))
    .on('meta[name="twitter:description"]', setContent(description))
    .transform(response);
}
