import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';

type Props = {
  label?: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  error?: string;
  errorMode?: 'inline' | 'bubble'; // 👈 nuevo
  keyboardType?: 'default'|'email-address'|'numeric'|'phone-pad';
  autoCapitalize?: 'none'|'sentences'|'words'|'characters';
  secureTextEntry?: boolean;
  onBlur?: () => void;
};

export default function Input({
  label, value, onChangeText, placeholder,
  error, errorMode = 'inline',
  keyboardType='default', autoCapitalize='none',
  secureTextEntry, onBlur
}: Props) {
  const [focused, setFocused] = useState(false);
  const [hide, setHide] = useState(!!secureTextEntry);

  const showInline = !!error && errorMode === 'inline';
  const showBubble = !!error && errorMode === 'bubble';

  return (
    <View style={[styles.wrap, showBubble && { marginBottom: 26 }]} accessibilityState={{ invalid: !!error }}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View style={[
        styles.box,
        focused && styles.boxFocus,
        !!error && styles.boxError
      ]}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          secureTextEntry={hide}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); onBlur?.(); }}
          placeholderTextColor="#9aa0a6"
        />
        {secureTextEntry ? (
          <Pressable onPress={() => setHide(v => !v)}>
            <Text style={styles.toggle}>{hide ? 'Show' : 'Hide'}</Text>
          </Pressable>
        ) : null}
      </View>

      {showInline && <Text style={styles.errInline}>{error}</Text>}

      {showBubble && (
        <>
          <View style={styles.errBubble}>
            <Text style={styles.errBubbleText}>{error}</Text>
          </View>
          <View style={styles.errCaret} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 10, position: 'relative' },
  label: { marginBottom: 6, fontSize: 14, color: '#374151' },
  box: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    flexDirection: 'row', alignItems: 'center'
  },
  boxFocus: { borderColor: '#f4a040' },
  boxError: { borderColor: '#b00020' },

  input: { flex: 1, fontSize: 16 },
  toggle: { marginLeft: 10, fontWeight: '600', color: '#f4a040' },

  // Inline
  errInline: { marginTop: 4, color: '#b00020', fontSize: 12 },

  // Bubble
  errBubble: {
    position: 'absolute',
    top: '100%', left: 12, marginTop: 8,
    backgroundColor: '#b00020',
    paddingVertical: 6, paddingHorizontal: 10,
    borderRadius: 8, zIndex: 2
  },
  errBubbleText: { color: '#fff', fontSize: 12 },
  errCaret: {
    position: 'absolute',
    top: '100%', left: 22, marginTop: 2,
    width: 8, height: 8, backgroundColor: '#b00020',
    transform: [{ rotate: '45deg' }], zIndex: 1, borderRadius: 1
  }
});