// context/Auth.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAuthToken } from '../services/http';
import { auth as authApi, type LoginExtra } from '../services/auth';
import type { ApiResponse } from '../services/http';

type AuthCtx = {
  token: string | null;
  loading: boolean;
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

  useEffect(() => {
    (async () => {
      const t = await AsyncStorage.getItem('AUTH_TOKEN');
      if (t) {
        setToken(t);
        setAuthToken(t);
      } else {
        setAuthToken(null);
      }
      setLoading(false);
    })();
  }, []);

  const login = async (tok: string) => {
    await AsyncStorage.setItem('AUTH_TOKEN', tok);
    setToken(tok);
    setAuthToken(tok);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('AUTH_TOKEN');
    setToken(null);
    setAuthToken(null);
  };

  const signIn = async (email: string, password: string): Promise<ApiResponse<LoginExtra>> => {
    const res = await authApi.login(email, password);
    // Espera: { error: 0|1, msg, token?, user? }
    if (!res.error && (res as any).token) {
      await login((res as any).token as string);
    }
    return res;
  };

  return (
    <Ctx.Provider
      value={{
        token,
        loading,
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
