// /pages/Home.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, FlatList, Image, useWindowDimensions
} from 'react-native';

import Input from '../components/input';
import Boton from '../components/boton';
import AppAlert from '../components/appAlert';
import Select from '../components/select';
import DatePicker from '../components/datePicker';

// Servicios (imports directos, sin barrel)
import { ensureOk } from '../services/http';
import { lists } from '../services/lists';
import { rides } from '../services/rides';

// Tipos (¡como type-only!)
import type { Option, OptionsExtra } from '../services/lists';
import type { Ride, SearchRidesExtra } from '../services/rides';

export default function Home() {
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
  const [date, setDate] = useState<string>(''); // YYYY-MM-DD o ''

  const [loadingCombos, setLoadingCombos] = useState(true);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Ride[]>([]);
  const [alertMsg, setAlertMsg] = useState<string|null>(null);

  // Cargar combos desde backend
  useEffect(() => {
    (async () => {
      try {
        setLoadingCombos(true);
        const { lista: fromList } = await ensureOk<OptionsExtra>(lists.cities('from'));
        const { lista: toList   } = await ensureOk<OptionsExtra>(lists.cities('to'));
        setFromOpt(fromList || []); setToOpt(toList || []);
        setFrom(fromList?.[0]?.id ?? ''); setTo(toList?.[0]?.id ?? '');
      } catch (e:any) {
        setAlertMsg(e?.message || 'Error loading options');
      } finally {
        setLoadingCombos(false);
      }
    })();
  }, []);

  const errDate = useMemo(() => {
    if (!date.trim()) return undefined;
    return /^\d{4}-\d{2}-\d{2}$/.test(date) ? undefined : 'Use YYYY-MM-DD';
  }, [date]);

  const onSearch = async () => {
    if (errDate) { setAlertMsg(errDate); return; }
    try {
      setLoading(true);
      const { lista } = await ensureOk<SearchRidesExtra>(rides.search({ from, to, date }));
      setResults(lista || []);
      if (!lista || lista.length === 0) setAlertMsg('No rides found');
    } catch (e:any) {
      setAlertMsg(e?.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: Ride }) => (
    <View style={styles.card}>
      <Text style={styles.route}>{item.from} → {item.to}</Text>
      <Text style={styles.meta}>{item.date} · ${item.price}</Text>
    </View>
  );

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
            options={fromOpt}
            value={from}
            onChange={setFrom}
          />
          <Select
            label="To"
            options={toOpt}
            value={to}
            onChange={setTo}
          />
          <DatePicker
            label="Date (optional)"
            value={date}
            onChange={setDate}
          />

          {loading ? <ActivityIndicator/> : <Boton label="Search" onPress={onSearch} />}

          <FlatList
            data={results}
            keyExtractor={(it)=> String(it.id)}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
          />
        </>
      )}

      {/* AppAlert sin title ni visible */}
      {alertMsg ? (
        <AppAlert
          message={alertMsg}
          type="info"
          confirmText="OK"
          onClose={()=>setAlertMsg(null)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap:  { flex:1, padding:16, backgroundColor:'#fff' },
  title: { fontSize:20, fontWeight:'700', marginBottom:8, textAlign:'center' },
  list:  { paddingVertical:12, gap:8 },
  card:  {
    backgroundColor:'#fff', borderRadius:12, padding:12,
    borderWidth:1, borderColor:'#eee', shadowColor:'#000',
    shadowOpacity:0.06, shadowRadius:6, shadowOffset:{width:0,height:3}, elevation:2
  },
  route: { fontSize:16, fontWeight:'700' },
  meta:  { marginTop:4, color:'#555' }
});