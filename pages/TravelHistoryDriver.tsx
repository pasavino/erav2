// /pages/HistoryTrip.tsx
// Historial de viajes del driver
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TouchableOpacity,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { requestForm, ensureOk } from '../services/http';

type TripRow = {
  IdRegistro: number;
  IdViaje: number;
  NomDriver: string;
  CntAcientos: number;
  CntValijas: number;
  FromTo: string;
  PrecioViaje: number;
  PrecioValija: number;
  Total: number;
  FechaViaje: string; // YYYY-MM-DD
  HoraViaje: string;  // "09:00 AM"
  icono: string;      // ej: "calendar-check"
  Estado: number;     // ej: Estado para saber que texto poner en la confirmacion de borrado
};

type ApiResp = { data: TripRow[] };

const PAGE_SIZE = 5;

const naira = (v: any) => {
  const n = Number(v);
  return isFinite(n) ? `₦ ${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : String(v ?? '');
};

export default function HistoryTrip() {
  // listado
  const [items, setItems] = useState<TripRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // infinito
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // confirmación de borrado
  const [confirmItem, setConfirmItem] = useState<TripRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  // popup de error (igual patrón que Car.tsx)
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchPage = useCallback(async (p: number, isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else if (p === 1) setLoading(true);
      else setLoadingMore(true);

      const res = await ensureOk<ApiResp>(
        requestForm('/ax_HistoryTrip.php', { page: p, pageSize: PAGE_SIZE })
      );
      const batch = Array.isArray(res.data) ? res.data : [];

      setHasMore(batch.length === PAGE_SIZE);
      setItems(prev =>
        p === 1 ? batch : [...prev, ...batch.filter(n => !prev.some(x => x.IdRegistro === n.IdRegistro))]
      );
      setPage(p);
    } catch (e: any) {
      setErrorMsg(e?.message || 'Network error');
      if (p === 1) {
        setItems([]);
        setHasMore(false);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPage(1);
  }, [fetchPage]);

  const onRefresh = useCallback(() => {
    setHasMore(true);
    fetchPage(1, true);
  }, [fetchPage]);

  const onEndReached = useCallback(() => {
    if (!loading && !loadingMore && hasMore) {
      fetchPage(page + 1);
    }
  }, [loading, loadingMore, hasMore, page, fetchPage]);

  const askDelete = (item: TripRow) => {
    if (deleting) return;
    setConfirmItem(item);
  };

  const confirmDelete = async () => {
    if (!confirmItem || deleting) return;
    setDeleting(true);
    try {
      const res = await requestForm('/ax_deleteHistoryTrip.php', {
        IdRegistro: String(confirmItem.IdRegistro),
      });

      if (!res || res.error !== 0) {
        setErrorMsg(res?.msg || 'Delete failed');
        return;
      }

      // éxito: quitar de la lista
      setItems(prev => prev.filter(r => r.IdRegistro !== confirmItem.IdRegistro));
    } catch (e: any) {
      setErrorMsg(e?.message || 'Delete failed');
    } finally {
      setConfirmItem(null);
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.muted}>Loading your trips…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(it) => String(it.IdRegistro)}
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.card}>
            <Text style={styles.muted}>You don't have trip history yet.</Text>
          </View>
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.2}
        ListFooterComponent={
          loadingMore ? <View style={styles.footerLoad}><ActivityIndicator /></View> : <View style={{ height: 12 }} />
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            {/* Icono a la izquierda (según JSON) */}
            <MaterialCommunityIcons
              name={item.icono as any}
              size={22}
              color={item.Estado === 1 ? '#16a34a' : '#111827'}
              style={{ marginRight: 8 }}
            />
            {/* Contenido en múltiples renglones */}
            <View style={{ flex: 1 }}>
              <Text style={styles.name} numberOfLines={1}>{item.FromTo}</Text>
              <Text style={styles.subtitle}>{item.FechaViaje} • {item.HoraViaje}</Text>
              <Text style={styles.subtitle}>Driver: {String(item.NomDriver ?? '').trim()}</Text>
              <Text style={styles.subtitle}>
                Seats: {item.CntAcientos} • Bags: {item.CntValijas} • Total: {naira(item.Total)}
              </Text>
            </View>

            {/* Eliminar a la derecha (mismo patrón que Car.tsx) */}
            <TouchableOpacity
              onPress={() => askDelete(item)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="trash-outline" size={22} color="#b91c1c" />
            </TouchableOpacity>
          </View>
        )}
      />

      {/* Modal confirmación (look & feel como Car.tsx) */}
      <Modal
        visible={!!confirmItem}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmItem(null)}
      >
        <View style={styles.overlay}>
          <View style={styles.modalCardPretty}>
            <Ionicons name="alert-circle" size={36} color="#D32F2F" style={styles.modalIcon} />
            <Text style={styles.modalTitle}>Delete trip?</Text>

            {confirmItem && confirmItem.Estado >= 2 ? (
              <Text style={styles.modalMessage}>
                Are you sure you want to delete the trip?
              </Text>
            ) : (
              <Text style={styles.modalMessage}>
                If the trip has reservations, the passenger will be notified of your cancellation.{'\n'}
                <Text style={styles.bold}>You will have a bad reputation.</Text>
              </Text>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setConfirmItem(null)}
                disabled={deleting}
                style={[styles.modalBtn, styles.modalBtnCancel, deleting && styles.btnDisabled]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={confirmDelete}
                disabled={deleting}
                style={[styles.modalBtn, styles.modalBtnDelete, deleting && styles.btnDisabled]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={[styles.modalBtnText, styles.modalBtnTextDelete]}>
                  {deleting ? 'Deleting…' : 'Delete'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de error (mismo patrón que Car.tsx) */}
      <Modal
        visible={!!errorMsg}
        transparent
        animationType="fade"
        onRequestClose={() => setErrorMsg(null)}
      >
        <View style={styles.overlay}>
          <View style={styles.modalCardPretty}>
            <Ionicons name="alert-circle" size={36} color="#D32F2F" style={styles.modalIcon} />
            <Text style={styles.modalTitle}>Error</Text>
            <Text style={styles.modalMessage}>{errorMsg}</Text>
            <View style={styles.modalActionsSingle}>
              <TouchableOpacity
                onPress={() => setErrorMsg(null)}
                style={[styles.modalBtn, styles.modalBtnDelete]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={[styles.modalBtnText, styles.modalBtnTextDelete]}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  // MISMA estructura que Car.tsx
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  bold: { fontWeight: '700'},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: { fontSize: 22, fontWeight: '600' },

  // listado
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 12,
  },
  name: { fontSize: 16, fontWeight: '600', color: '#111827' },
  subtitle: { color: '#6b7280', marginTop: 2 },
  muted: { color: '#6b7280' },
  separator: { height: 6 },

  // tarjeta vacío
  card: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 12,
  },

  // loading pie de lista
  footerLoad: { paddingVertical: 16, alignItems: 'center' },

  // modales (igual look & feel que Car.tsx)
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCardPretty: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    alignItems: 'center',
  },
  modalIcon: { marginBottom: 8 },
  modalTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  modalMessage: { marginTop: 6, color: '#333', textAlign: 'center' },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
    alignSelf: 'stretch',
  },
  modalActionsSingle: {
    marginTop: 14,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  modalBtn: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 10, borderWidth: 1 },
  modalBtnCancel: { borderColor: '#cfcfcf', backgroundColor: '#fff' },
  modalBtnDelete: { borderColor: '#D32F2F', backgroundColor: '#FDECEA' },
  modalBtnText: { fontWeight: '600', color: '#333' },
  modalBtnTextDelete: { color: '#D32F2F', fontWeight: '700' },
  btnDisabled: { opacity: 0.5 },
});