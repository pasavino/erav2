// /context/Auth.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAuthToken } from '../services/http';
import { auth } from '../services/auth';

type User = { email?: string } | null;

type AuthContextType = {
  ready: boolean;
  token: string | null;
  user: User;
  signIn: (email: string, password: string) => Promise<{ ok: boolean; msg?: string }>;
  signOut: () => Promise<void>;
  // ⬇️ agregado: exponemos la función register del servicio
  register: (payload: any) => Promise<any>;
};

// Nota: usamos la función del servicio en el valor por defecto para evitar undefined
const AuthContext = createContext<AuthContextType>({
  ready: false,
  token: null,
  user: null,
  signIn: async () => ({ ok: false, msg: 'Not ready' }),
  signOut: async () => {},
  register: auth.register,
});

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User>(null);

  // Validar token guardado contra la BD al iniciar
  useEffect(() => {
    (async () => {
      try {
        const ok = await auth.validateStoredToken();
        if (ok) {
          const t = await AsyncStorage.getItem('era_token');
          if (t) {
            setToken(t);
            setAuthToken(t); // http.ts inyectará el token en los POST
          } else {
            setToken(null);
            setAuthToken(null);
          }
        } else {
          setToken(null);
          setAuthToken(null);
        }
      } finally {
        setReady(true);
      }
    })();
  }, []);

  // Login
  const signIn = async (email: string, password: string) => {
    try {
      const res = await auth.login(email, password); // guarda token y setAuthToken()
      if ((res as any).error) return { ok: false, msg: (res as any).msg || 'Login failed' };

      if ((res as any).token) setToken((res as any).token as string);
      if ((res as any).user) setUser(((res as any).user as any) || null);

      return { ok: true };
    } catch (e: any) {
      return { ok: false, msg: String(e?.message || e) };
    }
  };

  // Logout
  const signOut = async () => {
    await auth.logout();
    setToken(null);
    setUser(null);
  };

  // 🔑 valor del contexto: añadimos register del servicio (sin reimplementar nada)
  const value = useMemo(
    () => ({ ready, token, user, signIn, signOut, register: auth.register }),
    [ready, token, user] // dejamos tus dependencias como estaban
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
