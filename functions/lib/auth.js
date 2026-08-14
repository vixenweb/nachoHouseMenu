export function unauthorized() {
  return new Response('Authentication required.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Nacho House Admin", charset="UTF-8"',
      'Cache-Control': 'no-store'
    }
  });
}

function bytesEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function checkBasicAuth(request, env) {
  const expectedUser = env.ADMIN_USERNAME;
  const expectedPass = env.ADMIN_PASSWORD;
  if (!expectedUser || !expectedPass) return { ok: false, misconfigured: true };

  const header = request.headers.get('Authorization') || '';
  if (!header.startsWith('Basic ')) return { ok: false, misconfigured: false };

  let decoded;
  try {
    decoded = atob(header.slice(6));
  } catch (_) {
    return { ok: false, misconfigured: false };
  }

  const separator = decoded.indexOf(':');
  if (separator < 0) return { ok: false, misconfigured: false };
  const username = decoded.slice(0, separator);
  const password = decoded.slice(separator + 1);

  const enc = new TextEncoder();
  const userOk = bytesEqual(enc.encode(username), enc.encode(expectedUser));
  const passOk = bytesEqual(enc.encode(password), enc.encode(expectedPass));
  return { ok: userOk && passOk, misconfigured: false };
}
