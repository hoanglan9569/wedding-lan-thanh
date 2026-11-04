export interface Env {
  RSVP: KVNamespace;
}

interface StoredRecord {
  name: string;
  side: string;
  attend: string;
  guests: number;
  wish: string;
  at: string;
  ip: string;
  ua: string;
  status?: 'pending' | 'approved' | 'hidden';
}

function isAllowedOrigin(origin: string): boolean {
  if (
    origin === 'https://lanthanh.pages.dev' ||
    origin === 'http://127.0.0.1:4173' ||
    origin === 'http://127.0.0.1:5273'
  ) return true;
  return /^https:\/\/[a-zA-Z0-9.-]+\.lanthanh\.pages\.dev$/.test(origin);
}

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && isAllowedOrigin(origin) ? origin : 'https://lanthanh.pages.dev';
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
    'Access-Control-Max-Age': '86400',
  };
}

function jsonRes(data: unknown, status = 200, cors: Record<string, string>, extra?: Record<string, string>): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json', ...extra },
  });
}

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hashBuf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function verifyAdminAuth(request: Request, env: Env, cors: Record<string, string>): Promise<Response | null> {
  const ip = (request.headers.get('cf-connecting-ip') ?? 'unknown').slice(0, 80);
  const failKey = `fail:${ip}`;
  const failCount = Number(await env.RSVP.get(failKey)) || 0;
  if (failCount >= 10) return jsonRes({ ok: false, error: 'Too many attempts' }, 429, cors);

  const token = request.headers.get('x-admin-token');
  const rawAuth = await env.RSVP.get('admin:auth');
  let valid = false;
  if (token && rawAuth) {
    try {
      const auth = JSON.parse(rawAuth) as { salt: string; hash: string };
      valid = (await sha256Hex(auth.salt + token)) === auth.hash;
    } catch {
      valid = false;
    }
  }

  if (!valid) {
    await env.RSVP.put(failKey, String(failCount + 1), { expirationTtl: 600 });
    return jsonRes({ ok: false, error: 'sai mat khau' }, 401, cors);
  }
  return null;
}

async function handlePost(request: Request, env: Env, cors: Record<string, string>): Promise<Response> {
  const buf = await request.arrayBuffer();
  if (buf.byteLength > 4000) return new Response('Payload Too Large', { status: 413, headers: cors });

  let data: Record<string, unknown>;
  try {
    data = JSON.parse(new TextDecoder().decode(buf));
  } catch {
    return new Response('Invalid JSON', { status: 400, headers: cors });
  }

  const name = String(data.name ?? '').trim().slice(0, 120);
  if (!name) return new Response('Name is required', { status: 400, headers: cors });

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
  const record: StoredRecord = { name, side, attend, guests, wish, at, ip, ua, status: 'pending' };
  await env.RSVP.put(key, JSON.stringify(record));
  return jsonRes({ ok: true }, 200, cors);
}

async function handleGetWishes(env: Env, cors: Record<string, string>): Promise<Response> {
  const list = await env.RSVP.list({ prefix: 'reply:' });
  const sortedKeys = list.keys.sort((a, b) => b.name.localeCompare(a.name));
  const records = await Promise.all(
    sortedKeys.map(async (k) => {
      const val = await env.RSVP.get<StoredRecord>(k.name, 'json');
      return val ? { id: k.name, ...val } : null;
    })
  );
  const approved = records
    .filter((r): r is StoredRecord & { id: string } => r !== null && r.status === 'approved')
    .map((r) => ({ id: r.id, name: r.name, side: r.side, wish: r.wish, at: r.at }));
  return jsonRes(approved, 200, cors, { 'cache-control': 'public, max-age=30' });
}

async function handleAdminState(env: Env, cors: Record<string, string>): Promise<Response> {
  const auth = await env.RSVP.get('admin:auth');
  return jsonRes({ hasPassword: auth !== null }, 200, cors);
}

