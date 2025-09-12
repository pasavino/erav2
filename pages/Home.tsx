// /pages/Home.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, Image, useWindowDimensions
} from 'react-native';

import Boton from '../components/boton';
import AppAlert from '../components/appAlert';
import Select from '../components/select';
import DatePicker from '../components/datePicker';

// Servicios (imports directos, sin barrel)
import { ensureOk } from '../services/http';
import { lists } from '../services/lists';
import { rides } from '../services/rides';

// Tipos (type-only)
import type { Option } from '../services/lists';
import type { SearchRidesExtra } from '../services/rides';

// Helper: hoy en YYYY-MM-DD
const todayYMD = () => {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
};

export default function Home({ navigation }: any) {
  // Imagen (niger.png)
  const { width: winW, height: winH } = useWindowDimensions();
  const hero = require('../assets/niger.png');
  const { width: imgW, height: imgH } = Image.resolveAssetSource(hero);
  const ratio = imgW / imgH;
  const maxH = Math.round(winH * 0.24);
  let w = Math.min(winW - 32, 480);
  let h = Math.round(w / ratio);
  if (h > maxH) { h = maxH; w = Math.round(h * ratio); }

  // Estado
  const [fromOpt, setFromOpt] = useState<Option[]>([]);
  const [toOpt,   setToOpt]   = useState<Option[]>([]);
  const [from, setFrom] = useState<string>('');
  const [to,   setTo]   = useState<string>('');
  const [date, setDate] = useState<string | null>(todayYMD());

  const [loadingCombos, setLoadingCombos] = useState(true);
  const [loading, setLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState<string|null>(null);

  

  // Cargar combos desde backend
  useEffect(() => {
    (async () => {
      try {
        setLoadingCombos(true);
        const { lista: fromList } = await lists.cities('from');
        const { lista: toList   } = await lists.cities('to');

        setFromOpt(fromList || []); setToOpt(toList || []);
        setFrom(fromList?.[0]?.id ?? ''); setTo(toList?.[0]?.id ?? '');
      } catch (_e:any) {
        // log silencioso
        console.log(_e);
        console.log('Load combos failed');
      } finally {
        setLoadingCombos(false);
      }
    })();
  }, []);

  // Validación simple de fecha
const errDate = useMemo(() => {
  if (!date || !date.trim()) return undefined;
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? undefined : 'Use YYYY-MM-DD';
}, [date]);

  // Normaliza el shape para la lista (time opcional)
  const normalize = (lista: any[]) => (lista || []).map((r:any) => ({
    id: String(r.id),
    from: r.from,
    to: r.to,
    date: r.date,
    time: r.time,     // puede no venir, el componente lo maneja
    price: r.price,
  }));

  const onSearch = async () => {
    if (errDate) { setAlertMsg(errDate); return; }
    try {
      setLoading(true);
      const { lista } = await ensureOk<SearchRidesExtra>(rides.search({ from, to, date: date || '' }));
      const normalized = normalize(lista || []);
      if (!normalized.length) {
        setAlertMsg('No rides found');
      } else {
        // Navegar a pantalla de resultados (TripFindResult)
        navigation.navigate('TripFindResult', { rides: normalized, from, to, date });
      }
    } catch (_e:any) {
      console.log('Search failed');
      setAlertMsg('Search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <Image source={hero} style={{ width:w, height:h, alignSelf:'center', marginBottom:10 }} resizeMode="contain" />
      <Text style={styles.title}>Search rides</Text>

      {loadingCombos ? (
        <ActivityIndicator />
      ) : (
        <>
          <Select
            label="From"
            options={fromOpt.map(o=>({label:o.text, value:o.id}))}
            value={from}
            onChange={setFrom}
          />
          <Select
            label="To"
            options={toOpt.map(o=>({label:o.text, value:o.id}))}
            value={to}
            onChange={setTo}
          />
          <DatePicker
              label="Date (YYYY-MM-DD)"
              value={date}
              onChange={setDate}
            />

          <View style={{ marginTop:12, marginBottom:4 }}>
            <Boton
              label={loading ? 'Searching…' : 'Search'}
              onPress={() => { if (!loading) onSearch(); }}
            />
          </View>
        </>
      )}

      {/* Overlay bloqueante durante la búsqueda */}
      {loading && (
        <View style={styles.overlay} pointerEvents="auto">
          <ActivityIndicator size="large" />
          <Text style={styles.overlayText}>Searching… please wait</Text>
        </View>
      )}

      {/* AppAlert sólo para mensajes funcionales */}
      {alertMsg ? (
        <AppAlert
          message={alertMsg}
          onClose={()=>setAlertMsg(null)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap:  { flex:1, padding:16, backgroundColor:'#fff' },
  title: { fontSize:20, fontWeight:'700', marginBottom:8, textAlign:'center' },
  overlay: {
    position:'absolute', left:0, top:0, right:0, bottom:0,
    backgroundColor:'rgba(0,0,0,0.25)', alignItems:'center', justifyContent:'center'
  },
  overlayText: { marginTop:8, color:'#fff', fontSize:14 },
});