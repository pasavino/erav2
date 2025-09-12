import React from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator, StyleSheet } from 'react-native';

export type Ride = {
  id: string;
  from: string;
  to: string;
  date: string; // YYYY-MM-DD
  // algunos backends no envían hora, así que lo hacemos opcional
  time?: string; // HH:mm opcional
  price: number; // NGN
};

type Props = {
  data: Ride[];
  loading?: boolean;
  onPress: (ride: Ride) => void;
  emptyText?: string;
};

const formatPrice = (n: number) => {
  try {
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n);
  } catch {
    return String(Math.round(n));
  }
};

export default function RideList({ data, loading = false, onPress, emptyText = 'No rides found' }: Props) {
  const HeaderRow = (
    <View style={[styles.row, styles.headerRow]}>
      <Text style={[styles.cell, styles.hFrom, styles.headerText]}>From</Text>
      <Text style={[styles.cell, styles.hTo, styles.headerText]}>To</Text>
      <Text style={[styles.cell, styles.hDate, styles.headerText]}>Date</Text>
      <Text style={[styles.cell, styles.hTime, styles.headerText]}>Time</Text>
      <Text style={[styles.cell, styles.hPrice, styles.headerText, { textAlign: 'right' }]}>Price</Text>
    </View>
  );

  const renderItem = ({ item }: { item: Ride }) => (
    <Pressable onPress={() => onPress(item)} style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>      
      <Text style={[styles.cell, styles.hFrom]} numberOfLines={1}>{item.from}</Text>
      <Text style={[styles.cell, styles.hTo]} numberOfLines={1}>{item.to}</Text>
      <Text style={[styles.cell, styles.hDate]}>{item.date}</Text>
      <Text style={[styles.cell, styles.hTime]}>{item.time ?? '-'}</Text>
      <Text style={[styles.cell, styles.hPrice, { textAlign: 'right', fontWeight: '600' }]}>₦ {formatPrice(item.price)}</Text>
    </Pressable>
  );

  if (loading && (!data || data.length === 0)) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator />
        <Text style={styles.loadingText}>Searching…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {HeaderRow}
      {(!data || data.length === 0) ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>{emptyText}</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(it) => it.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 8 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  rowPressed: {
    backgroundColor: '#f5f5f5',
  },
  headerRow: {
    backgroundColor: '#fafafa',
  },
  headerText: {
    fontWeight: '600',
    fontSize: 12,
    color: '#555',
  },
  cell: {
    paddingRight: 8,
    fontSize: 14,
  },
  hFrom: { flex: 1.3 },
  hTo: { flex: 1.3 },
  hDate: { flex: 1 },
  hTime: { flex: 0.8 },
  hPrice: { flex: 1 },

  emptyWrap: {
    paddingVertical: 24,
    paddingHorizontal: 12,
  },
  emptyText: {
    fontSize: 13,
    color: '#777',
  },
  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    color: '#555',
  },
});