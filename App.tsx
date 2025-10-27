// /App.tsx
import 'react-native-gesture-handler';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Layout from './pages/Layout';
import MainTabs from './pages/MainTabs';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Register from './pages/Register';
import TripFindResult from './pages/TripFindResult'; // ya lo tenías importado
import { AuthProvider, useAuth } from './context/Auth';

// usamos tu capa http para respetar headers/esquema del backend
import { requestForm, setAuthToken } from './services/http';

const Stack = createNativeStackNavigator();

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#fff',
    card: '#fff',
  },
};

type Mode = 'checking' | 'auth' | 'main';

function Gate() {
  const { token, loading = false } = useAuth() as any;

  const [mode, setMode] = useState<Mode>('checking');

  // control para validar SOLO una vez al arranque (token de storage)
  const bootHandledRef = useRef(false);

  useEffect(() => {
    let alive = true;

    const validateBootToken = async (tok: string) => {
      try {
        // usamos tu http.ts para que ponga el header correcto
        setAuthToken(tok);
        const out: any = await requestForm('/ax_validate.php', {}); // { error: 0 } => OK
        if (!alive) return;

        const err = Number(out?.error ?? 1);
        if (err === 0) {
          setMode('main'); // token válido
        } else {
          setMode('auth'); // token inválido -> Login
        }
      } catch {
        // ⚠️ fallo de red/parse: NO mandamos a login, confiamos en el token
        setMode('main');
      }
    };

    // Mientras el AuthProvider termina su bootstrap
    if (loading) {
      setMode('checking');
      return;
    }

    // Primera salida del loading: solo aquí validamos contra backend
    if (!bootHandledRef.current) {
      bootHandledRef.current = true;

      if (token) {
        setMode('checking');
        validateBootToken(token);
      } else {
        setMode('auth'); // sin token en storage -> Login
      }
      return;
    }

    // Después del boot:
    if (token) {
      // el usuario acaba de loguearse en runtime -> ir directo al main (sin revalidar)
      setAuthToken(token);
      setMode('main');
    } else {
      // logout en runtime
      setAuthToken(null);
      setMode('auth');
    }

    return () => { alive = false; };
  }, [token, loading]);

  if (mode === 'checking') {
    return (
      <View style={{ flex: 1, justifyContent:'center', alignItems:'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {mode === 'main' ? (
        <>
          {/* Flujo logueado */}
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name="TripFindResult" component={TripFindResult} />
          {/* Alias para cualquier RESET a 'Home' */}
          <Stack.Screen name="Home" component={MainTabs} />
        </>
      ) : (
        <>
          {/* Flujo auth */}
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
          <Stack.Screen name="Register" component={Register} />
          {/* Alias para RESET a 'Home' cuando estás en auth */}
          <Stack.Screen name="Home" component={Login} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer theme={theme}>
        <Layout>
          <Gate />
        </Layout>
      </NavigationContainer>
    </AuthProvider>
  );
}