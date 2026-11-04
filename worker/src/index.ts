export interface Env {
  RSVP: KVNamespace;
}

function isAllowedOrigin(origin: string): boolean {
  if (
    origin === 'https://lanthanh.pages.dev' ||
    origin === 'http://127.0.0.1:4173' ||
    origin === 'http://127.0.0.1:5273'
  ) {
    return true;
  }
  return /^https:\/\/[a-zA-Z0-9.-]+\.lanthanh\.pages\.dev$/.test(origin);
}

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && isAllowedOrigin(origin) ? origin : 'https://lanthanh.pages.dev';
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

async function handlePost(request: Request, env: Env, cors: Record<string, string>): Promise<Response> {
  const buf = await request.arrayBuffer();
  if (buf.byteLength > 4000) {
    return new Response('Payload Too Large', { status: 413, headers: cors });
  }

  let data: Record<string, unknown>;
  try {
    data = JSON.parse(new TextDecoder().decode(buf));
  } catch {
    return new Response('Invalid JSON', { status: 400, headers: cors });
  }

  const name = String(data.name ?? '').trim().slice(0, 120);
  if (!name) {
    return new Response('Name is required', { status: 400, headers: cors });
  }

  const wish = String(data.wish ?? '').trim().slice(0, 600);
  const side = String(data.side ?? '').trim().slice(0, 20);
  const attend = String(data.attend ?? '').trim().slice(0, 20);
  const parsedGuests = parseInt(String(data.guests ?? '1'), 10);
  const guests = Math.max(1, Math.min(20, Number.isNaN(parsedGuests) ? 1 : parsedGuests));
  const at = typeof data.at === 'string' && data.at ? data.at.trim().slice(0, 50) : new Date().toISOString();
  const ip = (request.headers.get('cf-connecting-ip') ?? '').slice(0, 80);
  const ua = (request.headers.get('user-agent') ?? '').slice(0, 80);

  const rand = crypto.randomUUID().replace(/-/g, '').slice(0, 6);
  const key = `reply:${new Date().toISOString()}:${rand}`;
  const record = { name, side, attend, guests, wish, at, ip, ua };
  await env.RSVP.put(key, JSON.stringify(record));

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin');
    const cors = getCorsHeaders(origin);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    const { pathname } = new URL(request.url);
    if (request.method === 'GET' && pathname === '/') {
      return new Response('lanthanh rsvp ok', {
        status: 200,
        headers: { ...cors, 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    if (request.method === 'POST' && (pathname === '/' || pathname === '/rsvp')) {
      return handlePost(request, env, cors);
    }

    return new Response('Not Found', { status: 404, headers: cors });
  },
};
