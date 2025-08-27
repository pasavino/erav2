// /context/Auth.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, LoginRes } from '../services/api';

type Ctx = {
  token: string | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthCtx = createContext<Ctx>({} as Ctx);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const t = await AsyncStorage.getItem('era_token');
      setToken(t);
      setLoading(false);
    })();
  }, []);

  const signIn = async (email: string, pass: string) => {
    const res: LoginRes = await auth.login(email, pass);
    await AsyncStorage.setItem('era_token', res.token);
    setToken(res.token);
  };

  const signOut = async () => {
    await AsyncStorage.removeItem('era_token');
    setToken(null);
  };

  return (
    <AuthCtx.Provider value={{ token, loading, signIn, signOut }}>
      {children}
    </AuthCtx.Provider>
  );
}
