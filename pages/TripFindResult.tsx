// pages/TripFindResult.tsx
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Image } from 'react-native';
import { useRoute } from '@react-navigation/native';

const naira = (v: any) => {
  const n = Number(v);
  return isFinite(n) ? `₦ ${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : String(v ?? '');
};

export default function TripFindResult() {
  const route = useRoute<any>();

  // acepta `items` o `rides`
  const data: any[] = Array.isArray(route.params?.items)
    ? route.params.items
    : Array.isArray(route.params?.rides)
    ? route.params.rides
    : [];

  const fromCity = useMemo<string>(() => {
    return String(
      route.params?.criteria?.from ??
      route.params?.fromName ??
      data?.[0]?.from ??
      ''
    );
  }, [route.params, data]);

  const toCity = useMemo<string>(() => {
    return String(
      route.params?.criteria?.to ??
      route.params?.toName ??
      data?.[0]?.to ??
      ''
    );
  }, [route.params, data]);

  const dateText = useMemo<string>(() => {
    return String(
      route.params?.date ??
      route.params?.criteria?.date ??
      data?.[0]?.date ??
      '—'
    );
  }, [route.params, data]);

  const headerText = useMemo(() => {
    const parts = [];
    if (fromCity || toCity) parts.push(`${fromCity || '—'} → ${toCity || '—'}`);
    if (dateText) parts.push(dateText);
    return `Results for ${parts.join(' / ')}`;
  }, [fromCity, toCity, dateText]);

  const keyExtractor = (item: any, idx: number) => String(item?.id ?? idx);

  const renderItem = ({ item }: { item: any }) => {
    const sub = [item?.date, item?.time].filter(Boolean).join(' • ');
    return (
      <View style={styles.cardRow}>
        <View style={{ flex: 1 }}>
          {!!sub && <Text style={styles.rowSub} numberOfLines={1}>{sub}</Text>}
        </View>
        {item?.price != null && <Text style={styles.price}>{naira(item.price)}</Text>}
      </View>
    );
  };

  if (!data.length) {
    return (
      <View style={styles.container}>
        <Image source={require('../assets/niger.png')} style={styles.hero} resizeMode="contain" />
        <View style={styles.emptyWrap}>
          <Text style={styles.header}>{headerText}</Text>
          <Text style={styles.emptyTitle}>No results</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image source={require('../assets/niger.png')} style={styles.hero} resizeMode="contain" />
      <Text style={styles.header}>{headerText}</Text>

      <FlatList
        data={data}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 12, paddingTop: 8 },
  hero: { width: '100%', height: 160, marginBottom: 8 },
  header: { fontSize: 16, fontWeight: '700', marginBottom: 8, color: '#111' },

  sep: { height: 1, backgroundColor: '#f1f5f9' },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,         // +1 px de espacio
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  rowSub: { fontSize: 13, color: '#64748b' },
  price: { fontSize: 14, fontWeight: '700', color: '#111' },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 6 },
});