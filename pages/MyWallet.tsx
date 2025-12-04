// /pages/MyWallet.tsx
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { requestForm } from '../services/http';
import Boton from '../components/boton';

type MyWalletItem = {
  WalletDriver: number;
  Wallet_pass: number;
  FechaUpdate: string;
};

type MyWalletResponse = {
  error: number;
  message: string;
  items: MyWalletItem[];
};

const naira = (v: any) => {
  const n = Number(v);
  return isFinite(n) ? `₦ ${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : String(v ?? '');
};

const MyWallet: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const [walletDriver, setWalletDriver] = useState<number>(0);
  const [walletTraveler, setWalletTraveler] = useState<number>(0);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  const loadWallet = async () => {
    try {
      setLoading(true);
      const resp = (await requestForm('ax_MyWallet.php', {})) as MyWalletResponse;

      if (!resp || resp.error !== 0 || !resp.items || resp.items.length === 0) {
        setLoading(false);
        return;
      }

      const item = resp.items[0];

      const driver = Number(parseFloat(String(item.WalletDriver)).toFixed(2));
      const traveler = Number(parseFloat(String(item.Wallet_pass)).toFixed(2));

      setWalletDriver(driver);
      setWalletTraveler(traveler);
      setLastUpdate(item.FechaUpdate || '');
      setLoading(false);
    } catch (e) {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWallet();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadWallet();
    }, []),
  );

  const handleViewTravelerHistory = () => {
    // TODO: navigation to traveler wallet history
    // navigation.navigate('TravelerWalletHistory');
  };

  const handleViewDriverHistory = () => {
    // TODO: navigation to driver wallet history
    // navigation.navigate('DriverWalletHistory');
  };

  const handleTransferToPassengerWallet = () => {
    // TODO: navigation to transfer screen
    // navigation.navigate('TransferToPassengerWallet');
  };

  const handleLoadPassengerWallet = () => {
    // TODO: navigation to top-up screen
    // navigation.navigate('LoadPassengerWallet');
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {lastUpdate ? (
          <Text style={styles.lastUpdate}>Last update: {lastUpdate}</Text>
        ) : null}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" />
          </View>
        ) : (
          <>
            {/* Traveler card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Traveler</Text>
                <Text style={styles.linkText} onPress={handleViewTravelerHistory}>
                  View record
                </Text>
              </View>
              <Text style={styles.amountText}>
                {naira(walletTraveler)}
              </Text>
            </View>

            {/* Driver card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Driver</Text>
                <Text style={styles.linkText} onPress={handleViewDriverHistory}>
                  View record
                </Text>
              </View>
              <Text style={styles.amountText}>
                {naira(walletDriver)}
              </Text>
            </View>

            {/* Buttons under cards */}
            <View style={styles.buttonsContainer}>
              <Boton
                label="Transfer to passenger wallet"
                onPress={handleTransferToPassengerWallet}
              />
              <View style={{ height: 12 }} />
              <Boton
                label="Recharge wallet credit/debit card"
                onPress={handleLoadPassengerWallet}
              />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default MyWallet;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  lastUpdate: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
  },
  loadingContainer: {
    marginTop: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  linkText: {
    fontSize: 12,
    color: '#2563EB',
    textDecorationLine: 'underline',
  },
  amountText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  buttonsContainer: {
    marginTop: 24,
  },
});