// /pages/Gate.tsx
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import MainTabs from './MainTabs';
import AuthStack from './AuthStack';
import { useAuth } from '../context/Auth';
import { requestForm, setAuthToken } from '../services/http';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Mode = 'checking' | 'auth' | 'main';

export default function Gate() {
  const authCtx = useAuth?.();
  const token = authCtx?.token ?? null;
  const loading = authCtx?.loading ?? false;
  const ctxLogout = authCtx?.logout;

  const [mode, setMode] = useState<Mode>('checking');
  const [navSeed, setNavSeed] = useState(0);

  const bump = () => setNavSeed(s => s + 1);

  const hardLogout = async () => {
    // Limpia sesión a prueba de fallos
    try { await (ctxLogout?.() ?? Promise.resolve()); } catch {}
    try { await AsyncStorage.removeItem('auth_token'); } catch {}
    setAuthToken(null);
    setMode('auth');
    bump();
  };

  useEffect(() => {
    let alive = true;

    const validate = async () => {
      if (loading) { setMode('checking'); return; }

      // Sin token => directo a Login
      if (!token) { await hardLogout(); return; }

      try {
        setMode('checking');
        setAuthToken(token);

        // Backend: error=0 ok ; !=0 token inválido
        const out: any = await requestForm('/ax_validate.php', {});
        if (!alive) return;

        const err = Number(out?.error ?? 1);
        if (err === 0) {
          setMode('main');
          bump(); // remount para evitar estados colgados
        } else {
          await hardLogout();
        }
      } catch {
        // Red/parse error => estrictos a Login
        await hardLogout();
      }
    };

    validate();
    return () => { alive = false; };
  }, [token, loading]);

  if (mode === 'checking') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  // Control absoluto por modo; keys únicas para remount del árbol
  return mode === 'main'
    ? <MainTabs key={`main-${navSeed}`} />
    : <AuthStack key={`auth-${navSeed}`} />;
}