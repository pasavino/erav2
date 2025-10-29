// pages/TripFindResult.tsx
import React, { useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';

const naira = (v: any) => {
  const n = Number(v);
  return isFinite(n) ? `₦ ${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : String(v ?? '');
};

export default function TripFindResult() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();

  // acepta `items`, `rides` o `lista` (según tu JSON)
  const data: any[] = Array.isArray(route.params?.items)
    ? route.params.items
    : Array.isArray(route.params?.rides)
    ? route.params.rides
    : Array.isArray(route.params?.lista)
    ? route.params.lista
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

  const renderItem = ({ item }: { item: any; index: number }) => {
    const title = `${item?.from ?? fromCity} → ${item?.to ?? toCity}`;
    const price = item?.price ?? item?.amount ?? item?.fare;
    const seats = item?.seats ?? item?.available_seats ?? item?.slots;
    const date = item?.date ?? item?.when ?? '';
    const time = item?.time ?? item?.hour ?? '';

    const rawAvatar = (typeof item?.driver_avatar === 'string') ? item.driver_avatar : '';
    const avatarUri = rawAvatar.trim();
    const hasAvatar = avatarUri.length > 0;
    
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => navigation.navigate('BookTrip', { trip: item })}
        style={styles.card}
      >
        <View style={styles.rowBetween}>
          {/* LEFT: avatar + info */}
          <View style={styles.rowLeft}> 
            {hasAvatar ? (
              <Image
                source={{ uri: avatarUri }}
                style={styles.avatar}
                resizeMode="cover"
                onError={(e) => console.warn('Avatar error', avatarUri, e?.nativeEvent)}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]} />
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.title} numberOfLines={1}>{title}</Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {date}{time ? ` • ${time}` : ''}
              </Text>
              <View style={styles.metaRow}>
                {price != null && <Text style={styles.price}>{naira(price)}</Text>}
                {seats != null && (
                  <Text style={styles.seats}>
                    {String(seats)} seat{Number(seats) === 1 ? '' : 's'} left
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* RIGHT: Book button */}
          <TouchableOpacity
            onPress={() => navigation.navigate('BookTrip', { trip: item })}
            activeOpacity={0.85}
            style={styles.bookBtn}
          >
            <Text style={styles.bookBtnText}>Book trip</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>
        {fromCity || 'From'} → {toCity || 'To'}
      </Text>

      <FlatList
        data={data}
        keyExtractor={(_it: any, i: number) => String(_it?.id ?? _it?.ride_id ?? i)}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={<Text style={styles.empty}>No trips found.</Text>}
        showsVerticalScrollIndicator={false} // Quitar barra de scroll
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { fontSize: 16, fontWeight: '600', paddingHorizontal: 16, paddingTop: 12 },
  card: {
    backgroundColor: '#fafafa',
    borderRadius: 12,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e6e6e6',
  },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 },
  avatar: { width: 56, height: 56, borderRadius: 28, marginRight: 12, backgroundColor: '#ddd' },
  avatarPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '600', marginBottom: 2, maxWidth: '95%' },
  subtitle: { fontSize: 12, color: '#666' },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 12 },
  price: { fontSize: 14, fontWeight: '700' },
  seats: { fontSize: 12, color: '#444' },
  bookBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#111',
  },
  bookBtnText: { color: '#fff', fontWeight: '600' },
  empty: { textAlign: 'center', color: '#666', marginTop: 40 },
});