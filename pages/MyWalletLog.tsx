// pages/MyWalletLog.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { requestForm } from '../services/http';

type LogEntry = {
  IdRegistro: number;
  Fecha: string;
  LogText: string;
};

const MyWalletLog = () => {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { logType } = route.params; // 'P' for Traveler, 'D' for Driver

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async (currentPage: number) => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const response: any = await requestForm('/ax_Wallet_View_Log.php', {
        LogAsPost: logType,
        page: currentPage,
        pageSize: 20, // Or any other desired page size
      });

      if (response.error === 0) {
        setLogs(prevLogs => currentPage === 1 ? response.data : [...prevLogs, ...response.data]);
        setHasMore(response.hasMore);
        setPage(currentPage + 1);
      } else {
        setError(response.msg || 'Failed to fetch logs.');
      }
    } catch (e) {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }, [logType, loading, hasMore]);

  useEffect(() => {
    fetchLogs(1); // Initial fetch
  }, [logType]);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchLogs(page);
    }
  };

  const renderItem = ({ item }: { item: LogEntry }) => (
    <View style={styles.logItem}>
      <Text style={styles.logDate}>{item.Fecha}</Text>
      <Text style={styles.logText}>{item.LogText}</Text>
    </View>
  );

  const renderFooter = () => {
    if (!loading) return null;
    return <ActivityIndicator style={{ marginVertical: 20 }} />;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.title}>{logType === 'P' ? 'Traveler wallet' : 'Driver wallet'} log</Text>
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <FlatList
        data={logs}
        renderItem={renderItem}
        keyExtractor={(item) => item.IdRegistro.toString()}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={() => (
          !loading && <Text style={styles.emptyText}>No records found.</Text>
        )}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  logItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  logDate: {
    fontSize: 16,
    color: '#0d0d0d',
    marginBottom: 5,
  },
  logText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    margin: 10,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#888',
  },
  listContent: {
    paddingBottom: 20,
  }
});

export default MyWalletLog;