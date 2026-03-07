// pages/TripManager.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { rides } from '../services/rides';
import type { Ride } from '../services/rides';
import AppModal from '../components/appModal';

/**
 * Screen para iniciar/finalizar viajes.
 * - muestra un listado de viajes disponibles
 * - solo puede haber un viaje "activo" a la vez
 * - si ya hay uno activo, al entrar solo se puede finalizar
 */
export default function TripManager() {
  const [trips, setTrips] = useState<Ride[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [working, setWorking] = useState<boolean>(false);

  const [refreshing, setRefreshing] = useState<boolean>(false);

  const [confirmation, setConfirmation] = useState<{
    type: 'start' | 'finish';
    ride: Ride;
  } | null>(null);

  const getId = (ride: Ride) => String(ride.IdViaje);
  const computeActiveId = (list: Ride[]) => {
    const active = list.find(r => r.Estado === 4);
    return active ? getId(active) : null;
  };

  const syncActiveId = async (id: string | null) => {
    setActiveId(id);
    try {
      if (id) {
        await AsyncStorage.setItem('ACTIVE_TRIP', id);
      } else {
        await AsyncStorage.removeItem('ACTIVE_TRIP');
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    setLoading(true);
    try {
      const res = await rides.list();
      const list = res.lista || [];
      setTrips(list);

      const activeFromBackend = computeActiveId(list);
      if (activeFromBackend) {
        await syncActiveId(activeFromBackend);
      } else {
        const stored = await AsyncStorage.getItem('ACTIVE_TRIP');
        if (stored) await syncActiveId(stored);
      }
    } catch (e) {
      console.warn('Failed to load trips', e);
      setTrips([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const navigation = useNavigation<any>();

  const handleStart = async (rideId: string) => {
    if (activeId) return;
    setWorking(true);
    try {
      await rides.start(rideId);
      await loadTrips();
    } catch (e) {
      console.warn('start failed', e);
    } finally {
      setWorking(false);
    }
  };

  const loadPassengers = (ride: Ride) => {
    navigation.navigate('TripPax', {
      rideId: getId(ride),
      from: ride.CityFrom,
      to: ride.CityTo,
    });
  };

  const handleFinish = async () => {
    if (!activeId) return;
    setWorking(true);
    try {
      await rides.finish(activeId);
      await loadTrips();
    } catch (e) {
      console.warn('finish failed', e);
    } finally {
      setWorking(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmation) return;
    const rideId = getId(confirmation.ride);
    if (confirmation.type === 'start') {
      await handleStart(rideId);
    } else if (confirmation.type === 'finish') {
      await handleFinish();
    }
    setConfirmation(null);
  };

  const cancelConfirmation = () => setConfirmation(null);


  const renderItem = ({ item }: { item: Ride; index: number }) => {
    const id = getId(item);
    const isActive = id === activeId;
    const hasActive = !!activeId;
    const canStart = item.Estado === 1 && !hasActive;
    const canFinish = item.Estado === 4 && (!hasActive || isActive);
    const pax = item.Pax ?? 0;

    return (
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{item.CityFrom} → {item.CityTo}</Text>
            <Text style={styles.subtitle}>{item.FechaHora}</Text>
            {item.EstadoNombre ? <Text style={styles.statusText}>{item.EstadoNombre}</Text> : null}
          </View>
          {item.Icono ? (
            <MaterialCommunityIcons name={item.Icono as any} size={24} color="#111" />
          ) : null}
        </View>

        <View style={[styles.rowBetween, { marginTop: 12 }]}> 
          <TouchableOpacity
            disabled={pax === 0}
            onPress={() => loadPassengers(item)}
            style={styles.paxRow}
          >
            <MaterialCommunityIcons name="account-group" size={18} color="#111" />
            <Text style={styles.paxLink}>{pax} pax</Text>
          </TouchableOpacity>

          {canFinish ? (
            <TouchableOpacity
              disabled={working}
              onPress={() => setConfirmation({ type: 'finish', ride: item })}
              style={[styles.button, working && styles.buttonDisabled]}
            >
              <Text style={styles.buttonText}>{working ? 'Finishing…' : 'Finish trip'}</Text>
            </TouchableOpacity>
          ) : canStart ? (
            <TouchableOpacity
              disabled={working}
              onPress={() => setConfirmation({ type: 'start', ride: item })}
              style={[styles.button, working && styles.buttonDisabled]}
            >
              <Text style={styles.buttonText}>{working ? 'Starting…' : 'Start trip'}</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.statusHint}>No actions available</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Trip Manager</Text>
      </View>

      {activeId && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>Active trip ID: {activeId}</Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(it) => getId(it)}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {
            setRefreshing(true);
            loadTrips();
          }} />}
          ListEmptyComponent={<Text style={styles.empty}>No trips available</Text>}
        />
      )}

      <AppModal
        visible={!!confirmation}
        title={confirmation?.type === 'start' ? 'Start trip?' : 'Finish trip?'}
        message={
          confirmation
            ? `Are you sure you want to ${confirmation.type === 'start' ? 'start' : 'finish'} the trip from ${confirmation.ride.CityFrom} to ${confirmation.ride.CityTo}?`
            : ''
        }
        onClose={cancelConfirmation}
        actions={
          confirmation
            ? [
                { label: 'No', onPress: cancelConfirmation, variant: 'ghost' },
                {
                  label: 'Yes',
                  onPress: handleConfirmAction,
                  variant: 'danger',
                  loading: working,
                },
              ]
            : []
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  banner: { padding: 8, backgroundColor: '#fffae6', alignItems: 'center' },
  bannerText: { color: '#444' },
  header: { padding: 12, backgroundColor: '#fff', borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#ddd' },
  pageTitle: { fontSize: 18, fontWeight: '700' },
  card: {
    backgroundColor: '#fafafa',
    borderRadius: 12,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e6e6e6',
  },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  subtitle: { fontSize: 12, color: '#666', marginBottom: 8 },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#111',
    alignSelf: 'flex-start',
  },
  buttonDisabled: { backgroundColor: '#bbb' },
  buttonText: { color: '#fff', fontWeight: '600' },
  paxRow: { flexDirection: 'row', alignItems: 'center' },
  paxText: { marginLeft: 6, color: '#111', fontWeight: '600' },
  paxLink: { marginLeft: 6, color: '#1B65D1', textDecorationLine: 'underline', fontWeight: '600' },
  statusText: { fontSize: 12, color: '#666', marginTop: 4 },
  statusHint: { fontSize: 12, color: '#999', marginTop: 4 },
  passHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#ddd' },
  backBtn: { flexDirection: 'row', alignItems: 'center', paddingRight: 12 },
  backText: { marginLeft: 6, fontSize: 15, fontWeight: '600' },
  passTitle: { fontSize: 16, fontWeight: '700' },
  passSub: { fontSize: 12, color: '#666' },
  passItem: { padding: 14, borderRadius: 12, backgroundColor: '#fafafa', borderWidth: StyleSheet.hairlineWidth, borderColor: '#e6e6e6' },
  passName: { fontSize: 15, fontWeight: '600' },
  passSeat: { marginTop: 4, fontSize: 13, color: '#666' },
  empty: { textAlign: 'center', color: '#666', marginTop: 40 },
});