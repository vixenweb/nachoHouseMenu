import { checkBasicAuth, unauthorized } from '../../lib/auth.js';

const json = (body, status = 200) => Response.json(body, {
  status,
  headers: { 'Cache-Control': 'no-store' }
});

export async function onRequestGet({ request, env }) {
  const auth = await checkBasicAuth(request, env);
  if (auth.misconfigured) return json({ error: 'Authentication is not configured.' }, 503);
  if (!auth.ok) return unauthorized();

  try {
    const { results } = await env.DB.prepare(
      `SELECT id, menu_type, category_id, category_name, name, description, price, sort_order
       FROM menu_items ORDER BY menu_type, sort_order`
    ).all();
    return json({ items: results });
  } catch (_) {
    return json({ error: 'Database unavailable' }, 500);
  }
}

export async function onRequestPost({ request, env }) {
  const auth = await checkBasicAuth(request, env);
  if (auth.misconfigured) return json({ error: 'Authentication is not configured.' }, 503);
  if (!auth.ok) return unauthorized();

  if (request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    return json({ error: 'JSON body required.' }, 415);
  }

  let body;
  try { body = await request.json(); } catch (_) { return json({ error: 'Invalid JSON.' }, 400); }
  if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > 200) {
    return json({ error: 'Invalid items payload.' }, 400);
  }

  const ids = new Set();
  for (const item of body.items) {
    if (!item || typeof item.id !== 'string' || ids.has(item.id)) return json({ error: 'Invalid item IDs.' }, 400);
    ids.add(item.id);
    const price = Number(item.price);
    if (!Number.isSafeInteger(price) || price < 0 || price > 1000000000000) {
      return json({ error: `Invalid price for ${item.id}.` }, 400);
    }
  }

  try {
    const existing = await env.DB.prepare('SELECT id FROM menu_items').all();
    const known = new Set(existing.results.map(row => row.id));
    if (ids.size !== known.size || [...known].some(id => !ids.has(id))) {
      return json({ error: 'The submitted menu does not match the server menu.' }, 409);
    }

    const statements = body.items.map(item =>
      env.DB.prepare('UPDATE menu_items SET price = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .bind(Number(item.price), item.id)
    );
    await env.DB.batch(statements);
    return json({ ok: true, saved: body.items.length });
  } catch (_) {
    return json({ error: 'Could not save prices.' }, 500);
  }
}
