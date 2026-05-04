// pages/AdvanceSearch.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import Select from '../components/select';
import DatePicker from '../components/datePicker';
import Input from '../components/input';
import Boton from '../components/boton';
import { lists } from '../services/lists';
import type { Option } from '../services/lists';
import AppAlert from '../components/appAlert';
import { advanceSearchService } from '../services/advanceSearch';

// Helper: hoy en YYYY-MM-DD
const todayYMD = () => {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
};

export default function AdvanceSearch({ navigation }: any) {
  // Estado para los combos y campos del formulario
  const [fromOpt, setFromOpt] = useState<Option[]>([]);
  const [toOpt, setToOpt] = useState<Option[]>([]);
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string | null>(todayYMD());
  const [dateTo, setDateTo] = useState<string | null>(null);
  const [priceFrom, setPriceFrom] = useState<string>('');
  const [priceTo, setPriceTo] = useState<string>('');

  // Estado de la alerta
  const [alertInfo, setAlertInfo] = useState<{ title: string; message: string } | null>(null);

  // Estado de carga
  const [loadingCombos, setLoadingCombos] = useState(true);
  const [searching, setSearching] = useState(false);

  // Cargar combos de "From" y "To"
  useEffect(() => {
    const loadCombos = async () => {
      try {
        setLoadingCombos(true);
        const { lista: fromList } = await lists.cities('from');
        const { lista: toList } = await lists.cities('to');
        setFromOpt(fromList || []);
        setToOpt(toList || []);
        if (fromList?.length) setFrom(fromList[0].id);
        if (toList?.length) setTo(toList[0].id);
      } catch (error) {
        console.error("Failed to load cities:", error);
        setAlertInfo({ title: 'Error', message: 'Failed to load cities.' });
      } finally {
        setLoadingCombos(false);
      }
    };
    loadCombos();
  }, []);

  const handleSearch = async () => {
    const today = todayYMD();

    if (!from || !to || !dateFrom || !dateTo || !priceFrom || !priceTo) {
        setAlertInfo({ title: 'Validation Error', message: 'All fields are required.' });
        return;
    }

    if (from === to) {
      setAlertInfo({ title: 'Validation Error', message: 'From and To cities cannot be the same.' });
      return;
    }

    if (dateFrom < today) {
      setAlertInfo({ title: 'Validation Error', message: 'Date From cannot be in the past.' });
      return;
    }

    if (dateFrom > dateTo) {
      setAlertInfo({ title: 'Validation Error', message: 'Date From cannot be later than Date To.' });
      return;
    }

    if (parseFloat(priceFrom) > parseFloat(priceTo)) {
      setAlertInfo({ title: 'Validation Error', message: 'Price From cannot be greater than Price To.' });
      return;
    }

    setSearching(true);
    try {
      const response = await advanceSearchService.search({
        from,
        to,
        dateFrom,
        dateTo,
        priceFrom,
        priceTo,
        page: 1,
      });

      if (response.error === 0) {
        const trips = response.lista || [];
        if (trips.length > 0) {
          navigation.navigate('AdvSearchResult', { 
            trips: trips,
            searchParams: { from, to, dateFrom, dateTo, priceFrom, priceTo },
            hasMore: response.hasMore,
          });
        } else {
          setAlertInfo({ title: 'No Results', message: 'No trips found for your search criteria.' });
        }
      } else {
        setAlertInfo({ title: 'Search Failed', message: response.msg || 'An unknown error occurred.' });
      }
    } catch (error) {
      console.error("Search failed:", error);
      setAlertInfo({ title: 'Error', message: 'An error occurred during the search.' });
    } finally {
      setSearching(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 60}
    >
      <View style={styles.container}>
        {alertInfo && (
          <AppAlert
            title={alertInfo.title}
            message={alertInfo.message}
            onClose={() => setAlertInfo(null)}
          />
        )}
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Advance Search</Text>
        </View>

        <ScrollView style={styles.formContainer} contentContainerStyle={{ paddingBottom: 40 }}>
          {loadingCombos ? (
            <ActivityIndicator size="large" style={{ marginTop: 40 }} />
          ) : (
            <>
              <Select
                label="From"
                options={fromOpt.map(o => ({ label: o.text, value: o.id }))}
                value={from}
                onChange={setFrom}
              />
              <Select
                label="To"
                options={toOpt.map(o => ({ label: o.text, value: o.id }))}
                value={to}
                onChange={setTo}
              />
              <DatePicker
                label="Date From (YYYY-MM-DD)"
                value={dateFrom}
                onChange={setDateFrom}
              />
              <View style={{ marginBottom: 8 }} />
              <DatePicker
                label="Date To (YYYY-MM-DD)"
                value={dateTo}
                onChange={setDateTo}
              />
              <View style={{ marginBottom: 8 }} />
              <Input
                label="Price From"
                value={priceFrom}
                onChangeText={setPriceFrom}
                keyboardType="numeric"
                placeholder="Enter minimum price"
              />
              <View style={{ marginBottom: 8 }} />
              <Input
                label="Price To"
                value={priceTo}
                onChangeText={setPriceTo}
                keyboardType="numeric"
                placeholder="Enter maximum price"
              />
              <View style={{ marginTop: 20 }}>
                <Boton
                  label={searching ? 'Searching...' : 'Search'}
                  onPress={handleSearch}
                  disabled={searching}
                />
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  formContainer: {
    flex: 1,
    padding: 16,
  },
});
