// /services/http.ts
export const USE_MOCK = false;
export const BASE_URL = "https://easyrideafrica.com/test/restapi";

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const url = `${BASE_URL}/${endpoint}`;
  const res = await fetch(url, {
    method: options.method || 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    body: options.body ?? '{}', // por defecto mandamos JSON vacío
  });

  const text = await res.text(); // leemos crudo para poder depurar
  let json: any = undefined;
  try {
    json = text ? JSON.parse(text) : {};
  } catch (e) {
    // Si el backend devolvió HTML de error, exponemos un mensaje claro
    throw new Error(`Respuesta no-JSON del backend (${res.status}). Primeros 120 chars: ${text.slice(0,120)}`);
  }

  if (!res.ok) {
    const msg = (json && (json.msg || json.error)) || `HTTP ${res.status}`;
    throw new Error(String(msg));
  }

  return json;
}
// === Contrato genérico ===
export type ApiResponse<T = {}> = { error: number; msg: string } & T;

// === Token simple en memoria ===
let AUTH_TOKEN: string | null = null;
export function setAuthToken(t: string | null) { AUTH_TOKEN = t; }

// === Helper: lanza si error != 0; devuelve sólo “extras” ===
export async function ensureOk<T>(p: Promise<ApiResponse<T>>): Promise<T> {
  const res = await p;
  const err = typeof res?.error === 'number' ? res.error : 0;
  if (err !== 0) throw new Error(res?.msg || 'Backend error');
  const { error, msg, ...extras } = (res as any) || {};
  return extras as T;
}

// === Form-POST (application/x-www-form-urlencoded) ===
export async function requestForm<T>(endpoint: string, data: Record<string, string>): Promise<ApiResponse<T>> {
  const url = `${BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  const token = AUTH_TOKEN || null;

  const entries = Object.entries(data || {});
  if (token) entries.push(['token', token]); // <-- token también en el BODY

  const body = entries
    .map(([k,v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v ?? '')}`)
    .join('&');

  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    headers['X-Auth-Token'] = token;
  }

  console.log(`[HTTP] POST ${endpoint} ${token ? 'token OK' : 'SIN TOKEN'}`);

  const res = await fetch(url, { method: 'POST', headers, body });
  const text = await res.text();
  let json: any = {};
  try { json = text ? JSON.parse(text) : {}; } 
  catch { throw new Error(`Respuesta no-JSON (${res.status}): ${text.slice(0,120)}`); }
  if (!res.ok) throw new Error(json?.msg || `HTTP ${res.status}`);
  if (typeof json.error !== 'number') json.error = 0;
  if (typeof json.msg !== 'string') json.msg = '';
  return json as ApiResponse<T>;
}

