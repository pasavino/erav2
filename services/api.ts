// /services/api.ts
// Toggle de mock para trabajar sin backend
const USE_MOCK = true; // pon en false cuando tengas el backend listo
const BASE_URL = 'https://your.api.url'; // TODO

async function post<T>(url: string, body: any): Promise<T> {
  if (USE_MOCK) return mockPost<T>(url, body);
  const r = await fetch(`${BASE_URL}${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await r.text();
  const json = text ? JSON.parse(text) : null;
  if (!r.ok) throw new Error(json?.message || `HTTP ${r.status}`);
  return (json as T) ?? ({} as T);
}

// Tipos
export type LoginRes   = { token: string; user?: { email: string } };
export type RecoverRes = { error: 0 | 1; msg: string };

export const auth = {
  login:   (email: string, password: string) => post<LoginRes>('/auth/login',   { email, password }),
  recover: (email: string)                   => post<RecoverRes>('/auth/recover', { email }),
};

// ---- Mock simple para desarrollo ----
function delay(ms: number) { return new Promise(res => setTimeout(res, ms)); }

async function mockPost<T>(url: string, body: any): Promise<T> {
  await delay(600);
  if (url === '/auth/login') {
    const { email, password } = body || {};
    if (String(email).includes('@') && String(password).length >= 3) {
      return { token: 'mock_token_123', user: { email } } as T;
    }
    throw new Error('Invalid credentials');
  }
  if (url === '/auth/recover') {
    const { email } = body || {};
    if (String(email).includes('@')) {
      return { error: 0, msg: 'Recovery email sent' } as T;
    }
    return { error: 1, msg: 'Invalid email' } as T;
  }
  throw new Error(`Unknown mock url: ${url}`);
}
