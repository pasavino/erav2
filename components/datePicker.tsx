import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal, View, Text, Pressable, StyleSheet, FlatList, ListRenderItemInfo
} from 'react-native';

type Props = {
  label?: string;
  value?: string;                   // 'YYYY-MM-DD' o ''
  onChange: (date: string) => void; // devuelve 'YYYY-MM-DD' (o '' si decidís limpiar afuera)
  placeholder?: string;
  minYear?: number;                 // por defecto: año actual
  maxYear?: number;                 // por defecto: año actual + 2
};

const ITEM_H = 36;                  // alto de cada fila
const VISIBLE = 5;                  // cantidad visible (impar para centrar)
const CENTER_OFFSET = Math.floor(VISIBLE / 2);

function pad(n: number) { return String(n).padStart(2, '0'); }
function daysInMonth(y: number, m: number) { return new Date(y, m, 0).getDate(); }

const MONTHS = [
  { n: 1,  label: 'Jan' }, { n: 2,  label: 'Feb' }, { n: 3,  label: 'Mar' },
  { n: 4,  label: 'Apr' }, { n: 5,  label: 'May' }, { n: 6,  label: 'Jun' },
  { n: 7,  label: 'Jul' }, { n: 8,  label: 'Aug' }, { n: 9,  label: 'Sep' },
  { n: 10, label: 'Oct' }, { n: 11, label: 'Nov' }, { n: 12, label: 'Dec' },
];

function Wheel({
  data,
  index,
  onIndexChange,
}: {
  data: string[];
  index: number;
  onIndexChange: (i: number) => void;
}) {
  const ref = useRef<FlatList<string>>(null);

  // Alinea al índice cuando cambia externamente
  useEffect(() => {
    if (!ref.current) return;
    ref.current.scrollToOffset({ offset: index * ITEM_H, animated: false });
  }, [index]);

  const onEnd = (ev: any) => {
    const off = ev.nativeEvent.contentOffset?.y ?? 0;
    const i = Math.round(off / ITEM_H);
    onIndexChange(Math.max(0, Math.min(i, data.length - 1)));
  };

  const renderItem = ({ item, index: i }: ListRenderItemInfo<string>) => (
    <View style={[styles.item, i === index && styles.itemActive]}>
      <Text style={[styles.itemTxt, i === index && styles.itemTxtActive]}>{item}</Text>
    </View>
  );

  return (
    <View style={styles.wheel}>
      <FlatList
        ref={ref as any}
        data={data}
        keyExtractor={(_, i) => String(i)}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        getItemLayout={(_, i) => ({ length: ITEM_H, offset: ITEM_H * i, index: i })}
        initialScrollIndex={index}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        onMomentumScrollEnd={onEnd}
        onScrollEndDrag={onEnd}
      />
      {/* banda central de selección */}
      <View pointerEvents="none" style={styles.centerBand} />
    </View>
  );
}

