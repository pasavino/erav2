// /pages/Header.tsx
import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, Pressable, Modal } from 'react-native';
import { useAuth } from '../context/Auth';

const HEADER_BG = '#f4a040ff';

function HeaderMenu() {
  const { token, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  if (!token) return null; // sólo cuando está logueado

  return (
    <>
      <Pressable onPress={() => setOpen(true)} hitSlop={10} style={{ padding: 6 }}>
        <Text style={{ fontSize: 22, lineHeight: 22, color: '#fff' }}>⋮</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={{ flex:1 }} onPress={() => setOpen(false)} />
        <View
          style={{
            position: 'absolute',
            top: 56, right: 8,
            backgroundColor: '#fff',
            borderRadius: 12,
            paddingVertical: 6,
            minWidth: 160,
            shadowColor: '#000',
            shadowOpacity: 0.2,
            shadowRadius: 6,
            elevation: 6,
          }}
        >
          <Pressable
            onPress={async () => { setOpen(false); await signOut(); }}
            style={{ paddingVertical: 12, paddingHorizontal: 14 }}
          >
            <Text>Logout</Text>
          </Pressable>
        </View>
      </Modal>
    </>
  );
}

export default function Header() {
  return (
    <View style={styles.header}>
      <Image source={require('../assets/logoera.png')} style={styles.logo} resizeMode="contain" />
      <Text style={styles.title}>Easy Ride Africa</Text>
      <View style={{ flex: 1 }} />
      <HeaderMenu />
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
