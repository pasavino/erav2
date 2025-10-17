// pages/Car.tsx
import React, { useEffect, useState, useCallback } from 'react';
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
import { useNavigation } from '@react-navigation/native';

import Boton from '../components/boton';
import { requestForm, ensureOk } from '../services/http';
import { useAuth } from '../context/Auth';

type Vehicle = {
  IdVehiculo: number;
  Nombre?: string;
  nombre?: string;
  Modelo?: string;
  ModelDesc?: string;
  ColorHex?: string;
  CodigoColor?: string;
};

export default function Car() {
  const navigation = useNavigation<any>();
  const { user } = useAuth() as any; // se asume user.IdUsuario disponible
  const IdUsuario = String(user?.IdUsuario ?? '');

  const [items, setItems] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Confirmación de borrado
  const [confirmItem, setConfirmItem] = useState<Vehicle | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Popup de error
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const data = await ensureOk<{ items: Vehicle[] }>(
        requestForm('/ax_lista_vehiculos.php', {}) // token va automático (http.ts)
      );
      setItems(data.items ?? []);
    } catch (e: any) {
      setErrorMsg(e.message || 'Network error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const handleAdd = () => {
    navigation.navigate('AddVehicle'); // navega por NOMBRE de ruta
  };

  const askDelete = (item: Vehicle) => {
    if (deleting) return;
    setConfirmItem(item);
  };

  const confirmDelete = async () => {
    if (!confirmItem || deleting) return;
    try {
      setDeleting(true);
      await ensureOk(
        requestForm('/ax_delete_vehiculos.php', { // 👈 endpoint validado
          IdVehiculo: String(confirmItem.IdVehiculo),
          // IdUsuario opcional si el backend usa Auth_Require()
        })
      );
      // Éxito: quitamos localmente
      setItems((prev) => prev.filter((v) => v.IdVehiculo !== confirmItem.IdVehiculo));
      setConfirmItem(null);
    } catch (e: any) {
      // Cerrar confirmación y mostrar error en popup
      setConfirmItem(null);
      setErrorMsg(e.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.muted}>Loading your vehicles...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header con botón para agregar más vehículos */}
      <View style={styles.header}>
        <Text style={styles.title}>Your vehicles</Text>
        <Boton label="Add Vehicle" onPress={handleAdd} />
      </View>

      <FlatList
        data={items}
        keyExtractor={(it) => String(it.IdVehiculo)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.card}>
            <Text style={styles.muted}>You don't have any vehicles yet.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const name = item.Nombre ?? item.nombre ?? 'Vehicle';
          const model = item.Modelo ?? item.ModelDesc ?? '';
          const color = item.ColorHex ?? item.CodigoColor ?? '#999';
          return (
            <View style={styles.row}>
              <View style={[styles.colorDot, { backgroundColor: color }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{name}</Text>
                {model ? <Text style={styles.subtitle}>{model}</Text> : null}
              </View>
              <TouchableOpacity
                onPress={() => askDelete(item)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="trash-outline" size={22} color="#b91c1c" />
              </TouchableOpacity>
            </View>
          );
        }}
      />

      {/* Modal de confirmación */}
      <Modal
        visible={!!confirmItem}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmItem(null)}
      >
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconRow}>
              <Ionicons name="alert-circle" size={28} />
            </View>
            <Text style={styles.modalTitle}>Delete vehicle?</Text>
            <Text style={styles.modalMsg}>
              Are you sure you want to delete this vehicle?
              If the vehicle has assigned trips, it cannot be deleted.
            </Text>

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.btnGhost, deleting && styles.btnDisabled]}
                disabled={deleting}
                onPress={() => {
                  if (!deleting) setConfirmItem(null);
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.btnGhostText}>Cancel</Text>
              </TouchableOpacity>

              {/* Si Boton no tiene 'disabled'; lo desactivamos con pointerEvents */}
              <View
                style={[deleting && styles.btnDisabled, { borderRadius: 10 }]}
                pointerEvents={deleting ? 'none' : 'auto'}
              >
                <Boton label={deleting ? 'Deleting...' : 'Delete'} onPress={confirmDelete} />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de error */}
      <Modal
        visible={!!errorMsg}
        transparent
        animationType="fade"
        onRequestClose={() => setErrorMsg(null)}
      >
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconRow}>
              <Ionicons name="close-circle" size={28} color="#b91c1c" />
            </View>
            <Text style={styles.modalTitle}>Something went wrong</Text>
            <Text style={styles.modalMsg}>{errorMsg}</Text>
            <View style={[styles.modalBtns, { justifyContent: 'center' }]}>
              <Boton label="OK" onPress={() => setErrorMsg(null)} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: { fontSize: 22, fontWeight: '600' },

  card: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 12,
  },
  muted: { color: '#6b7280' },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 12,
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  name: { fontSize: 16, fontWeight: '600' },
  subtitle: { color: '#6b7280' },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    gap: 10,
  },
  modalIconRow: { alignItems: 'center', marginBottom: 4 },
  modalTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  modalMsg: { textAlign: 'center', color: '#4b5563' },

  modalBtns: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  btnGhost: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  btnGhostText: { color: '#111827', fontWeight: '600', textAlign: 'center' },
  btnDisabled: { opacity: 0.5 },
});