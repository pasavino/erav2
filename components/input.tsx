import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  type TextInputProps,
  type KeyboardTypeOptions,
} from 'react-native';

export type InputProps = {
  label?: string;
  error?: string;
  keyboardType?: KeyboardTypeOptions;
} & Omit<TextInputProps, 'keyboardType'>;

/**
 * Input reusable del Proyecto ERA.
 * - Soporta "bubble" de error.
 * - Expone keyboardType con el tipo correcto de RN.
 * - Si secureTextEntry=true, muestra toggle "Show/Hide" (como en Login).
 */
export default function Input({
  label,
  error,
  keyboardType,
  style,
  secureTextEntry,
  ...rest
}: InputProps) {
  const [secure, setSecure] = useState<boolean>(!!secureTextEntry);

  // Si el caller cambia secureTextEntry, respetarlo (sin resetear el toggle en cada render)
  const wantsToggle = useMemo(() => !!secureTextEntry, [secureTextEntry]);

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View style={[styles.inputRow, error ? styles.inputError : null, style]}>
        <TextInput
          {...rest}
          keyboardType={keyboardType}
          secureTextEntry={wantsToggle ? secure : secureTextEntry}
          style={styles.input}
          placeholderTextColor="#9CA3AF"
        />

        {wantsToggle ? (
          <Pressable
            onPress={() => setSecure((v) => !v)}
            hitSlop={10}
            style={styles.toggleBtn}
          >
            <Text style={styles.toggleText}>{secure ? 'Show' : 'Hide'}</Text>
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <View style={styles.bubble}>
          <Text style={styles.bubbleText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
  },
  inputError: {
    borderColor: '#EF4444',
  },

  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  toggleText: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '700',
  },

  bubble: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  bubbleText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});