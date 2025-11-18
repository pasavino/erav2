// /pages/Notifications.tsx
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

type NotificationRow = {
  IdRegistro: number;
  Icono: string;
  Mensaje: string;
  Fecha: string;
};

type ApiResp = {
  error: number;
  msg: string;
  data: NotificationRow[];
  page: number;
  pageSize: number;
  hasMore: boolean;
  nextPage: number | null;
};

const PAGE_SIZE = 5;

export default function Notifications() {
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // infinito
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // popup de error
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // id que se está borrando
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchPage = useCallback(async (p: number, isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else if (p === 1) setLoading(true);
      else setLoadingMore(true);

      const res = await ensureOk<ApiResp>(
        requestForm('/ax_ListaNotificaciones.php', { page: p, pageSize: PAGE_SIZE })
      );

      const batch = Array.isArray(res.data) ? res.data : [];

      // usamos hasMore del backend
      setHasMore(Boolean(res.hasMore));

      setItems(prev =>
        p === 1
          ? batch
          : [
              ...prev,
              ...batch.filter(
                n => !prev.some(x => x.IdRegistro === n.IdRegistro)
              ),
            ]
      );

      setPage(res.page || p);
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

  const handleDeleteNotification = useCallback(
    async (id: number) => {
      if (deletingId !== null) return;
      setDeletingId(id);

      try {
        // ajusta la URL si tu script se llama distinto
        const res: any = await requestForm('/ax_deleteNotification.php', {
          IdRegistro: String(id),
        });

        if (!res || res.error !== 0) {
          setErrorMsg(res?.msg || 'Delete failed');
          return;
        }

        // éxito: sacar de la lista
        setItems(prev => prev.filter(n => n.IdRegistro !== id));
      } catch (e: any) {
        setErrorMsg(e?.message || 'Delete failed');
      } finally {
        setDeletingId(null);
      }
    },
    [deletingId]
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.muted}>Loading your notifications…</Text>
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
            <Text style={styles.muted}>You don't have notifications yet.</Text>
          </View>
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.2}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoad}>
              <ActivityIndicator />
            </View>
          ) : (
            <View style={{ height: 12 }} />
          )
        }
        renderItem={({ item }) => {
          const iconName = (item.Icono || 'bell-badge') as any;
          const isDeleting = deletingId === item.IdRegistro;

          return (
            <View style={styles.row}>
              {/* Icono izquierda */}
              <MaterialCommunityIcons
                name={iconName}
                size={22}
                color="#859606ff"
                style={{ marginRight: 8, marginTop: 2 }}
              />

              {/* Contenido */}
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, styles.unreadTitle]} numberOfLines={7}>
                  {item.Mensaje}
                </Text>
                {!!item.Fecha && (
                  <Text style={styles.subtitle}>{item.Fecha}</Text>
                )}
              </View>

              {/* Botón delete a la derecha (igual idea que HistoryTrip) */}
              <TouchableOpacity
                onPress={() => handleDeleteNotification(item.IdRegistro)}
                disabled={isDeleting}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" />
                ) : (
                  <Ionicons name="trash-outline" size={22} color="#b91c1c" />
                )}
              </TouchableOpacity>
            </View>
          );
        }}
      />

      {/* Modal de error (igual patrón que HistoryTrip / Car.tsx) */}
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
  // MISMA estructura que HistoryTrip / Car.tsx
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  bold: { fontWeight: '700' },
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
  name: { fontSize: 16, fontWeight: '500', color: '#111827' },
  unreadTitle: { fontWeight: '700' },
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

  // modales
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
  modalActionsSingle: {
    marginTop: 14,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  modalBtn: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 10, borderWidth: 1 },
  modalBtnDelete: { borderColor: '#D32F2F', backgroundColor: '#FDECEA' },
  modalBtnText: { fontWeight: '600', color: '#333' },
  modalBtnTextDelete: { color: '#D32F2F', fontWeight: '700' },
  btnDisabled: { opacity: 0.5 },
});