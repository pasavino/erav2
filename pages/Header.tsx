// /pages/Header.tsx
import { View, Text, Image, StyleSheet } from 'react-native';
const HEADER_BG = '#f4a040ff';

export default function Header() {
  return (
    <View style={styles.header}>
      {/* Ajusta la ruta del logo si fuera necesario */}
      <Image source={require('../assets/logoera.png')} style={styles.logo} resizeMode="contain" />
      <Text style={styles.title}>Easy Ride Africa</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: HEADER_BG,
    paddingVertical: 12,
    paddingHorizontal: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  logo: { width: 110, height: 40, marginRight: 10 },
  title: { fontSize: 18, fontWeight: '700', color: '#fff' },
});
