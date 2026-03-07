// pages/TripPax.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Linking } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { rides } from '../services/rides';
import AppModal from '../components/appModal';

type Passenger = {
  NombrePax: string;
  Telefono: string;
  Seat?: number;
  Bags?: number;
};

export default function TripPax() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();

  const rideId = route.params?.rideId ?? '';
  const from = route.params?.from ?? '';
  const to = route.params?.to ?? '';

  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  useEffect(() => {
    navigation.setOptions({ title: 'Passenger list' });
  }, [navigation]);

  useEffect(() => {
    if (!rideId) return;
    (async () => {
      setLoading(true);
      try {
        const res = await rides.passengers(rideId);
        if (typeof res?.error === 'number' && res.error !== 0) {
          // Backend nos indicó error (p.ej. token inválido, datos faltantes, etc.)
          setModalError((res as any)?.message || (res as any)?.msg || 'An error occurred');
          setPassengers([]);
        } else {
          setPassengers(res.lista || []);
        }
      } catch (e: any) {
        console.warn('Failed to load passengers', e);
        setError(e?.message || 'Could not load passengers');
      } finally {
        setLoading(false);
      }
    })();
  }, [rideId]);

  return (
    <View style={styles.container}>
      <Text style={styles.subtitle}>{from} → {to}</Text>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={passengers}
          keyExtractor={(_, idx) => String(idx)}
          renderItem={({ item }) => (
            <View style={styles.passItem}>
              <Text style={styles.passName}>{item.NombrePax}</Text>
              <TouchableOpacity
                disabled={!item.Telefono}
                onPress={() => {
                  if (!item.Telefono) return;
                  Linking.openURL(`tel:${item.Telefono}`);
                }}
              >
                <Text style={styles.passPhone}>{item.Telefono}</Text>
              </TouchableOpacity>
              <View style={styles.passMetaRow}>
                <Text style={styles.passMeta}>Seat: {item.Seat ?? '-'}</Text>
                <Text style={styles.passMeta}>Bags: {item.Bags ?? '-'}</Text>
              </View>
            </View>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={<Text style={styles.empty}>No passengers found</Text>}
        />
      )}

      <AppModal
        visible={!!modalError}
        title="Error"
        message={modalError || ''}
        onClose={() => setModalError(null)}
        actions={modalError ? [{ label: 'OK', onPress: () => setModalError(null), variant: 'danger' }] : []}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  subtitle: { fontSize: 14, color: '#666', padding: 16 },
  passItem: { padding: 14, borderRadius: 12, backgroundColor: '#fafafa', borderWidth: StyleSheet.hairlineWidth, borderColor: '#e6e6e6' },
  passName: { fontSize: 15, fontWeight: '600' },
  passPhone: { marginTop: 4, fontSize: 13, color: '#666' },
  passMetaRow: { flexDirection: 'row', marginTop: 8, gap: 12 },
  passMeta: { fontSize: 13, color: '#666' },
  empty: { textAlign: 'center', color: '#666', marginTop: 40 },
  error: { textAlign: 'center', color: '#d00', marginTop: 40 },
});