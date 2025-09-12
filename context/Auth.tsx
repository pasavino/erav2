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
};

const AuthContext = createContext<AuthContextType>({
  ready: false,
  token: null,
  user: null,
  signIn: async () => ({ ok: false, msg: 'Not ready' }),
  signOut: async () => {},
});

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User>(null);

  // Rehidratar token al iniciar
  useEffect(() => {
    (async () => {
      try {
        const t = await AsyncStorage.getItem('era_token');
        if (t) {
          setToken(t);
          setAuthToken(t); // ← para que http.ts inyecte el token en POST
        }
      } finally {
        setReady(true);
      }
    })();
  }, []);

  // Login
  const signIn = async (email: string, password: string) => {
    try {
      const res = await auth.login(email, password); // guarda token en storage y setAuthToken()
      if (res.error) return { ok: false, msg: res.msg || 'Login failed' };

      if (res.token) setToken(res.token);
      if (res.user) setUser(res.user || null);

      return { ok: true };
    } catch (e: any) {
      return { ok: false, msg: String(e?.message || e) };
    }
  };

  // Logout
  const signOut = async () => {
    await auth.logout();       // borra storage y limpia setAuthToken(null)
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({ ready, token, user, signIn, signOut }),
    [ready, token, user]
  );

  // Gate simple: el árbol puede usar `ready` y `token` para decidir navegación.
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);