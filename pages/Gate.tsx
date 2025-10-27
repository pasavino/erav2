// /pages/Gate.tsx
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/Auth';
import MainTabs from './MainTabs';
import AuthStack from './AuthStack';
import { requestForm, setAuthToken } from '../services/http';
import { auth } from '../services/auth';

export default function Gate() {
  const { token, loading } = useAuth();

  // Chequeo puntual del token cuando la app arranca o cambia el token
  const [checking, setChecking] = useState(true);
  const [forceLogin, setForceLogin] = useState(false);

  useEffect(() => {
    let alive = true;

    const run = async () => {
      // Primero esperamos a que termine el loading del contexto
      if (loading) { setChecking(true); return; }

      // Si no hay token, no hay nada que validar
      if (!token) {
        if (alive) { setForceLogin(true); setChecking(false); }
        return;
      }

      try {
        setChecking(true);
        setAuthToken(token);
        // Nuestro backend: error=0 -> OK; error=1/!=0 -> token inválido/ausente
        const out: any = await requestForm('/ax_validate.php', {});
        if (!alive) return;
        const err = Number(out?.error || 0);
        if (err === 0) {
          setForceLogin(false);
        } else {
          // Token inválido: limpiar y forzar Login
          try { await auth.logout?.(); } catch {}
          setForceLogin(true);
        }
      } catch (_e) {
        // En error de red, por claridad llevamos a Login (estricto como pediste)
        try { await auth.logout?.(); } catch {}
        if (alive) setForceLogin(true);
      } finally {
        if (alive) setChecking(false);
      }
    };

    run();
    return () => { alive = false; };
  }, [token, loading]);

  if (loading || checking) {
    return (
      <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  // Si el token es inválido o no existe -> Login (AuthStack). Caso contrario -> MainTabs
  return (!forceLogin && token) ? <MainTabs /> : <AuthStack />;
}