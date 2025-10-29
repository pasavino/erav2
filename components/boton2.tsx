import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';

type Props = {
  label: string;
  onPress?: () => void;
  disabled?: boolean; // ⬅️ nuevo
};

export default function Boton({ label, onPress, disabled }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={disabled ? undefined : onPress}
      // Ripple solo si no está deshabilitado
      android_ripple={
        disabled ? undefined : { color: 'rgba(0,0,0,0.08)', borderless: false }
      }
      style={({ pressed }) => [
        styles.base,
        disabled && styles.disabled,
        !disabled && pressed && styles.pressed,
      ]}
    >
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f4a040ff', // tu color
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden', // ⬅️ CLIP del ripple (evita el cuadrado)
    marginBottom:25
  },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.5 }, // look desactivado, sin “cuadrado”
  text: { color: '#fff', fontWeight: '700' },
});