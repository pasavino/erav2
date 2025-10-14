// /services/auth.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requestForm, type ApiResponse, setAuthToken } from './http';

export type LoginExtra = { token: string; user?: { email: string } };

// 👇 Nuevo: payload/extra para registro
export type RegisterPayload = {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  password: string;
};
export type RegisterExtra = { user_id?: number }; // opcional según backend

// Respuesta típica: { error: 0|1, msg: string, token?: string, user?: {...} }
export const auth = {
  // Login: guarda token en AsyncStorage y en memoria (http.ts)
  login: async (email: string, password: string): Promise<ApiResponse<LoginExtra>> => {
    const out = await requestForm<LoginExtra>('/ax_login.php', { email, password });
    if (!out.error && out.token) {
      await AsyncStorage.setItem('era_token', out.token);
      setAuthToken(out.token); // ← clave para que http.ts lo inyecte en cada POST
    }
    return out;
  },

  // Logout: limpia token
  logout: async (): Promise<void> => {
    await AsyncStorage.removeItem('era_token');
    setAuthToken(null);
  },

  // (Opcional) Recupero de contraseña
  recover: (email: string) =>
    requestForm<{}>('/ax_recover.php', { email }),

  // ✅ Registro: NO guarda token. La pantalla navega a Login si no hay error.
  register: (p: RegisterPayload): Promise<ApiResponse<RegisterExtra>> =>
    requestForm<RegisterExtra>('/ax_register.php', {
      first_name: p.first_name,
      last_name:  p.last_name,
      email:      p.email,
      phone:      p.phone ?? '',
      password:   p.password,
    }),

  // Validar al abrir la app: compara token guardado con el de la BD.
  // Devuelve true si es válido; en caso contrario limpia y devuelve false.
  validateStoredToken: async (): Promise<boolean> => {
    const t = await AsyncStorage.getItem('era_token');
    if (!t) {
      setAuthToken(null);
      return false;
    }
    setAuthToken(t);
    // Usa el endpoint de validación que ya tengas en tu backend.
    // Aquí asumo '/ax_validate.php' siguiendo el prefijo actual.
    const out = await requestForm<{}>('/ax_validate.php', {});
    if (out.error) {
      await AsyncStorage.removeItem('era_token');
      setAuthToken(null);
      return false;
    }
    return true;
  },
};