// /services/auth.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requestForm, type ApiResponse, setAuthToken } from './http';

export type LoginExtra = { token: string; user?: { email: string } };

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
};