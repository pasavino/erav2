import 'react-native-gesture-handler';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Layout from './pages/Layout';
import MainTabs from './pages/MainTabs';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Register from './pages/Register';
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
  const { token, loading = false } = useAuth() as any;

  if (loading) return null;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {token ? (
      <>
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="TripFindResult" component={TripFindResult} />
      </>
    ) : (
      <>
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
        <Stack.Screen name="Register" component={Register} />
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