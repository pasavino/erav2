// /pages/BookTrip.tsx
import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { useRoute } from '@react-navigation/native';

import Boton from '../components/boton2';
import AppModal from '../components/appModal';
import { requestForm } from '../services/http';

// Tipado básico de preferencias
export type TripPrefs = {
  idregistro?: number;
  Pets?: string;
  Music?: string;
  Food?: string;
  Smoking?: string;
  Bags?: number;
  Valijas_precio?: number;
  Childrens?: string;
  AC?: string;
  RoofRack?: string;
  Cupos?: number;
  Descripcion?: string;
};

// Helper: formato Naira
const naira = (v: any) => {
  const n = Number(v);
  return isFinite(n) ? `₦ ${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : String(v ?? '');
};

const yn = (v: any) => {
  const s = String(v ?? '').toLowerCase();
  if (s === 'yes') return 'Yes';
  if (s === 'no') return 'No';
  return s ? String(v) : '—';
};

export default function BookTrip() {
  const route = useRoute<any>();
  const trip = route.params?.trip || {};

  // Preferencias iniciales desde params
  const [prefs, setPrefs] = useState<TripPrefs | null>(
    route.params?.prefs || route.params?.data || trip?.prefs || null
  );
  const [loadingPrefs, setLoadingPrefs] = useState(false);

  // Datos base
  const fromCity = String(trip?.from ?? '');
  const toCity = String(trip?.to ?? '');
  const date = String(trip?.date ?? trip?.when ?? '');
  const time = String(trip?.time ?? trip?.when ?? '');
  const price = trip?.price ?? trip?.amount ?? trip?.fare ?? null;
  const avatarUri = (typeof trip?.driver_avatar === 'string') ? trip.driver_avatar.trim() : '';

  // Cargar preferencias del backend si no están
  useEffect(() => {
    let alive = true;
    (async () => {
      if (prefs) return;
      const id = route.params?.idregistro ?? trip?.idregistro ?? trip?.id ?? route.params?.id;
      if (!id) return;
      try {
        setLoadingPrefs(true);
        const res: any = await requestForm('/ax_BookTripInfo.php', { idregistro: id });
        if (!alive) return;
        if (res && res.error === 0 && res.data) {
          setPrefs(res.data as TripPrefs);
        } else {
          setAlertMsg(String(res?.msg || 'Failed to load trip info'));
        }
      } catch (_e: any) {
        if (!alive) return;
        setAlertMsg('Network error loading trip info');
      } finally {
        if (alive) setLoadingPrefs(false);
      }
    })();
    return () => { alive = false; };
  }, [route.params, trip, prefs]);

  // Máximo pasajeros
  const maxPassengers = useMemo(() => {
    const cupos = Number(prefs?.Cupos);
    if (Number.isFinite(cupos) && cupos > 0) return cupos;
    const s = Number(trip?.seats ?? trip?.available_seats ?? trip?.slots ?? 4);
    return Number.isFinite(s) && s > 0 ? s : 4;
  }, [trip, prefs]);

  // Estado de reserva + modal
  const [count, setCount] = useState<number>(Math.min(1, maxPassengers));
  const [sending, setSending] = useState(false);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [alertVariant, setAlertVariant] = useState<'success' | 'error' | 'warning'>('warning');

  // Ajustar contador si cambia max
  useEffect(() => {
    setCount((c) => Math.min(Math.max(1, c), maxPassengers));
  }, [maxPassengers]);

  const dec = () => setCount((c) => Math.max(1, c - 1));
  const inc = () => setCount((c) => Math.min(maxPassengers, c + 1));

  const onBook = async () => {
    if (loadingPrefs || sending) return;
    try {
      setSending(true);
      await new Promise((r) => setTimeout(r, 800)); // mock

      // ÉXITO → check verde
      setAlertMsg('Trip booked successfully');
      setAlertVariant('success');
    } catch (_e: any) {
      // ERROR → ícono rojo
      setAlertMsg('Booking failed');
      setAlertVariant('error');
    } finally {
      setSending(false);
    }
  };

  // Cerrar modal y resetear
  const closeModal = () => {
    setAlertMsg(null);
    setAlertVariant('warning');
  };

  const desc = prefs?.Descripcion?.toString().trim() ?? '';
  const actionDisabled = loadingPrefs || sending;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Book trip</Text>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={styles.avatarWrap}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} resizeMode="cover" />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]} />
          )}
        </View>

        {/* Ruta */}
        <Text style={styles.route} numberOfLines={2}>
          {fromCity || 'From'} → {toCity || 'To'}
        </Text>
        {!!date && <Text style={styles.date}>{date} → {time}</Text>}

        {/* Descripción */}
        {desc ? <Text style={styles.desc}>{desc}</Text> : null}

        {/* Precio */}
        {price != null && <Text style={styles.price}>{naira(price)}</Text>}

        {/* Preferencias */}
        <View style={styles.prefsBox}>
          <Text style={styles.prefsTitle}>Trip preferences</Text>

          {loadingPrefs && <Text style={styles.prefsHint}>Loading…</Text>}

          {!loadingPrefs && prefs && (
            <View style={styles.prefsGrid}>
              <View style={styles.prefsItem}><Text style={styles.prefsLabel}>Pets</Text><Text style={styles.prefsValue}>{yn(prefs.Pets)}</Text></View>
              <View style={styles.prefsItem}><Text style={styles.prefsLabel}>Music</Text><Text style={styles.prefsValue}>{yn(prefs.Music)}</Text></View>
              <View style={styles.prefsItem}><Text style={styles.prefsLabel}>Food</Text><Text style={styles.prefsValue}>{yn(prefs.Food)}</Text></View>
              <View style={styles.prefsItem}><Text style={styles.prefsLabel}>Smoking</Text><Text style={styles.prefsValue}>{yn(prefs.Smoking)}</Text></View>
              <View style={styles.prefsItem}><Text style={styles.prefsLabel}>Bags</Text><Text style={styles.prefsValue}>{prefs.Bags ?? '—'}</Text></View>
              <View style={styles.prefsItem}><Text style={styles.prefsLabel}>Price per baggage</Text><Text style={styles.prefsValue}>{prefs.Valijas_precio != null ? naira(prefs.Valijas_precio) : '—'}</Text></View>
              <View style={styles.prefsItem}><Text style={styles.prefsLabel}>Children</Text><Text style={styles.prefsValue}>{yn(prefs.Childrens)}</Text></View>
              <View style={styles.prefsItem}><Text style={styles.prefsLabel}>AC</Text><Text style={styles.prefsValue}>{yn(prefs.AC)}</Text></View>
              <View style={styles.prefsItem}><Text style={styles.prefsLabel}>Roof rack</Text><Text style={styles.prefsValue}>{yn(prefs.RoofRack)}</Text></View>
              <View style={styles.prefsItem}><Text style={styles.prefsLabel}>Seats (max)</Text><Text style={styles.prefsValue}>{String(maxPassengers)}</Text></View>
            </View>
          )}

          {!loadingPrefs && !prefs && (
            <Text style={styles.prefsHint}>Preferences will appear here.</Text>
          )}
        </View>

        {/* Stepper */}
        <View style={styles.stepperWrap}>
          <Text style={styles.stepperLabel}>Passengers</Text>
          <View style={styles.stepper}>
            <TouchableOpacity onPress={dec} disabled={count <= 1} style={[styles.stepBtn, count <= 1 && styles.stepBtnDisabled, { marginRight: 12 }]}>
              <Text style={styles.stepBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={[styles.stepValue, { marginHorizontal: 12 }]}>{String(count)}</Text>
            <TouchableOpacity onPress={inc} disabled={count >= maxPassengers} style={[styles.stepBtn, count >= maxPassengers && styles.stepBtnDisabled, { marginLeft: 12 }]}>
              <Text style={styles.stepBtnText}>+</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.stepperNote}>Max: {maxPassengers}</Text>
        </View>

        {/* Botón Book */}
        <View style={{ marginTop: 16 }}>
          <Boton
            disabled={actionDisabled}
            label={loadingPrefs ? 'Loading…' : (sending ? 'Booking…' : 'Book')}
            onPress={onBook}
          />
        </View>

        {/* MODAL CON CHECK VERDE EN ÉXITO */}
        <AppModal
          visible={!!alertMsg}
          message={alertMsg ?? ''}
          onClose={closeModal}
          variant={alertVariant === 'success' ? 'info' : alertVariant}
          iconName={alertVariant === 'success' ? 'checkmark-circle' : undefined}
        />
      </ScrollView>
    </View>
  );
}

const AVATAR_SIZE = 96;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '600', marginBottom: 20, textAlign: 'center' },
  content: { paddingBottom: 24 },
  avatarWrap: { alignItems: 'center', marginTop: 4, marginBottom: 10 },
  avatar: { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2, backgroundColor: '#ddd' },
  avatarPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  route: { fontSize: 16, fontWeight: '600', textAlign: 'center' },
  date: { fontSize: 12, color: '#666', textAlign: 'center', marginTop: 2 },
  price: { fontSize: 18, fontWeight: '800', textAlign: 'center', marginTop: 8 },
  desc: { fontSize: 13, color: '#333', textAlign: 'center', marginTop: 8, lineHeight: 18 },
  prefsBox: {
    marginTop: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e6e6e6',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#fafafa',
  },
  prefsTitle: { fontSize: 14, fontWeight: '700', marginBottom: 8, textAlign: 'left' },
  prefsHint: { fontSize: 12, color: '#666' },
  prefsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  prefsItem: { width: '50%', paddingHorizontal: 6, paddingVertical: 8 },
  prefsLabel: { fontSize: 12, color: '#666' },
  prefsValue: { fontSize: 14, fontWeight: '700', marginTop: 2 },
  stepperWrap: { marginTop: 20, marginBottom: 40, alignItems: 'center' },
  stepperLabel: { fontSize: 14, fontWeight: '700', marginBottom: 6 },
  stepper: { flexDirection: 'row', alignItems: 'center' },
  stepBtn: {
    width: 44,
    height: 36,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnDisabled: { opacity: 0.4 },
  stepBtnText: { fontSize: 20, fontWeight: '700' },
  stepValue: { width: 40, textAlign: 'center', fontSize: 16, fontWeight: '700' },
  stepperNote: { marginTop: 4, fontSize: 12, color: '#666' },
});