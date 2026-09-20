import React, { createContext, forwardRef, useContext } from 'react';
import {
  Text as NativeText,
  TextInput as NativeTextInput,
  StyleSheet,
  type TextProps,
  type TextInputProps,
  type TextStyle,
} from 'react-native';
import { robotoStyle } from '../lib/fonts';

const TextWeightContext = createContext<TextStyle['fontWeight']>('400');

export const Text = forwardRef<NativeText, TextProps>(function Text(
  { style, children, ...props }, ref,
) {
  // Conserva el peso heredado en textos anidados, aunque el estilo nativo
  // use normal para seleccionar el archivo estático cargado con expo-font.
  const inheritedWeight = useContext(TextWeightContext);
  const weight = StyleSheet.flatten(style)?.fontWeight ?? inheritedWeight;

  return (
    <TextWeightContext.Provider value={weight}>
      <NativeText {...props} ref={ref} style={[style, robotoStyle(weight)]}>
        {children}
      </NativeText>
    </TextWeightContext.Provider>
  );
});

export const TextInput = forwardRef<NativeTextInput, TextInputProps>(function TextInput(
  { style, ...props }, ref,
) {
  return (
    <NativeTextInput
      {...props}
      ref={ref}
      style={[style, robotoStyle(StyleSheet.flatten(style)?.fontWeight)]}
    />
  );
});
