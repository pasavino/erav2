import 'react-native-gesture-handler';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Layout from './pages/Layout';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Home from './pages/Home';
import TripFindResult from './pages/TripFindResult'; // ya lo tenías importado
import { AuthProvider, useAuth } from './context/Auth';

const Stack = createNativeStackNavigator();

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#fff',
    card: '#fff',
  },
};

function Gate() {
  const { token, loading } = useAuth();
  if (loading) return null;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {token ? (
        <>
          <Stack.Screen name="Home" component={Home} />
          {/* ✅ ÚNICA LÍNEA NECESARIA para que el NAVIGATE sea manejado */}
          <Stack.Screen name="TripFindResult" component={TripFindResult} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
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