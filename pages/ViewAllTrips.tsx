import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { viewAllTripsService } from '../services/viewAllTrips';
import type { Trip } from '../services/viewAllTrips';

import { useNavigation } from '@react-navigation/native';

const PAGE_SIZE = 20;

// Helper para formatear a Naira, similar a TripFindResult
const naira = (v: any) => {
  const n = Number(v);
  return isFinite(n)
    ? `₦ ${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
    : String(v ?? '');
};

export default function ViewAllTrips() {
  const navigation = useNavigation<any>();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrips = useCallback(async (currentPage: number, isRefreshing = false) => {
    if (loading && !isRefreshing) return;

    if (isRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await viewAllTripsService.list(currentPage, PAGE_SIZE);
      const newTrips = response.data || [];

      setTrips(prev => (currentPage === 1 ? newTrips : [...prev, ...newTrips]));
      setPage(currentPage);

      if (!response.hasMore) {
        setHasMore(false);
      } else {
        // Ensure hasMore is reset to true on a successful refresh
        setHasMore(true);
      }
    } catch (e: any) {
      // The backend is not responding, so we catch the error and show a friendly message
      setError('No trips available to list');
      setHasMore(false); // Stop pagination on error
    } finally {
      if (isRefreshing) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [loading]);

  // Carga inicial
  useEffect(() => {
    fetchTrips(1);
  }, []);

  const onRefresh = useCallback(() => {
    setPage(1);
    setHasMore(true); // Reset hasMore on refresh
    fetchTrips(1, true);
  }, [fetchTrips]);

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      fetchTrips(page + 1);
    }
  };

  const renderItem = ({ item }: { item: Trip }) => {
    const title = `${item.from} → ${item.to}`;
    const hasAvatar = item.driver_avatar && item.driver_avatar.trim().length > 0;

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.card}
        onPress={() => navigation.navigate('BookTrip', { trip: item })}
      >
        <View style={styles.rowBetween}>
          <View style={styles.rowLeft}>
            {hasAvatar ? (
              <Image
                source={{ uri: item.driver_avatar }}
                style={styles.avatar}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]} />
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.title} numberOfLines={1}>
                {title}
              </Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {item.date}
                {item.time ? ` • ${item.time}` : ''}
              </Text>
              <View style={styles.metaRow}>
                {item.price != null && (
                  <Text style={styles.price}>{naira(item.price)}</Text>
                )}
              </View>
              {item.libres != null && (
                <Text style={styles.seats}>
                  {String(item.libres)} seat{Number(item.libres) !== 1 ? 's' : ''} left
                </Text>
              )}
            </View>
          </View>
          {item.icono ? (
            <MaterialCommunityIcons
              name={item.icono as any}
              size={24}
              color="#f70808ff"
            />
          ) : (
            <TouchableOpacity
              onPress={() => navigation.navigate('BookTrip', { trip: item })}
              activeOpacity={0.85}
              style={styles.bookBtn}
            >
              <Text style={styles.bookBtnText}>Book trip</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!loading) return null;
    return <ActivityIndicator style={{ marginVertical: 20 }} />;
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.body}>
        <Text style={styles.text}>{error || 'No trips found.'}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>View All Trips</Text>
      </View>
      <FlatList
        data={trips}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        contentContainerStyle={{ padding: 16 }}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fafafa',
    borderRadius: 12,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e6e6e6',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
    backgroundColor: '#ddd',
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
  },
  seats: {
    fontSize: 13,
    color: '#444',
    marginTop: 4,
  },
  bookBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#111',
  },
  bookBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
});
