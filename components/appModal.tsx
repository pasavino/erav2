// /components/appModal.tsx
import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

export type ModalAction = {
  label: string;
  onPress: () => void;
  variant?: 'default' | 'danger' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  testID?: string;
};

export type AppModalProps = {
  visible: boolean;
  title?: string;
  message?: string | React.ReactNode;
  onClose: () => void;
  iconName?: keyof typeof Ionicons.glyphMap; // defaults by variant
  variant?: 'info' | 'warning' | 'error';
  actions?: ModalAction[]; // default: single OK closes
  // UX
  backdropClose?: boolean; // close when pressing outside (not implemented here for safety)
};

const VARIANT_COLOR: Record<NonNullable<AppModalProps['variant']>, string> = {
  info: '#2563EB',
  warning: '#F59E0B',
  error: '#D32F2F',
};

const DEFAULT_ICON: Record<NonNullable<AppModalProps['variant']>, keyof typeof Ionicons.glyphMap> = {
  info: 'information-circle',
  warning: 'alert-circle',
  error: 'alert-circle',
};

export default function AppModal({
  visible,
  title,
  message,
  onClose,
  iconName,
  variant = 'warning',
  actions,
}: AppModalProps) {
  const color = VARIANT_COLOR[variant];
  const ico = iconName ?? DEFAULT_ICON[variant];

  const finalActions: ModalAction[] = actions && actions.length
    ? actions
    : [{ label: 'OK', onPress: onClose, variant: 'danger' }];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Ionicons name={ico} size={36} color={color} style={styles.icon} />
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {typeof message === 'string' ? (
            <Text style={styles.msg}>{message}</Text>
          ) : (
            message
          )}

          {/* Actions */}
          <View style={styles.actionsRow}>
            {finalActions.map((a, idx) => (
              <TouchableOpacity
                key={`${a.label}-${idx}`}
                disabled={a.disabled || a.loading}
                onPress={a.onPress}
                testID={a.testID}
                style={[
                  styles.btn,
                  a.variant === 'danger' && styles.btnDanger,
                  a.variant === 'ghost' && styles.btnGhost,
                  (a.disabled || a.loading) && styles.btnDisabled,
                  idx > 0 && { marginLeft: 12 },
                ]}
              >
                {a.loading ? (
                  <ActivityIndicator />
                ) : (
                  <Text
                    style={[
                      styles.btnText,
                      a.variant === 'danger' && styles.btnTextDanger,
                    ]}
                  >
                    {a.label}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
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
  icon: { marginBottom: 8 },
  title: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  msg: { marginTop: 6, color: '#333', textAlign: 'center' },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    marginTop: 14,
  },
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cfcfcf',
    backgroundColor: '#fff',
  },
  btnGhost: { backgroundColor: '#fff', borderColor: '#cfcfcf' },
  btnDanger: { backgroundColor: '#FDECEA', borderColor: '#D32F2F' },
  btnText: { fontWeight: '600', color: '#333' },
  btnTextDanger: { color: '#D32F2F', fontWeight: '700' },
  btnDisabled: { opacity: 0.5 },
});