export default function DatePicker({
  label,
  value = '',
  onChange,
  placeholder = 'Select date',
  minYear,
  maxYear,
}: Props) {
  const now = new Date();
  const yMin = (minYear ?? now.getFullYear());
  const yMax = (maxYear ?? (now.getFullYear() + 2)); // rango corto y práctico

  const years = useMemo(
    () => Array.from({ length: yMax - yMin + 1 }, (_, i) => yMin + i),
    [yMin, yMax]
  );

  // Estado del modal + selección
  const [open, setOpen] = useState(false);

  // Parseo del valor entrante o inicializo en hoy
  const init = useMemo(() => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [Y, M, D] = value.split('-').map(Number);
      return { y: Y, m: M, d: D };
    }
    return { y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate() };
  }, [value]);

  const [y, setY] = useState(init.y);
  const [m, setM] = useState(init.m);
  const [d, setD] = useState(init.d);

  // Índices actuales en cada wheel
  const [idxY, setIdxY] = useState(() => Math.max(0, years.findIndex(n => n === init.y)));
  const [idxM, setIdxM] = useState(() => init.m - 1);
  const [idxD, setIdxD] = useState(() => init.d - 1);

  // Días dependientes de y/m
  const days = useMemo(
    () => Array.from({ length: daysInMonth(y, m) }, (_, i) => i + 1),
    [y, m]
  );

  // Mantener día válido si cambia y/m
  useEffect(() => {
    if (idxD > days.length - 1) {
      setIdxD(days.length - 1);
      setD(days.length);
    }
  }, [days.length, idxD]);

  // Strings que se muestran en cada wheel
  const yearLabels  = useMemo(() => years.map(n => String(n)), [years]);
  const monthLabels = useMemo(() => MONTHS.map(mm => mm.label), []);
  const dayLabels   = useMemo(() => days.map(n => pad(n)), [days]);

  // Abrir modal: al abrir, realineo estados con value actual
  const openModal = () => {
    const base = /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? value.split('-').map(Number)
      : [now.getFullYear(), now.getMonth() + 1, now.getDate()];
    const [Y, M, D] = base;
    const yi = Math.max(0, years.findIndex(n => n === Y));
    const mi = Math.min(Math.max(0, M - 1), 11);
    const di = Math.min(Math.max(0, D - 1), daysInMonth(Y, M) - 1);
    setY(years[yi] || years[0]);
    setM(mi + 1);
    setD(di + 1);
    setIdxY(yi);
    setIdxM(mi);
    setIdxD(di);
    setOpen(true);
  };

  // Handlers de cambio por wheel
  const onYearIdx = (i: number) => {
    setIdxY(i);
    setY(years[i]);
  };
  const onMonthIdx = (i: number) => {
    setIdxM(i);
    setM(i + 1);
  };
  const onDayIdx = (i: number) => {
    setIdxD(i);
    setD(i + 1);
  };

  const confirm = () => {
    const out = `${y}-${pad(m)}-${pad(d)}`;
    onChange(out);
    setOpen(false);
  };

  const cancel = () => setOpen(false);

  const display = value ? value : placeholder;

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <Pressable style={styles.box} onPress={openModal}>
        <Text style={[styles.value, !value && styles.valueDim]}>{display}</Text>
        <Text style={styles.chev}>📅</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={cancel}>
        <Pressable style={styles.backdrop} onPress={cancel} />
        <View style={styles.center}>
          <View style={styles.card}>
            <Text style={styles.title}>Select date</Text>

            <View style={[styles.wheelsRow, { height: ITEM_H * VISIBLE }]}>
              <Wheel data={dayLabels}   index={idxD} onIndexChange={onDayIdx} />
              <Wheel data={monthLabels} index={idxM} onIndexChange={onMonthIdx} />
              <Wheel data={yearLabels}  index={idxY} onIndexChange={onYearIdx} />
            </View>

            <View style={styles.row}>
              <Pressable style={[styles.btn, styles.btnGhost]} onPress={cancel}>
                <Text style={[styles.btnTxt, { color: '#6b7280' }]}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.btn, styles.btnPrimary]} onPress={confirm}>
                <Text style={[styles.btnTxt, { color: '#fff' }]}>OK</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 8 },
  label: { marginBottom: 4, fontWeight: '600' },

  box: {
    borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10,
    paddingVertical: 12, paddingHorizontal: 12, flexDirection: 'row', justifyContent: 'space-between'
  },
  value: { fontSize: 16, color: '#111827' },
  valueDim: { color: '#6b7280' },
  chev: { fontSize: 16 },

  backdrop: { position: 'absolute', top:0, left:0, right:0, bottom:0, backgroundColor:'rgba(0,0,0,0.35)' },
  center: { flex:1, justifyContent:'center', padding:24 },
  card: {
    backgroundColor:'#fff', borderRadius:14, padding:16,
    shadowColor:'#000', shadowOpacity:0.25, shadowRadius:8, shadowOffset:{width:0, height:4}, elevation:6
  },
  title: { fontSize:18, fontWeight:'700', marginBottom:12 },

  wheelsRow: { flexDirection:'row', gap:12, alignItems:'center', marginBottom: 12 },

  wheel: { flex:1, position:'relative' },
  centerBand: {
    position:'absolute', left:0, right:0,
    top: ITEM_H * CENTER_OFFSET, height: ITEM_H,
    borderTopWidth:1, borderBottomWidth:1, borderColor:'#f4a04088'
  },

  item: { height: ITEM_H, justifyContent:'center', alignItems:'center' },
  itemActive: {},
  itemTxt: { fontSize:16, color:'#111827' },
  itemTxtActive: { color:'#f4a040', fontWeight:'700' },

  row: { flexDirection:'row', justifyContent:'flex-end', gap:12, marginTop:4 },
  btn: { paddingVertical:10, paddingHorizontal:16, borderRadius:10, minWidth:90, alignItems:'center' },
  btnGhost: { backgroundColor:'transparent', borderWidth:1, borderColor:'rgba(0,0,0,0.07)' },
  btnPrimary: { backgroundColor:'#f4a040' },
  btnTxt: { fontSize:15, fontWeight:'700' },
});
