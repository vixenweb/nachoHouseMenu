import { checkBasicAuth, unauthorized } from './lib/auth.js';

export async function onRequest(context) {
  const { request, env, next } = context;
  const path = new URL(request.url).pathname;
  const protectedRoute = path === '/admin.html' || path.startsWith('/api/admin/');
  if (!protectedRoute) return next();

  const auth = await checkBasicAuth(request, env);
  if (auth.misconfigured) {
    return new Response('Admin authentication is not configured.', {
      status: 503,
      headers: { 'Cache-Control': 'no-store' }
    });
  }
  if (!auth.ok) return unauthorized();
  return next();
}
