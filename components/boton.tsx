import { Text, Pressable, StyleSheet } from 'react-native';

interface Props {
  label: string;
  onPress?: () => void;
  onLongPress?: () => void;
}

export default function Boton({ label, onPress, onLongPress }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        pressed && styles.buttonPressed
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#f4a040ff',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    marginVertical: 8,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }]
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  }
});