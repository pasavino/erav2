// /services/auth.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requestForm, type ApiResponse, setAuthToken } from './http';

export type LoginExtra = { token: string; user?: { email: string } };

export type RegisterPayload = {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  password: string;
};

// Respuesta típica: { error: 0|1, msg: string, token?: string, user?: {...} }
export const auth = {
  // Login: guarda token en AsyncStorage y en memoria (http.ts)
  login: async (email: string, password: string): Promise<ApiResponse<LoginExtra>> => {
    const out = await requestForm<LoginExtra>('/ax_login.php', { email, password });
    if (!out.error && (out as any).token) {
      const tok = (out as any).token as string;
      await AsyncStorage.setItem('era_token', tok);
      setAuthToken(tok); // inyecta el token en http.ts
    }
    return out;
  },

  // Logout: limpia token
  logout: async (): Promise<void> => {
    await AsyncStorage.removeItem('era_token');
    setAuthToken(null);
  },

  // Recupero de contraseña
  recover: (email: string) =>
    requestForm<{}>('/ax_recover.php', { email }),

  // ✅ Registro: usa requestForm para evitar rutas relativas y manejar BASE_URL
  register: (p: RegisterPayload): Promise<ApiResponse> =>
    requestForm('/ax_register.php', {
      first_name: p.first_name,
      last_name:  p.last_name,
      email:      p.email,
      phone:      p.phone ?? '',
      password:   p.password,
    }),

  // Validar al abrir la app
  validateStoredToken: async (): Promise<boolean> => {
    const t = await AsyncStorage.getItem('era_token');
    if (!t) {
      setAuthToken(null);
      return false;
    }
    setAuthToken(t);
    const out = await requestForm<{}>('/ax_validate.php', {});
    if (out.error) {
      await AsyncStorage.removeItem('era_token');
      setAuthToken(null);
      return false;
    }
    return true;
  },
};

// Compatibilidad de importaciones
export default auth;