// /pages/Publish.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';

import { requestForm } from '../services/http';
import Input from '../components/input';
import Boton from '../components/boton';
import AppModal from '../components/appModal';
import Combo from '../components/combo';

// ---- Types
export type TripRow = {
  IdRegistro: number;
  FromTo: string;
  DiaHora: string;
  Precio: number;
  Descripcion: string;
  Cupos: number;
  Reservados: number;
  Icono: string;
};

type ListTripsResponse = {
  error?: number | string | boolean;
  message?: string;
  msg?: string;
  items?: TripRow[];
  data?: { items?: TripRow[] };
};

type City = { id: number; name: string };
type CitiesResponse = {
  error?: number | string | boolean;
  msg?: string;
  cities?: City[];
};

const Tab = createMaterialTopTabNavigator();
const naira = (v: any) => {
  const n = Number(v);
  return isFinite(n) ? `₦ ${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : String(v ?? '');
};

/* ------------------------ Success modal con check ------------------------ */
function SuccessModal({
  visible,
  title,
  message,
  onClose,
}: {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <MaterialCommunityIcons
            name="check-circle-outline"
            size={36}
            color="#2E7D32"
            style={styles.modalIcon}
          />
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalMessage}>{message}</Text>
          <View style={styles.modalActionsSingle}>
            <TouchableOpacity onPress={onClose} style={[styles.modalBtn, styles.modalBtnCancel]}>
              <Text style={styles.modalBtnText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* --------------------------------- LIST --------------------------------- */
function PublishedListTab() {
  const [items, setItems] = useState<TripRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const fetchTrips = useCallback(async () => {
    try {
      setLoading(true);
      const out: ListTripsResponse | any = await requestForm('/ax_list_trips.php', {});
      const isError = typeof out?.error !== 'undefined' ? Number(out.error) !== 0 : false;

      const list: TripRow[] = Array.isArray(out?.items)
        ? (out.items as TripRow[])
        : Array.isArray(out?.data?.items)
        ? (out.data.items as TripRow[])
        : [];

      if (isError) {
        setItems([]);
        setAlertMsg(out?.message || out?.msg || 'Could not load trips list');
      } else {
        setItems(list);
      }
    } catch (e: any) {
      setItems([]);
      setAlertMsg(e?.message || 'Unexpected error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTrips();
    setRefreshing(false);
  }, [fetchTrips]);

  const handleConfirmDelete = useCallback(async () => {
    if (confirmId == null) return;
    try {
      const out: any = await requestForm('/ax_delete_trip.php', { IdRegistro: confirmId });
      const isError = typeof out?.error !== 'undefined' ? Number(out.error) !== 0 : false;
      if (isError) {
        setAlertMsg(out?.message || out?.msg || 'Could not delete the trip');
      } else {
        setItems((prev) => prev.filter((it) => it.IdRegistro !== confirmId));
      }
    } catch (e: any) {
      setAlertMsg(e?.message || 'Unexpected error');
    } finally {
      setConfirmId(null);
    }
  }, [confirmId]);

  const renderItem = useCallback(({ item }: { item: TripRow }) => {
    return (
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.primary} numberOfLines={1} ellipsizeMode="tail">
            {item.FromTo}
          </Text>

          <View style={styles.rightIcons}>
            <MaterialCommunityIcons name={item.Icono as any} size={22} />
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Delete"
              onPress={() => setConfirmId(item.IdRegistro)}
              hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
              style={styles.deleteBtn}
            >
              <MaterialCommunityIcons name="trash-can-outline" size={22} color="#D32F2F" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.row, { marginTop: 6 }]}>
          <Text style={styles.secondary}>{item.Descripcion}</Text>
        </View>

        <View style={[styles.row, { marginTop: 6 }]}>
          <Text style={styles.secondary} numberOfLines={1} ellipsizeMode="tail">
            {item.DiaHora}
          </Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.secondary}>Price: {String(naira(item.Precio))}</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.secondary}>Seats:  {item.Cupos} / {item.Reservados}</Text>
        </View>
      </View>
    );
  }, []);

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text style={styles.muted}>Loading trips…</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => String(it.IdRegistro)}
          renderItem={renderItem}
          contentContainerStyle={items.length === 0 ? styles.listEmpty : undefined}
          ListEmptyComponent={<Text style={styles.muted}>No trips published.</Text>}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Confirm delete */}
      {confirmId !== null && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setConfirmId(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <MaterialCommunityIcons name="alert-circle-outline" size={36} color="#D32F2F" style={styles.modalIcon} />
              <Text style={styles.modalTitle}>Delete trip?</Text>
              <Text style={styles.modalMessage}>
                If the trip has passengers, this will result in a bad rating for you, the passenger will be refunded.
              </Text>
              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => setConfirmId(null)} style={[styles.modalBtn, styles.modalBtnCancel]}>
                  <Text style={styles.modalBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleConfirmDelete} style={[styles.modalBtn, styles.modalBtnDelete]}>
                  <Text style={[styles.modalBtnText, styles.modalBtnTextDelete]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Error modal simple */}
      {Boolean(alertMsg) && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setAlertMsg(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <MaterialCommunityIcons name="alert-circle-outline" size={36} color="#D32F2F" style={styles.modalIcon} />
              <Text style={styles.modalTitle}>Error</Text>
              <Text style={styles.modalMessage}>{alertMsg}</Text>
              <View style={styles.modalActionsSingle}>
                <TouchableOpacity onPress={() => setAlertMsg(null)} style={[styles.modalBtn, styles.modalBtnDelete]}>
                  <Text style={[styles.modalBtnText, styles.modalBtnTextDelete]}>OK</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

/* -------------------------------- FORM TAB ------------------------------- */
function CreateTripTab() {
  // state
  const [cities, setCities] = useState<City[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [fromCity, setFromCity] = useState<City | null>(null);
  const [toCity, setToCity] = useState<City | null>(null);
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<Date | null>(null);
  const [description, setDescription] = useState('');
  const [priceText, setPriceText] = useState('');
  const [seats, setSeats] = useState(1);
  const [sending, setSending] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [okModal, setOkModal] = useState<{ visible: boolean; msg: string }>({ visible: false, msg: '' });

  // pickers & modals
  const [datePickerOpen, setDatePickerOpen] = useState(false); // iOS sheet
  const [timePickerOpen, setTimePickerOpen] = useState(false); // iOS sheet
  const [tempDate, setTempDate] = useState<Date | null>(null); // iOS temp buffer
  const [tempTime, setTempTime] = useState<Date | null>(null); // iOS temp buffer

  const [appModal, setAppModal] = useState<{ visible: boolean; title: string; message: string }>(
    { visible: false, title: '', message: '' }
  );

  // helpers
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const formatDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const formatTime = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

  const cityOptions = useMemo(() => cities.map((c) => ({ label: c.name, value: String(c.id) })), [cities]);

  const loadCities = useCallback(async () => {
    try {
      setLoadingCities(true);
      const out: CitiesResponse | any = await requestForm('/ax_cities.php', {});
      const isError = typeof out?.error !== 'undefined' ? Number(out.error) !== 0 : false;
      const list: City[] = Array.isArray(out?.cities) ? (out.cities as City[]) : [];
      if (isError) throw new Error(out?.msg || 'Could not load cities');
      setCities(list);
    } catch (e: any) {
      setCities([]);
      setAppModal({ visible: true, title: 'Error', message: e?.message || 'Unexpected error loading cities' });
    } finally {
      setLoadingCities(false);
    }
  }, []);

  useEffect(() => {
    loadCities();
  }, [loadCities]);

  const clearErr = useCallback((k: string) => {
    setFieldErrors((prev) => {
      if (!prev[k]) return prev;
      const n = { ...prev };
      delete n[k];
      return n;
    });
  }, []);

  const validate = useCallback(() => {
    const errs: Record<string, string> = {};
    if (!fromCity) errs.fromCity = 'Select origin city';
    if (!toCity) errs.toCity = 'Select destination city';
    if (fromCity && toCity && fromCity.id === toCity.id) errs.toCity = 'Cities cannot be the same';
    if (!description.trim()) errs.description = 'Description is required';
    const price = parseFloat(String(priceText).replace(',', '.'));
    if (!price || price <= 0) errs.price = 'Price must be greater than 0';
    if (!date) errs.date = 'Select a date';
    if (!time) errs.time = 'Select a time';
    if (date) {
      const d0 = new Date(date); d0.setHours(0, 0, 0, 0);
      if (d0 < today) errs.date = 'Date cannot be in the past';
    }
    if (date && time) {
      const combined = new Date(date);
      combined.setHours(time.getHours(), time.getMinutes(), 0, 0);
      const now = new Date();
      if (combined < now) errs.time = 'Time cannot be earlier than now';
    }
    if (!seats || seats < 1) errs.seats = 'At least 1 seat';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }, [fromCity, toCity, description, priceText, date, time, seats, today]);

  // --------- Open pickers (Android usa dialogs nativos; iOS usa sheet modal) ---------
  const openDatePicker = () => {
    clearErr('date');
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: date || today,
        onChange: (_, d) => { if (d) setDate(d); },
        mode: 'date',
        minimumDate: today,
      });
    } else {
      setTempDate(date || today);
      setDatePickerOpen(true);
    }
  };

  const openTimePicker = () => {
    clearErr('time');
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: time || new Date(),
        onChange: (_, d) => { if (d) setTime(d); },
        mode: 'time',
        is24Hour: true,
      });
    } else {
      setTempTime(time || new Date());
      setTimePickerOpen(true);
    }
  };

  const handleSave = useCallback(async () => {
    if (sending) return;

    if (fromCity && toCity && fromCity.id === toCity.id) {
      setAppModal({ visible: true, title: 'Error', message: 'Origin and destination cannot be the same.' });
      return;
    }
    if (!validate()) return;

    try {
      setSending(true);
      const payload = {
        IdFromCiudad: fromCity!.id,
        IdToCiudad: toCity!.id,
        Fecha: formatDate(date!),
        Hora: formatTime(time!),
        Descripcion: description.trim(),
        Precio: parseFloat(String(priceText).replace(',', '.')),
        Cupos: seats,
      };

      const out: any = await requestForm('/ax_create_trip.php', payload);
      const isError = typeof out?.error !== 'undefined' ? Number(out.error) !== 0 : false;
      if (isError) {
        setAppModal({ visible: true, title: 'Error', message: out?.message || out?.msg || 'Could not publish trip' });
        return;
      }

      setOkModal({ visible: true, msg: out?.message || out?.msg || 'Trip published successfully.' });

      // reset
      setFromCity(null);
      setToCity(null);
      setDate(null);
      setTime(null);
      setDescription('');
      setPriceText('');
      setSeats(1);
      setFieldErrors({});
    } catch (e: any) {
      setAppModal({ visible: true, title: 'Error', message: e?.message || 'Unexpected error' });
    } finally {
      setSending(false);
    }
  }, [validate, fromCity, toCity, date, time, description, priceText, seats, sending]);

  const selectedDateLabel = date ? formatDate(date) : 'Select date';
  const selectedTimeLabel = time ? formatTime(time) : 'Select time';

  return (
    <ScrollView contentContainerStyle={{ padding: 12 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>
      {/* From */}
      <View style={styles.field}>
        <Combo
          label="From"
          items={cityOptions}
          value={fromCity ? String(fromCity.id) : ''}
          onChange={(val: string) => {
            const c = cities.find((x) => String(x.id) === String(val)) || null;
            setFromCity(c);
            clearErr('fromCity');
            if (c && toCity && c.id === toCity.id) {
              setAppModal({ visible: true, title: 'Error', message: 'Origin and destination cannot be the same.' });
            }
          }}
          placeholder={loadingCities ? 'Loading…' : 'Select city'}
        />
        {fieldErrors.fromCity ? <FieldErrorBubble text={fieldErrors.fromCity} /> : null}
      </View>

      {/* To */}
      <View style={styles.field}>
        <Combo
          label="To"
          items={cityOptions}
          value={toCity ? String(toCity.id) : ''}
          onChange={(val: string) => {
            const c = cities.find((x) => String(x.id) === String(val)) || null;
            setToCity(c);
            clearErr('toCity');
            if (fromCity && c && fromCity.id === c.id) {
              setAppModal({ visible: true, title: 'Error', message: 'Origin and destination cannot be the same.' });
            }
          }}
          placeholder={loadingCities ? 'Loading…' : 'Select city'}
        />
        {fieldErrors.toCity ? <FieldErrorBubble text={fieldErrors.toCity} /> : null}
      </View>

      {/* Date */}
      <Label style={styles.field}>Date</Label>
      <TouchableOpacity style={styles.inputLike} onPress={openDatePicker}>
        <Text style={styles.inputLikeText}>{selectedDateLabel}</Text>
      </TouchableOpacity>
      {fieldErrors.date ? <FieldErrorBubble text={fieldErrors.date} /> : null}

      {/* Time */}
      <Label style={styles.field}>Time</Label>
      <TouchableOpacity style={styles.inputLike} onPress={openTimePicker}>
        <Text style={styles.inputLikeText}>{selectedTimeLabel}</Text>
      </TouchableOpacity>
      {fieldErrors.time ? <FieldErrorBubble text={fieldErrors.time} /> : null}

      {/* Description */}
      <Label style={styles.field}>Description</Label>
      <Input
        value={description}
        onChangeText={(t: string) => { setDescription(t); clearErr('description'); }}
        placeholder="Trip description"
      />
      {fieldErrors.description ? <FieldErrorBubble text={fieldErrors.description} /> : null}

      {/* Price */}
      <Label style={styles.field}>Price</Label>
      <Input
        value={priceText}
        onChangeText={(t: string) => { setPriceText(t); clearErr('price'); }}
        placeholder="0"
        keyboardType="numeric"
        maxlenght={10}  // <-- como lo usás en tu Input
      />
      {fieldErrors.price ? <FieldErrorBubble text={fieldErrors.price} /> : null}

      {/* Seats */}
      <Label style={styles.field}>Seats (max. 6)</Label>
      <View style={[styles.seatsRow, { alignSelf: 'flex-start' }]}>
        <TouchableOpacity
          onPress={() => { setSeats((v) => Math.max(1, v - 1)); clearErr('seats'); }}
          style={[styles.stepBtn, { opacity: seats <= 1 ? 0.4 : 1 }]}
          disabled={seats <= 1}
        >
          <Text style={styles.stepBtnText}>-</Text>
        </TouchableOpacity>
        <Text style={styles.seatsValue}>{seats}</Text>
        <TouchableOpacity
          onPress={() => { setSeats((v) => Math.min(6, v + 1)); clearErr('seats'); }}
          style={[styles.stepBtn, { opacity: seats >= 6 ? 0.4 : 1 }]}
          disabled={seats >= 6}
        >
          <Text style={styles.stepBtnText}>+</Text>
        </TouchableOpacity>
      </View>
      {fieldErrors.seats ? <FieldErrorBubble text={fieldErrors.seats} /> : null}

      {/* Save (mismo botón y colores) */}
      <View
        style={[styles.btnWrap, { marginTop: 20, marginBottom: 40 }]}
        pointerEvents={sending ? 'none' : 'auto'}
        accessible
        accessibilityState={{ disabled: sending }}
        importantForAccessibility={sending ? 'no-hide-descendants' : 'yes'}
      >
        <Boton
          label={sending ? 'Wait…' : 'Publish Trip'}
          onPress={!sending ? handleSave : undefined}
        />
        {sending && <View style={styles.btnBlocker} pointerEvents="auto" />}
      </View>

      {/* iOS: Sheet de fecha */}
      {Platform.OS === 'ios' && datePickerOpen && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setDatePickerOpen(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCardPicker}>
              <View style={styles.sheetHeader}>
                <TouchableOpacity onPress={() => setDatePickerOpen(false)} style={styles.sheetBtn}>
                  <Text style={styles.sheetBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { if (tempDate) setDate(tempDate); setDatePickerOpen(false); }}
                  style={styles.sheetBtn}
                >
                  <Text style={[styles.sheetBtnText, { fontWeight: '700' }]}>OK</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempDate || date || today}
                mode="date"
                display="spinner"
                minimumDate={today}
                onChange={(_, d) => { if (d) setTempDate(d); }}
                style={{ alignSelf: 'stretch' }}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* iOS: Sheet de hora */}
      {Platform.OS === 'ios' && timePickerOpen && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setTimePickerOpen(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCardPicker}>
              <View style={styles.sheetHeader}>
                <TouchableOpacity onPress={() => setTimePickerOpen(false)} style={styles.sheetBtn}>
                  <Text style={styles.sheetBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { if (tempTime) setTime(tempTime); setTimePickerOpen(false); }}
                  style={styles.sheetBtn}
                >
                  <Text style={[styles.sheetBtnText, { fontWeight: '700' }]}>OK</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempTime || time || new Date()}
                mode="time"
                display="spinner"
                onChange={(_, d) => { if (d) setTempTime(d); }}
                style={{ alignSelf: 'stretch' }}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Error backend simple */}
      <AppModal
        visible={appModal.visible}
        title={appModal.title}
        message={appModal.message}
        onClose={() => setAppModal({ visible: false, title: '', message: '' })}
      />

      {/* Success con check */}
      <SuccessModal
        visible={okModal.visible}
        title="Success"
        message={okModal.msg}
        onClose={() => setOkModal({ visible: false, msg: '' })}
      />
    </ScrollView>
  );
}

/* ------------------------------ PUBLISH PAGE ----------------------------- */
export default function Publish() {
  return (
    <Tab.Navigator
      initialRouteName="Published"
      screenOptions={{
        tabBarIndicatorStyle: { backgroundColor: '#333' },
        tabBarLabelStyle: { fontWeight: '600' },
      }}
    >
      <Tab.Screen name="Published" component={PublishedListTab} />
      <Tab.Screen name="Create" component={CreateTripTab} />
    </Tab.Navigator>
  );
}

/* ------------------------------ UI HELPERS ----------------------------- */
const Label = ({ children, style }: { children: React.ReactNode; style?: any }) => (
  <Text style={[{ fontWeight: '600', marginBottom: 4 }, style]}>{children}</Text>
);

const FieldErrorBubble = ({ text }: { text: string }) => (
  <View style={styles.bubbleWrap}>
    <View style={styles.bubble}>
      <Text style={styles.bubbleText}>{text}</Text>
    </View>
    <View style={styles.bubbleArrow} />
  </View>
);

/* --------------------------------- STYLES -------------------------------- */
const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listEmpty: { flexGrow: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  muted: { color: '#666', marginTop: 6 },

  card: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 0,
    backgroundColor: 'transparent',
    elevation: 0,
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e6e6e6',
  },

  row: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rightIcons: { flexDirection: 'row', alignItems: 'center' },
  deleteBtn: { marginLeft: 12, padding: 2 },
  primary: { fontSize: 16, fontWeight: '700', flexShrink: 1 },
  secondary: { fontSize: 13, color: '#333' },
  dot: { marginHorizontal: 6, color: '#999' },

  inputLike: {
    borderWidth: 1,
    borderColor: '#cfcfcf',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  inputLikeText: { color: '#111' },

  seatsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  stepBtn: {
    borderWidth: 1,
    borderColor: '#cfcfcf',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  stepBtnText: { fontSize: 18, fontWeight: '700' },
  seatsValue: { width: 48, textAlign: 'center', fontSize: 18, fontWeight: '700' },

  bubbleWrap: { position: 'relative', marginTop: 6 },
  bubble: {
    backgroundColor: '#fdecea',
    borderColor: '#d32f2f',
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  bubbleText: { color: '#b3261e', fontSize: 12 },
  bubbleArrow: {
    position: 'absolute',
    top: -6,
    left: 12,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 6,
    borderStyle: 'solid',
    backgroundColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#d32f2f',
  },

  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCard: {
    width: '88%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    alignItems: 'center',
  },
  // Picker wrapper iOS
  modalCardPicker: {
    width: '88%',
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  sheetBtn: { paddingVertical: 4, paddingHorizontal: 6 },
  sheetBtnText: { fontSize: 16, color: '#007AFF' },

  modalIcon: { marginBottom: 8 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalMessage: { marginTop: 6, color: '#333', textAlign: 'center' },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    alignSelf: 'stretch',
  },
  modalActionsSingle: { marginTop: 14, alignSelf: 'stretch', alignItems: 'center' },
  modalBtn: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 10, borderWidth: 1 },
  modalBtnCancel: { borderColor: '#cfcfcf', backgroundColor: '#fff' },
  modalBtnDelete: { borderColor: '#D32F2F', backgroundColor: '#FDECEA' },
  modalBtnText: { fontWeight: '600', color: '#333' },
  modalBtnTextDelete: { color: '#D32F2F', fontWeight: '700' },

  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },

  field: { marginTop: 20 },

  // Botón
  btnWrap: {
    borderRadius: 12,
    overflow: 'hidden',
    alignSelf: 'stretch',
  },
  btnBlocker: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
});