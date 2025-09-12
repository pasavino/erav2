// components/datePicker.tsx
import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

type Props = {
  label?: string;
  value: string | null; // 'YYYY-MM-DD' o null
  onChange: React.Dispatch<React.SetStateAction<string | null>>; // compatible con setDate
  minDate?: Date;
  maxDate?: Date;
  placeholder?: string; // ej: 'YYYY-MM-DD'
  disabled?: boolean;
};

const pad = (n: number) => String(n).padStart(2, '0');
const atMidnight = (d: Date) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
const fmtYMD = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const parseYMD = (s?: string | null): Date | null => {
  if (!s) return null;
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = Number(m[1]), mm = Number(m[2]), dd = Number(m[3]);
  const dt = new Date(y, mm - 1, dd);
  return (dt.getFullYear() === y && dt.getMonth() === mm - 1 && dt.getDate() === dd) ? atMidnight(dt) : null;
};

export default function DatePicker({
  label,
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = 'YYYY-MM-DD',
  disabled,
}: Props) {
  const [show, setShow] = useState(false);

  // Siempre pasar un Date válido al picker (clamp opcional a min/max)
  const safeDate = useMemo(() => {
    let d = parseYMD(value) ?? atMidnight(new Date());
    if (minDate && d < atMidnight(minDate)) d = atMidnight(minDate);
    if (maxDate && d > atMidnight(maxDate)) d = atMidnight(maxDate);
    return d;
  }, [value, minDate, maxDate]);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShow(Platform.OS === 'ios');
    if (selectedDate) {
      onChange(fmtYMD(atMidnight(selectedDate)));
    }
  };

  return (
    <View style={styles.wrap}>
      {!!label && <Text style={styles.label}>{label}</Text>}

      <Pressable
        style={[styles.input, disabled && styles.inputDisabled]}
        onPress={() => !disabled && setShow(true)}
        disabled={disabled}
      >
        <Text style={[styles.inputText, !(value && value.trim()) && styles.placeholder]}>
          {value && value.trim() ? value : placeholder}
        </Text>
      </Pressable>

      {show && (
        <DateTimePicker
          value={safeDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={minDate ? atMidnight(minDate) : undefined}
          maximumDate={maxDate ? atMidnight(maxDate) : undefined}
          onChange={handleDateChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  label: { marginBottom: 6, fontSize: 14, color: '#111' },
  input: {
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d0d5dd',
    backgroundColor: 'white',
    justifyContent: 'center',
  },
  inputDisabled: { opacity: 0.6 },
  inputText: { fontSize: 16, color: '#111' },
  placeholder: { color: '#98a2b3' },
});