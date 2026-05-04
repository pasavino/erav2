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
import * as Location from 'expo-location';

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
  const [workingAction, setWorkingAction] = useState<'start' | 'finish' | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
      // Log estados de los viajes
      console.log('Estados de viajes:', list.map(t => ({ id: t.IdViaje, estado: t.Estado })));
      setTrips(list);

      const activeFromBackend = computeActiveId(list);
      console.log('activeId calculado:', activeFromBackend);
      if (activeFromBackend) {
        await syncActiveId(activeFromBackend);
      } else {
        // Si no hay viaje en estado 4, limpiar activeId y AsyncStorage
        await syncActiveId(null);
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
    setWorkingAction('start');

    // Intentar obtener ubicación actual (para enviar al backend y validar origen)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission denied');
      }

      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
      const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      console.log('Coordenadas enviadas al iniciar viaje:', coords);

      // Optimistic UI: marcar el viaje como activo inmediatamente para que el botón cambie a "Finish"
      setActiveId(rideId);
      setTrips(prev =>
        prev.map(t => (getId(t) === rideId ? { ...t, Estado: 4 } : t))
      );

      const res = await rides.start(rideId, coords);
      if (!res || res.error !== 0) {
        const msg = res?.msg || 'Could not start trip';
        console.warn('start failed', msg);
        setErrorMsg(msg);
        // revertir el estado en caso de error
        setActiveId(null);
        setTrips(prev => prev.map(t => (getId(t) === rideId ? { ...t, Estado: 1 } : t)));
        return;
      }

      await loadTrips();
    } catch (e: any) {
      const msg = e?.message || 'Could not start trip';
      console.warn('start failed', msg);
      setErrorMsg(msg);
      setActiveId(null);
      setTrips(prev => prev.map(t => (getId(t) === rideId ? { ...t, Estado: 1 } : t)));
    } finally {
      setWorking(false);
      setWorkingAction(null);
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
    setWorkingAction('finish');

    // Optimistic UI: cerrar el viaje en UI mientras se espera respuesta
    const closingId = activeId;
    setActiveId(null);
    setTrips(prev => prev.map(t => (getId(t) === closingId ? { ...t, Estado: 1 } : t)));

    try {
      // Obtener ubicación actual
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission denied');
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
      const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      console.log('Coordenadas enviadas al finalizar viaje:', coords);

      const res = await rides.finish(closingId, coords, 1);
      if (!res || res.error !== 0) {
        const msg = res?.msg || 'Could not finish trip';
        console.warn('finish failed', msg);
        setErrorMsg(msg);
        // revertimos si hubo error
        setActiveId(closingId);
        setTrips(prev => prev.map(t => (getId(t) === closingId ? { ...t, Estado: 4 } : t)));
        return;
      }

      await loadTrips();
    } catch (e: any) {
      const msg = e?.message || 'Could not finish trip';
      console.warn('finish failed', msg);
      setErrorMsg(msg);
      setActiveId(closingId);
      setTrips(prev => prev.map(t => (getId(t) === closingId ? { ...t, Estado: 4 } : t)));
    } finally {
      setWorking(false);
      setWorkingAction(null);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmation) return;

    // Close the confirmation modal first and show a waiting modal while backend works
    const action = confirmation;
    setConfirmation(null);

    const rideId = getId(action.ride);
    if (action.type === 'start') {
      await handleStart(rideId);
    } else if (action.type === 'finish') {
      await handleFinish();
    }
  };

  const cancelConfirmation = () => setConfirmation(null);

  const [forceEndWorking, setForceEndWorking] = useState<boolean>(false);
  const [forceEndConfirmation, setForceEndConfirmation] = useState<{ rideId: string } | null>(null);

  const handleForceEnd = async (rideId: string) => {
    setForceEndWorking(true);
    try {
      // Obtener ubicación actual
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission denied');
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
      const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      

      const res = await rides.finish(rideId, coords, 2);
      if (!res || res.error !== 0) {
        const msg = res?.msg || 'Could not force end trip';
        setErrorMsg(msg);
        return;
      }
      await loadTrips();
    } catch (e: any) {
      setErrorMsg(e?.message || 'Could not force end trip');
    } finally {
      setForceEndWorking(false);
      setForceEndConfirmation(null);
    }
  };

  const renderItem = ({ item }: { item: Ride; index: number }) => {
    const id = getId(item);
    const isActive = id === activeId;
    const hasActive = !!activeId;
    const canStart = (item.Estado === 1 || item.Estado === 2) && !hasActive;
    const canFinish = item.Estado === 4 && isActive;
    const pax = item.Pax ?? 0;
    const isTraveling = item.Estado === 4;
    // Log para depuración
    console.log(`renderItem: id=${id}, estado=${item.Estado}, hasActive=${hasActive}, canStart=${canStart}, canFinish=${canFinish}`);

    return (
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{item.CityFrom} → {item.CityTo}</Text>
            <Text style={styles.subtitle}>{item.FechaHora}</Text>
            {/* Cambia el texto de Boarding a Traveling si está en estado 4 */}
            <Text style={styles.statusText}>
              {isTraveling ? 'Traveling' : item.EstadoNombre || ''}
            </Text>
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

          {hasActive
            ? (isActive && canFinish
                ? (
                    <TouchableOpacity
                      disabled={working}
                      onPress={() => setConfirmation({ type: 'finish', ride: item })}
                      style={[styles.button, working && styles.buttonDisabled]}
                    >
                      <Text style={styles.buttonText}>{working ? 'Finishing…' : 'End trip'}</Text>
                    </TouchableOpacity>
                  )
                : <Text style={styles.statusHint}>No actions available</Text>
              )
            : (canStart
                ? (
                    <TouchableOpacity
                      disabled={working}
                      onPress={() => setConfirmation({ type: 'start', ride: item })}
                      style={[styles.button, working && styles.buttonDisabled]}
                    >
                      <Text style={styles.buttonText}>{working ? 'Starting…' : 'Start trip'}</Text>
                    </TouchableOpacity>
                  )
                : <Text style={styles.statusHint}>No actions available</Text>
              )
          }

          {/* Botón Force End solo si está en Traveling */}
          {isTraveling && (
            <TouchableOpacity
              disabled={forceEndWorking}
              onPress={() => setForceEndConfirmation({ rideId: id })}
              style={[styles.button, forceEndWorking && styles.buttonDisabled, { marginLeft: 8, backgroundColor: '#d32f2f' }]}
            >
              <Text style={styles.buttonText}>{forceEndWorking ? 'Ending…' : 'Force End'}</Text>
            </TouchableOpacity>
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

      {/* ...existing code... */}

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

      {/* Modal de confirmación Force End */}
      <AppModal
        visible={!!forceEndConfirmation}
        title="Force End Trip?"
        message="Forcing the termination of the trip means that the passenger will be refunded. Are you sure you want to force end this trip?"
        onClose={() => setForceEndConfirmation(null)}
        actions={forceEndConfirmation ? [
          { label: 'No', onPress: () => setForceEndConfirmation(null), variant: 'ghost' },
          {
            label: 'Yes',
            onPress: () => handleForceEnd(forceEndConfirmation.rideId),
            variant: 'danger',
            loading: forceEndWorking,
          },
        ] : []}
      />

      <AppModal
        visible={working}
        title="Please wait"
        message={
          workingAction === 'start'
            ? 'Starting trip…'
            : workingAction === 'finish'
            ? 'Finishing trip…'
            : 'Waiting for the server response…'
        }
        onClose={() => {}}
        actions={[]}
      />

      <AppModal
        visible={!!errorMsg}
        title="Error"
        message={errorMsg || ''}
        onClose={() => setErrorMsg(null)}
        actions={errorMsg ? [{ label: 'OK', onPress: () => setErrorMsg(null), variant: 'danger' }] : []}
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