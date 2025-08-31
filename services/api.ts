// /services/api.ts

// === Configuración ===
const USE_MOCK = false; // ⬅️ pon en false cuando uses tu backend real
const BASE_URL  = 'https://easyrideafrica.com/test/restapi'; // ⬅️ raíz del backend

// === Contrato genérico ===
export type ApiResponse<T = {}> = { error: number; msg: string } & T;

// === Token en memoria (Authorization) ===
let AUTH_TOKEN: string | null = null;
export function setAuthToken(t: string | null) { AUTH_TOKEN = t; }

// === Helper: lanza si error != 0; devuelve sólo “extras” ===
export async function ensureOk<T>(p: Promise<ApiResponse<T>>): Promise<T> {
  const res = await p;
  if (res.error === 0) {
    const { error, msg, ...extras } = res as any;
    return extras as T;
  }
  throw new Error(res.msg || 'Request failed');
}

// === Core JSON ===
async function requestJson<T>(
  method: 'GET'|'POST',
  url: string,
  body?: any
): Promise<ApiResponse<T>> {
  if (USE_MOCK) return mockRequest<T>(method, url, body);

  try {
    const r = await fetch(`${BASE_URL}${url}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : {}),
      },
      body: method === 'POST' ? JSON.stringify(body ?? {}) : undefined,
    });

    const text = await r.text();
    let json: any = {};
    try { json = text ? JSON.parse(text) : {}; } catch {}

    // Normaliza "mensaje" → "msg"
    if (typeof json.msg === 'undefined' && typeof json.mensaje !== 'undefined') {
      json.msg = json.mensaje;
    }
    // Normaliza contrato base
    if (typeof json.error === 'undefined') json.error = r.ok ? 0 : 1;
    if (typeof json.msg   === 'undefined') json.msg   = r.ok ? '' : `HTTP ${r.status}`;

    return json as ApiResponse<T>;
  } catch (e: any) {
    return { error: 1, msg: e?.message || 'Network error' } as ApiResponse<T>;
  }
}

// === Core x-www-form-urlencoded (PHP 5 clásico) ===
async function requestForm<T>(
  url: string,
  body: Record<string, string>
): Promise<ApiResponse<T>> {
  if (USE_MOCK) return mockRequest<T>('POST', url, body);

  try {
    const payload = new URLSearchParams(body).toString();
    const r = await fetch(`${BASE_URL}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        ...(AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : {}),
      },
      body: payload,
    });

    const text = await r.text();
    let json: any = {};
    try { json = text ? JSON.parse(text) : {}; } catch {}

    if (typeof json.msg === 'undefined' && typeof json.mensaje !== 'undefined') {
      json.msg = json.mensaje;
    }
    if (typeof json.error === 'undefined') json.error = r.ok ? 0 : 1;
    if (typeof json.msg   === 'undefined') json.msg   = r.ok ? '' : `HTTP ${r.status}`;

    return json as ApiResponse<T>;
  } catch (e: any) {
    return { error: 1, msg: e?.message || 'Network error' } as ApiResponse<T>;
  }
}

// === Tipos por endpoint ===
export type LoginExtra   = { token: string; user?: { email: string } };
export type RecoverExtra = {};
export type Option = { id: string; label: string };
export type OptionsExtra = { lista: Option[] };
export type Ride = { id: string; from: string; to: string; date: string; price: number };
export type SearchRidesExtra = { lista: Ride[] };

// === Endpoints (convención ax_) ===
export const auth = {
  login:   (email: string, password: string) =>
    requestForm<LoginExtra>('/ax_login.php', { email, password }),

  // Ejemplo: si luego haces recover por PHP form:
  // recover: (email: string) =>
  //   requestForm<RecoverExtra>('/ax_recover.php', { email }),
};

export const lists = {
  // Devolver {error,msg,lista:[{id,label}]}
  cities: (kind: 'from'|'to') =>
    requestForm<OptionsExtra>('/ax_cities.php', { kind }),
};

export const rides = {
  // Devolver {error,msg,lista:[Ride]}
  search: (q:{ from:string; to:string; date?:string }) =>
    requestForm<SearchRidesExtra>('/ax_search_rides.php', {
      from: q.from, to: q.to, date: q.date || ''
    }),
};

// === Mock para desarrollo ===
function delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function mockRequest<T>(
  method: 'GET'|'POST',
  url: string,
  body?: any
): Promise<ApiResponse<T>> {
  await delay(300);

  // LOGIN
  if (url.endsWith('/ax_login.php')) {
    const emailStr = String(body?.email ?? '');
    const passStr  = String(body?.password ?? '');
    const ok = emailStr.includes('@') && passStr.length >= 3;
    if (ok) {
      const out: ApiResponse<LoginExtra> = { error:0, msg:'', token:'mock_token_123', user:{ email: emailStr } };
      return out as unknown as ApiResponse<T>;
    } else {
      const out: ApiResponse<{}> = { error:1, msg:'User or password not match' };
      return out as unknown as ApiResponse<T>;
    }
  }

  // COMBOS (ciudades)
  if (url.endsWith('/ax_cities.php')) {
    const kind = String(body?.kind ?? 'from');
    const listaFrom: Option[] = [
      { id:'LOS', label:'Lagos' }, { id:'ABV', label:'Abuja' }, { id:'IBA', label:'Ibadan' }
    ];
    const listaTo: Option[] = [
      { id:'ABV', label:'Abuja' }, { id:'LOS', label:'Lagos' }, { id:'PHC', label:'Port Harcourt' }
    ];
    const out: ApiResponse<OptionsExtra> = { error:0, msg:'', lista: kind === 'from' ? listaFrom : listaTo };
    return out as unknown as ApiResponse<T>;
  }

  // BÚSQUEDA
  if (url.endsWith('/ax_search_rides.php')) {
    const out: ApiResponse<SearchRidesExtra> = {
      error:0, msg:'', lista:[
        { id:'1', from:'Lagos', to:'Abuja', date:'2025-09-01', price:120 },
        { id:'2', from:'Lagos', to:'Ibadan', date:'2025-09-02', price: 60 },
      ]
    };
    return out as unknown as ApiResponse<T>;
  }

  // Fallback
  const fallback: ApiResponse<{}> = { error: 1, msg: `Unknown mock url: ${url}` };
  return fallback as unknown as ApiResponse<T>;
}