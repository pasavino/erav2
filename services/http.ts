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