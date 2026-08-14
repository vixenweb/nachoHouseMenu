export async function onRequestGet({ env }) {
  try {
    const { results } = await env.DB.prepare(
      `SELECT id, menu_type, category_id, category_name, name, description, price, sort_order
       FROM menu_items ORDER BY menu_type, sort_order`
    ).all();
    return Response.json({ items: results }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'Content-Type': 'application/json; charset=utf-8'
      }
    });
  } catch (error) {
    return Response.json({ error: 'Database unavailable' }, { status: 500 });
  }
}
