// /services/lists.ts
import { apiFetch } from './http';

// Opción usada por tu <Select> en Home.tsx (usa item.id)
export type Option = { id: string; text: string };
export type OptionsExtra = { lista: Option[] };

export const lists = {
  async cities(kind: 'from' | 'to'): Promise<{ error: number; msg: string; lista: Option[] }> {
    // Llamado al backend (convención ERA: ax_cities.php con kind)
    const json: any = await apiFetch('ax_cities.php', {
      method: 'POST',
      body: JSON.stringify({ kind })
    });

    // Acepta ambos formatos: {data:[...]} (nuevo) o {cities:[...]} (legacy)
    const raw = (json && (json.data || json.cities)) || [];

    const lista: Option[] = Array.isArray(raw)
      ? raw.map((x: any) => ({
          // Soporta distintas claves que vi en tu backend: id / idregistro / value
          id: String(
            (x && (x.id ?? x.idregistro ?? x.value)) ?? ''
          ),
          // Texto visible: name / city / label
          text: String(
            (x && (x.name ?? x.city ?? x.label)) ?? ''
          )
        }))
      : [];

    return {
      error: Number(json && json.error) || 0,
      msg: (json && json.msg) || 'ok',
      lista
    };
  }
};