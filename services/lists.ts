// /services/lists.ts
import { requestForm } from './http';

export type Option = { id: string; text: string };
export type OptionsExtra = { lista: Option[] };

export const lists = {
  // Backend devuelve: { error, msg, cities: [{id,name}, ...] }
  async cities(kind: 'from' | 'to'): Promise<{ error: number; msg: string; lista: Option[] }> {
    const json: any = await requestForm('ax_cities.php', { kind });

    const lista: Option[] = Array.isArray(json?.cities)
      ? json.cities.map((x: any) => ({
          id: String(x.id),
          text: String(x.name),
        }))
      : [];

    return {
      error: Number(json?.error) || 0,
      msg: String(json?.msg ?? 'ok'),
      lista,
    };
  },
};