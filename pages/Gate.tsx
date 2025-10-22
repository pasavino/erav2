// pages/Gate.tsx
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import MainTabs from './MainTabs';
import Login from './Login';
import { useAuth } from '../context/Auth';
import { canUseBiometrics, readBiometricToken } from '../lib/biometrics';

export default function Gate() {
  const { accessToken, loginWithRefresh } = useAuth();
  const [bootDone, setBootDone] = useState(false);
  const [isAuthed, setIsAuthed] = useState(!!accessToken);

  useEffect(() => {
    (async () => {
      try {
        if (accessToken) { setIsAuthed(true); return; }
        const okBio = await canUseBiometrics();
        if (okBio) {
          const rt = await readBiometricToken(); // triggers biometric prompt
          if (rt) {
            const out = await loginWithRefresh(rt);
            setIsAuthed(!!out.ok);
          }
        }
      } finally {
        setBootDone(true);
      }
    })();
  }, [accessToken]);

  if (!bootDone) {
    return (
      <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return isAuthed ? <MainTabs /> : <Login />;
}