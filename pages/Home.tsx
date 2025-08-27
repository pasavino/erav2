// /pages/Home.tsx
import { View, Text, StyleSheet } from 'react-native';
import Boton from '../components/boton';
import { useAuth } from '../context/Auth';

export default function Home() {
  const { signOut } = useAuth();
  return (
    <View style={styles.wrap}>
      <Text style={styles.h1}>Home</Text>
      <Text>Here we will search rides…</Text>
      <Boton label="Logout" onPress={signOut} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap:{ flex:1, padding:16, gap:12 },
  h1:{ fontSize:22, fontWeight:'700' }
});
