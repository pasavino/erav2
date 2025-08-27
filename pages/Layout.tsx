// /pages/Layout.tsx
import { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Header from './Header';

const HEADER_BG = '#f4a040ff';

function LayoutInner({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.root}>
      {/* Colorea la zona de notch */}
      <View style={{ height: insets.top, backgroundColor: HEADER_BG }} />
      <StatusBar style="light" translucent />
      <Header />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <SafeAreaProvider>
      <LayoutInner>{children}</LayoutInner>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1},
  content: { flex: 1, padding: 16 },
});
