import { StyleSheet, type TextStyle } from 'react-native';
import type { FontSource } from 'expo-font';

export const ROBOTO_FONTS = {
  'Roboto-Regular': require('../assets/fonts/static/Roboto-Regular.ttf'),
  'Roboto-Medium': require('../assets/fonts/static/Roboto-Medium.ttf'),
  'Roboto-SemiBold': require('../assets/fonts/static/Roboto-SemiBold.ttf'),
  'Roboto-Bold': require('../assets/fonts/static/Roboto-Bold.ttf'),
  'Roboto-ExtraBold': require('../assets/fonts/static/Roboto-ExtraBold.ttf'),
} satisfies Record<string, FontSource>;

// El peso está en el archivo: pedir bold a Android con este alias puede
// hacer que React Native busque otra variante y vuelva a la fuente del sistema.
const styles = StyleSheet.create({
  regular: { fontFamily: 'Roboto-Regular', fontWeight: 'normal' },
  medium: { fontFamily: 'Roboto-Medium', fontWeight: 'normal' },
  semiBold: { fontFamily: 'Roboto-SemiBold', fontWeight: 'normal' },
  bold: { fontFamily: 'Roboto-Bold', fontWeight: 'normal' },
  extraBold: { fontFamily: 'Roboto-ExtraBold', fontWeight: 'normal' },
});

export function robotoStyle(weight: TextStyle['fontWeight'] = '400') {
  switch (String(weight)) {
    case '500': return styles.medium;
    case '600': return styles.semiBold;
    case '700':
    case 'bold': return styles.bold;
    case '800': return styles.extraBold;
    default: return styles.regular;
  }
}
