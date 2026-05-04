// pages/AdvSearchResult.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { advanceSearchService, Trip, SearchParams } from '../services/advanceSearch';

// 1. Definir el "mapa" de rutas y sus parámetros
type RootStackParamList = {
  AdvSearchResult: {
    trips: Trip[];
    searchParams: Omit<SearchParams, 'page'>;
  };
  BookTrip: { trip: Trip };
  // ... agregar otras rutas si es necesario
};

// 2. Tipar la ruta actual usando el mapa
type AdvSearchResultRouteProp = RouteProp<RootStackParamList, 'AdvSearchResult'>;

// 3. Tipar el hook de navegación usando el mapa
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Helper para formatear a Naira
const naira = (v: any) => {
  const n = Number(v);
  return isFinite(n)
    ? `₦ ${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
    : String(v ?? '');
};

export default function AdvSearchResult() {
  // 4. Aplicar los tipos a los hooks
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<AdvSearchResultRouteProp>();
  const { trips: initialTrips, searchParams } = route.params;

  const [rides, setRides] = useState<Trip[]>(initialTrips);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState((initialTrips || []).length > 0);
  
  // Ref para evitar la carga duplicada al inicio
  const isInitialLoad = useRef(true);

  useEffect(() => {
    // Después del primer render, permitimos que onEndReached funcione
    const timer = setTimeout(() => {
      isInitialLoad.current = false;
    }, 500);
    return () => clearTimeout(timer);
  }, []);


  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      title: 'Search Results',
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 10 }}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const loadMore = async () => {
    if (loading || !hasMore || isInitialLoad.current) return;

    setLoading(true);
    try {
      const nextPage = page + 1;
      const response = await advanceSearchService.search({ ...searchParams, page: nextPage });

      if (response.error === 0) {
        const newRides = response.lista || [];
        if (newRides.length > 0) {
          setRides(prevRides => [...prevRides, ...newRides]);
          setPage(nextPage);
        } else {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Failed to load more trips:", error);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: Trip }) => {
    const title = `${item.from} → ${item.to}`;
    const hasAvatar = item.driver_avatar && item.driver_avatar.trim().length > 0;

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.card}
        onPress={() => navigation.navigate('BookTrip', { trip: item })} // Esta línea ahora es válida
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
      <View style={styles.noResultsContainer}>
        <Text style={styles.noResultsText}>No trips found for your search criteria.</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={rides}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        contentContainerStyle={{ padding: 16 }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    height: 300,
  },
  noResultsText: {
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
