// components/appModalInput.tsx
import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ModalAction, AppModalProps } from './appModal'; // Reutilizamos los tipos
import Input from './input';

// Extendemos las props para incluir las del input
export type AppModalInputProps = AppModalProps & {
  inputProps: React.ComponentProps<typeof Input>;
};

const VARIANT_COLOR: Record<NonNullable<AppModalProps['variant']>, string> = {
  info: '#25eb2cff',
  warning: '#F59E0B',
  error: '#D32F2F',
};

const DEFAULT_ICON: Record<NonNullable<AppModalProps['variant']>, keyof typeof Ionicons.glyphMap> = {
  info: 'information-circle',
  warning: 'alert-circle',
  error: 'alert-circle',
};

export default function AppModalInput({
  visible,
  title,
  message,
  onClose,
  iconName,
  variant = 'warning',
  actions,
  inputProps,
}: AppModalInputProps) {
  const color = VARIANT_COLOR[variant];
  const ico = iconName ?? DEFAULT_ICON[variant];

  const finalActions: ModalAction[] =
    actions === undefined ? [{ label: 'OK', onPress: onClose, variant: 'danger' }] : actions;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Ionicons name={ico} size={36} color={color} style={styles.icon} />
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {typeof message === 'string' ? <Text style={styles.msg}>{message}</Text> : message}

          <View style={{ width: '100%', marginTop: 12 }}>
            <Input {...inputProps} />
          </View>

          {/* Actions */}
          {finalActions.length ? (
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
                    <Text style={[styles.btnText, a.variant === 'danger' && styles.btnTextDanger]}>
                      {a.label}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
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