async function handleAdminSetup(request: Request, env: Env, cors: Record<string, string>): Promise<Response> {
  if ((await env.RSVP.get('admin:auth')) !== null) {
    return jsonRes({ ok: false, error: 'Password already exists' }, 409, cors);
  }

  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return jsonRes({ ok: false, error: 'Invalid JSON' }, 400, cors);
  }

  const password = body.password;
  if (!password || typeof password !== 'string' || password.length < 8) {
    return jsonRes({ ok: false, error: 'Password must be at least 8 characters' }, 400, cors);
  }

  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  const salt = Array.from(saltBytes).map((b) => b.toString(16).padStart(2, '0')).join('');
  const hash = await sha256Hex(salt + password);
  await env.RSVP.put('admin:auth', JSON.stringify({ salt, hash }));
  return jsonRes({ ok: true }, 200, cors);
}

async function handleAdminList(env: Env, cors: Record<string, string>): Promise<Response> {
  const list = await env.RSVP.list({ prefix: 'reply:' });
  const sortedKeys = list.keys.sort((a, b) => b.name.localeCompare(a.name));
  const records = await Promise.all(
    sortedKeys.map(async (k) => {
      const val = await env.RSVP.get<StoredRecord>(k.name, 'json');
      return val ? { id: k.name, ...val } : null;
    })
  );
  const items = records
    .filter((r): r is StoredRecord & { id: string } => r !== null)
    .map((r) => ({
      id: r.id,
      name: r.name,
      side: r.side,
      attend: r.attend,
      guests: r.guests,
      wish: r.wish,
      at: r.at,
      status: r.status ?? 'pending',
    }));
  return jsonRes(items, 200, cors);
}

async function handleAdminUpdate(request: Request, env: Env, cors: Record<string, string>): Promise<Response> {
  let body: { id?: string; status?: string; wish?: string; name?: string };
  try {
    body = await request.json();
  } catch {
    return jsonRes({ ok: false, error: 'Invalid JSON' }, 400, cors);
  }

  const id = body.id;
  if (!id || typeof id !== 'string') return jsonRes({ ok: false, error: 'Missing id' }, 400, cors);

  const existing = await env.RSVP.get<StoredRecord>(id, 'json');
  if (!existing) return jsonRes({ ok: false, error: 'Not found' }, 404, cors);

  if (body.status !== undefined) {
    if (body.status !== 'pending' && body.status !== 'approved' && body.status !== 'hidden') {
      return jsonRes({ ok: false, error: 'Invalid status' }, 400, cors);
    }
    existing.status = body.status;
  }
  if (body.wish !== undefined) existing.wish = String(body.wish).trim().slice(0, 600);
  if (body.name !== undefined) existing.name = String(body.name).trim().slice(0, 120);

  await env.RSVP.put(id, JSON.stringify(existing));
  return jsonRes({ ok: true, record: { id, ...existing } }, 200, cors);
}

async function handleAdminDelete(request: Request, env: Env, cors: Record<string, string>): Promise<Response> {
  let body: { id?: string };
  try {
    body = await request.json();
  } catch {
    return jsonRes({ ok: false, error: 'Invalid JSON' }, 400, cors);
  }
  if (!body.id || typeof body.id !== 'string') return jsonRes({ ok: false, error: 'Missing id' }, 400, cors);

  await env.RSVP.delete(body.id);
  return jsonRes({ ok: true }, 200, cors);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin');
    const cors = getCorsHeaders(origin);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

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
    if (request.method === 'GET' && pathname === '/wishes') {
      return handleGetWishes(env, cors);
    }
    if (request.method === 'GET' && pathname === '/admin/state') {
      return handleAdminState(env, cors);
    }
    if (request.method === 'POST' && pathname === '/admin/setup') {
      return handleAdminSetup(request, env, cors);
    }

    if (pathname.startsWith('/admin/')) {
      const authErr = await verifyAdminAuth(request, env, cors);
      if (authErr) return authErr;
      if (request.method === 'GET' && pathname === '/admin/list') return handleAdminList(env, cors);
      if (request.method === 'POST' && pathname === '/admin/update') return handleAdminUpdate(request, env, cors);
      if (request.method === 'POST' && pathname === '/admin/delete') return handleAdminDelete(request, env, cors);
    }

    return new Response('Not Found', { status: 404, headers: cors });
  },
};
