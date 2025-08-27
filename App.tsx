// /App.tsx
import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Layout from './pages/Layout';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Home from './pages/Home';
import { AuthProvider, useAuth } from './context/Auth';

const Stack = createNativeStackNavigator();

function Gate() {
  const { token, loading } = useAuth();
  if (loading) return null;
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {token ? (
        <Stack.Screen name="Home" component={Home} />
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
      <NavigationContainer>
        <Layout>
          <Gate />
        </Layout>
      </NavigationContainer>
    </AuthProvider>
  );
}
