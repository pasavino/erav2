// /components/combo.tsx
import React, { useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export type ComboItem = { label: string; value: string };

type Props = {
  label?: string;
  items: ComboItem[];
  value?: string | null;
  onChange: (val: string) => void;
  placeholder?: string;
  disabled?: boolean;
  modalTitle?: string;
};

/**
 * Combo genérico (igual patrón visual que Home):
 * - Caja tocable con borde y chevron
 * - Modal con buscador y lista
 */
export default function Combo({
  label,
  items,
  value = '',
  onChange,
  placeholder = 'Select…',
  disabled = false,
  modalTitle,
}: Props) {
  const [open, setOpen] = useState(false);

  const selected = useMemo(() => items.find((it) => String(it.value) === String(value)) || null, [items, value]);

  const filtered = items;

  return (
    <View>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => !disabled && setOpen(true)}
        style={[styles.inputLike, disabled && { opacity: 0.5 }]}
        accessibilityRole="button"
        accessibilityLabel={label || placeholder}
        disabled={disabled}
      >
        <Text style={styles.inputLikeText} numberOfLines={1} ellipsizeMode="tail">
          {selected ? selected.label : placeholder}
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={22} />
      </TouchableOpacity>

      {open && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setOpen(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { width: '92%' }]}>
              <Text style={[styles.modalTitle, { alignSelf: 'flex-start' }]}>
                {modalTitle || label || 'Select an option'}
              </Text>

              
              <View style={{ maxHeight: 320, alignSelf: 'stretch', marginTop: 8 }}>
                <FlatList
                  data={filtered}
                  keyExtractor={(it) => String(it.value)}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.row}
                      onPress={() => {
                        onChange(String(item.value));
                        setOpen(false);                      }}
                    >
                      <MaterialCommunityIcons name="map-marker-outline" size={18} style={{ marginRight: 8 }} />
                      <Text style={{ fontSize: 15 }} numberOfLines={1} ellipsizeMode="tail">{item.label}</Text>
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={<Text style={styles.muted}>No results</Text>}
                />
              </View>

              <View style={[styles.modalActions, { marginTop: 16 }]}>
                <TouchableOpacity onPress={() => setOpen(false)} style={[styles.modalBtn, styles.modalBtnCancel]}>
                  <Text style={styles.modalBtnText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontWeight: '600', marginBottom: 4 },
  inputLike: {
    borderWidth: 1,
    borderColor: '#cfcfcf',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputLikeText: { color: '#111', flex: 1, marginRight: 8 },

  // Modal styles (idénticos a los que usamos en Publish/Home)
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
  modalTitle: { fontSize: 18, fontWeight: '700' },
  muted: { color: '#666', marginTop: 6, alignSelf: 'center' },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignSelf: 'stretch',
  },
  modalBtn: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 10, borderWidth: 1 },
  modalBtnCancel: { borderColor: '#cfcfcf', backgroundColor: '#fff' },
  modalBtnText: { fontWeight: '600', color: '#333' },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
});