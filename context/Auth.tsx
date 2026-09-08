// context/Auth.tsx
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAuthToken, requestForm } from '../services/http';
import { auth as authApi, type LoginExtra } from '../services/auth';
import type { ApiResponse } from '../services/http';

export type ActiveMode = 'passenger' | 'driver';

type AuthCtx = {
  token: string | null;
  loading: boolean;
  driverEnabled: boolean;
  setDriverEnabled: (enabled: boolean) => void;
  syncDriverMode: (enabled: boolean) => Promise<void>;
  activeMode: ActiveMode;
  setActiveMode: (mode: ActiveMode) => void;
  // Alto nivel: hace la llamada al backend y setea token si OK
  signIn: (email: string, password: string) => Promise<ApiResponse<LoginExtra>>;
  // Bajo nivel: setea token directamente (por si ya lo tienes)
  login: (tok: string) => Promise<void>;
  logout: () => Promise<void>;
  // Alias opcional para compatibilidad
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);
export const useAuth = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error('AuthProvider missing');
  return v;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [driverEnabled, setDriverEnabledState] = useState(false);
  const [preferredMode, setPreferredMode] = useState<ActiveMode>('passenger');
  // Conserva la preferencia al arrancar, sin habilitar driver antes de validar la sesión.
  const activeMode: ActiveMode = driverEnabled ? preferredMode : 'passenger';

  const setDriverEnabled = useCallback((enabled: boolean) => {
    setDriverEnabledState(enabled);
    if (!enabled) setPreferredMode('passenger');
  }, []);

  const setActiveMode = (mode: ActiveMode) => {
    setPreferredMode(driverEnabled && mode === 'driver' ? 'driver' : 'passenger');
  };

  const syncDriverMode = useCallback(async (enabled: boolean) => {
    if (!enabled) {
      setDriverEnabled(false);
      return;
    }
    const out = await requestForm<{ DriverRequired: 0 | 1 }>('/ax_can_change_mode.php', {});
    if (out.error !== 0) {
      throw new Error(out.msg || 'Could not check required mode');
    }
    if (out.DriverRequired !== 0 && out.DriverRequired !== 1) {
      throw new Error('Could not check required mode');
    }
    setDriverEnabled(true);
    if (out.DriverRequired === 1) setPreferredMode('driver');
  }, [setDriverEnabled]);

  useEffect(() => {
    (async () => {
      const t = await AsyncStorage.getItem('AUTH_TOKEN');
      if (t) {
        try {
          const storedMode = await AsyncStorage.getItem('ACTIVE_MODE');
          setPreferredMode(storedMode === 'driver' ? 'driver' : 'passenger');
        } catch (error: unknown) {
          console.warn('Could not restore active mode', error);
        }
      }
      if (t) {
        setToken(t);
        setAuthToken(t);
      } else {
        setAuthToken(null);
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (loading) return;
    AsyncStorage.setItem('ACTIVE_MODE', preferredMode).catch((error: unknown) => {
      console.warn('Could not save active mode', error);
    });
  }, [loading, preferredMode]);

  const login = async (tok: string) => {
    await AsyncStorage.setItem('AUTH_TOKEN', tok);
    setToken(tok);
    setAuthToken(tok);
  };

  const logout = async () => {
    try {
      const t = token || (await AsyncStorage.getItem('AUTH_TOKEN'));
      if (t) {
        // Asegura header Authorization antes de llamar al backend
        setAuthToken(t);
        // Notificamos al backend para revocar/eliminar el token en MySQL
        await requestForm('/ax_logout.php', {}); // ignoramos respuesta; la sesión local se cierra igual
      }
    } catch {
      // No hacemos nada: pase lo que pase, cerramos localmente
    } finally {
      // Limpieza local garantizada
      setDriverEnabled(false);
      await AsyncStorage.removeItem('AUTH_TOKEN');
      setToken(null);
      setAuthToken(null);
    }
  };

  const signIn = async (email: string, password: string): Promise<ApiResponse<LoginExtra>> => {
    const res = await authApi.login(email, password);
    // Espera: { error: 0|1, msg, token?, user? }
    if (!res.error && (res as any).token) {
      const validation = await requestForm<{ DriverEnabled: 0 | 1; message?: string }>(
        '/ax_validate.php', {}
      );
      if (validation.error !== 0) {
        throw new Error(validation.msg || validation.message || 'Could not validate session');
      }
      await syncDriverMode(validation.DriverEnabled === 1);
      await login((res as any).token as string);
    }
    return res;
  };

  return (
    <Ctx.Provider
      value={{
        token,
        loading,
        driverEnabled,
        setDriverEnabled,
        syncDriverMode,
        activeMode,
        setActiveMode,
        signIn,
        login,
        logout,
        signOut: logout,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
