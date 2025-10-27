// /pages/Publish.tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { requestForm } from '../services/http';

// ---- Types aligned to backend JSON ----
export type TripRow = {
  IdRegistro: number; // unique id
  FromTo: string; // e.g. "Abuja / Lagos"
  DiaHora: string; // e.g. "2025-10-26 - 06:00"
  Precio: number; // price numeric
  Descripcion:string; // descripcion del viaje
  Cupos: number; // total seats
  Reservados: number; // reserved seats
  Icono: string; // MDI icon name
};

type ListTripsResponse = {
  error?: number | string | boolean;
  message?: string;
  msg?: string; // tolerant alias
  items?: TripRow[];
  data?: { items?: TripRow[] };
};

const Tab = createMaterialTopTabNavigator();

/* --------------------------------- LIST --------------------------------- */
function PublishedListTab() {
  const [items, setItems] = useState<TripRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [alertMsg, setAlertMsg] = useState<string | null>(null); // pretty error modal
  const [confirmId, setConfirmId] = useState<number | null>(null); // confirm delete modal

  const fetchTrips = useCallback(async () => {
    try {
      setLoading(true);
      const out: ListTripsResponse | any = await requestForm('/ax_list_trips.php', {});

      // error may be 0/1 or '0'/'1'
      const errVal = out?.error;
      const isError = typeof errVal !== 'undefined' ? Number(errVal) !== 0 : false;

      // items may come at root or data.items
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

  // Load once on mount
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
        {/* Row 1 */}
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
        {/* Row 2 */}
        <View style={[styles.row, { marginTop: 6 }] }>
          <Text style={styles.secondary}>{item.Descripcion}</Text>
        </View>        
        {/* Row 3 */}
        <View style={[styles.row, { marginTop: 6 }] }>
          <Text style={styles.secondary} numberOfLines={1} ellipsizeMode="tail">
            {item.DiaHora}
          </Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.secondary}>Price: {String(item.Precio)}</Text>
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

      {/* Confirm delete - Modal UI */}
      {confirmId !== null && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setConfirmId(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <MaterialCommunityIcons
                name="alert-circle-outline"
                size={36}
                color="#D32F2F"
                style={styles.modalIcon}
              />
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

      {/* Pretty error modal */}
      {Boolean(alertMsg) && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setAlertMsg(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <MaterialCommunityIcons
                name="alert-circle-outline"
                size={36}
                color="#D32F2F"
                style={styles.modalIcon}
              />
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
  // Waiting for the definitive field list.
  return (
    <View style={styles.center}>
      <Text style={styles.title}>Create new trip</Text>
      <Text style={styles.muted}>
        Send me the fields and I will build the form using our components.
      </Text>
    </View>
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

/* --------------------------------- STYLES -------------------------------- */
const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listEmpty: { flexGrow: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  muted: { color: '#666', marginTop: 6 },

  // Item as a row with straight bottom divider
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

  // Modal styles
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
});