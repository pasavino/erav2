// pages/Vehicles.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, Platform, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import Boton from '../components/boton';
import Input from '../components/input';
import AppAlert from '../components/appAlert';
import { requestForm, ensureOk } from '../services/http';

type Brand = { id: string; name: string };
type Model = { id: string; name: string };
type Color = { id: string; name: string; hex?: string };
type Step = 1 | 2 | 3;

const ENDPOINTS = {
  marcas: 'ax_ListaMarcas.php',
  modelos: 'ax_ListaModelos.php',
  colores: 'ax_ListaColores.php',
  add: 'ax_AddVehicle.php', // 👈 nuevo endpoint de alta
};

export default function Vehicles() {
  const [step, setStep] = useState<Step>(1);

  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [colors, setColors] = useState<Color[]>([]);

  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [selectedColor, setSelectedColor] = useState<Color | null>(null);

  const [qBrand, setQBrand] = useState('');
  const [qModel, setQModel] = useState('');
  const [qColor, setQColor] = useState('');

  const [loadingBrands, setLoadingBrands] = useState(true);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingColors, setLoadingColors] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const mounted = useRef(true);
  const navigation = useNavigation<any>();

  useEffect(() => {
    mounted.current = true;
    (async () => {
      await Promise.all([loadBrands(), loadColors()]);
    })();
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (selectedBrand) loadModels(selectedBrand.id);
    else setModels([]);
  }, [selectedBrand?.id]);

  // 👇 Popup de éxito con título correcto + navegación a Car
  useEffect(() => {
    if (successMsg) {
      Alert.alert(
        'Success',
        successMsg,
        [
          {
            text: 'OK',
            onPress: () => {
              setSuccessMsg(null);
              navigation.navigate('Car');
            },
          },
        ],
        { cancelable: false }
      );
    }
  }, [successMsg, navigation]);

  /* ------------------------- Normalization helpers ------------------------- */

  const firstArrayIn = (obj: any): any[] => {
    if (Array.isArray(obj)) return obj;
    if (obj && typeof obj === 'object') {
      const prefer = ['items', 'lista', 'marcas', 'models', 'modelos', 'colores', 'data', 'rows'];
      for (const k of prefer) if (Array.isArray((obj as any)[k])) return (obj as any)[k];
      for (const v of Object.values(obj)) if (Array.isArray(v)) return v as any[];
    }
    return [];
  };

  // Marcas: IdVehiculo / Nombre
  const mapBrand = (a: any[]): Brand[] =>
    a.map((x: any) => ({
      id: String(x.IdVehiculo ?? ''),
      name: String(x.Nombre ?? ''),
    })).filter(it => it.id && it.name);

  // Modelos: IdModelo / ModelDesc
  const mapModel = (a: any[]): Model[] =>
    a.map((x: any) => ({
      id: String(x.IdModelo ?? x.id ?? x.ID ?? ''),
      name: String(x.ModelDesc ?? x.name ?? x.nombre ?? ''),
    })).filter(it => it.id && it.name);

  // Colores: IdColor / NombreColor / CodigoColor
  const mapColor = (a: any[]): Color[] =>
    a.map((x: any) => ({
      id: String(x.IdColor ?? ''),
      name: String(x.NombreColor ?? x.Nombre ?? x.name ?? ''),
      hex: x.CodigoColor ?? x.ColorHex ?? x.hex ?? undefined,
    })).filter(it => it.id && it.name);

  /* --------------------------------- Loads --------------------------------- */

  async function loadBrands() {
    try {
      setLoadingBrands(true);
      const json: any = await requestForm(ENDPOINTS.marcas, {});
      const lista = firstArrayIn(json);
      if (!mounted.current) return;
      setBrands(mapBrand(lista));
    } catch (e: any) {
      setAlertMsg(`Could not load brands: ${e?.message || e}`);
    } finally {
      setLoadingBrands(false);
    }
  }

  async function loadModels(brandId: string) {
    try {
      setLoadingModels(true);
      const json: any = await requestForm(ENDPOINTS.modelos, { IdMarca: brandId });
      const lista = firstArrayIn(json);
      if (!mounted.current) return;
      setModels(mapModel(lista));
    } catch (e: any) {
      setAlertMsg(`Could not load models: ${e?.message || e}`);
    } finally {
      setLoadingModels(false);
    }
  }

  async function loadColors() {
    try {
      setLoadingColors(true);
      const json: any = await requestForm(ENDPOINTS.colores, {});
      const lista = firstArrayIn(json);
      if (!mounted.current) return;
      setColors(mapColor(lista));
    } catch (e: any) {
      setAlertMsg(`Could not load colors: ${e?.message || e}`);
    } finally {
      setLoadingColors(false);
    }
  }

  /* -------------------------------- Actions -------------------------------- */

  const canNext =
    (step === 1 && !!selectedBrand) ||
    (step === 2 && !!selectedModel) ||
    (step === 3 && !!selectedColor);

  function isLoadingCurrentStep() {
    if (step === 1) return loadingBrands;
    if (step === 2) return loadingModels;
    return loadingColors;
  }

  function goBack() {
    if (submitting) return;
    setStep(prev => (prev > 1 ? ((prev - 1) as Step) : prev));
  }

  function goNext() {
    if (!canNext || submitting) return;
    setStep((step + 1) as Step);
  }

  // 👇 Implementación del guardado
  async function handleSubmit() {
    if (!selectedBrand || !selectedModel || !selectedColor) return;
    try {
      setSubmitting(true);
      await ensureOk(requestForm(ENDPOINTS.add, {
        IdMarca: String(selectedBrand.id),
        IdModelo: String(selectedModel.id),
        IdColor: String(selectedColor.id),
      }));
      setSuccessMsg('Vehicle added successfully.');
      // (Opcional) reset del wizard — lo dejo comentado:
      // setSelectedBrand(null); setSelectedModel(null); setSelectedColor(null);
      // setQBrand(''); setQModel(''); setQColor(''); setStep(1);
    } catch (e: any) {
      setAlertMsg(e?.message || 'Could not save vehicle.');
    } finally {
      setSubmitting(false);
    }
  }

  /* -------------------------------- Filters -------------------------------- */

  const filteredBrands = useMemo(() => {
    const q = qBrand.trim().toLowerCase();
    return q ? brands.filter(b => b.name.toLowerCase().includes(q)) : brands;
  }, [brands, qBrand]);

  const filteredModels = useMemo(() => {
    const q = qModel.trim().toLowerCase();
    return q ? models.filter(m => m.name.toLowerCase().includes(q)) : models;
  }, [models, qModel]);

  const filteredColors = useMemo(() => {
    const q = qColor.trim().toLowerCase();
    return q ? colors.filter(c => c.name.toLowerCase().includes(q)) : colors;
  }, [colors, qColor]);

  /* ---------------------------------- UI ----------------------------------- */

  function Item({
    label, selected, onPress, right, colorPreview,
  }: { label: string; selected: boolean; onPress: () => void; right?: React.ReactNode; colorPreview?: string; }) {
    return (
      <Pressable onPress={onPress} style={[styles.row, selected && styles.rowSel]}>
        <View style={styles.rowLeft}>
          {colorPreview ? <View style={[styles.swatch, { backgroundColor: colorPreview }]} /> : null}
          <Text style={styles.rowText}>{label}</Text>
        </View>
        {right || (selected ? <Text style={styles.rowRight}>✓</Text> : <Text style={styles.rowRight}> </Text>)}
      </Pressable>
    );
  }

  function StepHeader() {
    return (
      <View style={styles.header}>
        <Text style={styles.title}>Add Vehicle</Text>
        <Text style={styles.step}>Step {step} of 3</Text>
      </View>
    );
  }

  function Footer() {
    const nextLabel =
      step < 3 ? (isLoadingCurrentStep() ? 'Loading…' : 'Next') :
      (submitting ? 'Saving…' : 'Save');

    const onPressNext =
      step < 3 ? (canNext && !isLoadingCurrentStep() ? goNext : undefined)
               : (canNext && !submitting ? handleSubmit : undefined);

    return (
      <View style={styles.footer}>
        <Boton label="Back" onPress={step === 1 || submitting ? undefined : goBack} />
        <Boton label={nextLabel} onPress={onPressNext} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StepHeader />

      {/* Step 1: Brand */}
      {step === 1 && (
        <View style={styles.stepWrap}>
          <Input label="Search brand" value={qBrand} onChangeText={setQBrand} placeholder="Toyota, Ford, Nissan…" />
          {loadingBrands ? (
            <ActivityIndicator style={styles.loader} />
          ) : (
            <FlatList
              data={filteredBrands}
              keyExtractor={(it) => it.id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Item
                  label={item.name}
                  selected={selectedBrand?.id === item.id}
                  onPress={() => {
                    if (item.id !== selectedBrand?.id) setSelectedModel(null);
                    setSelectedBrand(item);
                  }}
                />
              )}
              ListEmptyComponent={<Text style={styles.empty}>No brands found.</Text>}
            />
          )}
        </View>
      )}

      {/* Step 2: Model */}
      {step === 2 && (
        <View style={styles.stepWrap}>
          <Text style={styles.helper}>
            Selected brand: <Text style={styles.helperBold}>{selectedBrand?.name ?? '-'}</Text>
          </Text>
          <Input label="Search model" value={qModel} onChangeText={setQModel} placeholder="Corolla, Ranger, Sentra…" />
          {loadingModels ? (
            <ActivityIndicator style={styles.loader} />
          ) : (
            <FlatList
              data={filteredModels}
              keyExtractor={(it) => it.id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Item
                  label={item.name}
                  selected={selectedModel?.id === item.id}
                  onPress={() => setSelectedModel(item)}
                />
              )}
              ListEmptyComponent={<Text style={styles.empty}>No models for this brand.</Text>}
            />
          )}
        </View>
      )}

      {/* Step 3: Color */}
      {step === 3 && (
        <View style={styles.stepWrap}>
          <Text style={styles.helper}>
            {'Brand: '}
            <Text style={styles.helperBold}>{selectedBrand?.name ?? '-'}</Text>
            {'  ·  Model: '}
            <Text style={styles.helperBold}>{selectedModel?.name ?? '-'}</Text>
          </Text>

          <Input label="Search color" value={qColor} onChangeText={setQColor} placeholder="Black, White, Red…" />

          {loadingColors ? (
            <ActivityIndicator style={styles.loader} />
          ) : (
            <FlatList
              data={filteredColors}
              keyExtractor={(it) => it.id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Item
                  label={item.name}
                  selected={selectedColor?.id === item.id}
                  colorPreview={item.hex}
                  onPress={() => setSelectedColor(item)}
                />
              )}
              ListEmptyComponent={<Text style={styles.empty}>No colors available.</Text>}
            />
          )}
        </View>
      )}

      <Footer />

      {/* Alerts */}
      {alertMsg ? <AppAlert message={alertMsg} onClose={() => setAlertMsg(null)} /> : null}
      {/* 👇 quitamos AppAlert para éxito; se maneja con Alert.alert arriba */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  header: { marginBottom: 8 },
  title: { fontSize: 20, fontWeight: '700', color: '#111' },
  step: { marginTop: 2, color: '#666' },
  stepWrap: { flex: 1, marginTop: 8 },
  loader: { marginTop: 16 },
  empty: { textAlign: 'center', color: '#777', marginTop: 16 },
  helper: { marginBottom: 8, color: '#333' },
  helperBold: { fontWeight: '700', color: '#111' },
  row: {
    paddingVertical: 12, paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e5e5e5',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  rowSel: { backgroundColor: '#f1f8ff' },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowText: { fontSize: 16, color: '#111' },
  rowRight: { fontSize: 18, width: 22, textAlign: 'right', color: '#0a7' },
  swatch: { width: 18, height: 18, borderRadius: 9, borderWidth: StyleSheet.hairlineWidth, borderColor: '#ccc' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingTop: 8, paddingBottom: Platform.select({ ios: 12, android: 8 }) },
});