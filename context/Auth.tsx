// /context/Auth.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../services/auth';
import { ensureOk, setAuthToken } from '../services/http';
import type { LoginExtra } from '../services/auth';

type Ctx = {
  token: string | null;
  loading: boolean;                           // hidratando token inicial
  signIn: (email: string, pass: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthCtx = createContext<Ctx>({} as Ctx);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Hidrata token al iniciar la app
  useEffect(() => {
    (async () => {
      try {
        const t = await AsyncStorage.getItem('era_token');
        setToken(t);
        setAuthToken(t); // Header Authorization automático
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Login: chequea {error,msg}, obtiene token y lo persiste
  const signIn = async (email: string, pass: string) => {
    const { token } = await ensureOk<LoginExtra>(auth.login(email, pass));
    setToken(token);
    setAuthToken(token);
    await AsyncStorage.setItem('era_token', token);
  };

  // Logout: limpia memoria y storage
  const signOut = async () => {
    setToken(null);
    setAuthToken(null);
    await AsyncStorage.removeItem('era_token');
  };

  return (
    <AuthCtx.Provider value={{ token, loading, signIn, signOut }}>
      {children}
    </AuthCtx.Provider>
  );
}