// /pages/TripPreferences.tsx
import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import AppAlert from '../components/appAlert';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Input from '../components/input';
import Boton from '../components/boton';
import { useAuth } from '../context/Auth';
import { requestForm, setAuthToken } from '../services/http';

// --- COMPONENTES ESTABLES (evitan remount al tipear) ---
const Row = React.memo(({ children }: { children: React.ReactNode }) => (
  <View style={styles.row}>{children}</View>
));

const Label = React.memo(({ text, onPress }: { text: string; onPress?: () => void }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.7}
    style={styles.labelTap}
    accessibilityRole="button"
  >
    <Text style={{ flex: 1 }}>{text}</Text>
  </TouchableOpacity>
));

const SwitchRight = React.memo(({ value, onToggle }: { value: number; onToggle: () => void }) => (
  <TouchableOpacity
    onPress={onToggle}
    style={styles.rightTap}
    accessibilityRole="switch"
    accessibilityState={{ checked: !!value }}
  >
    <Text>{value ? 'Yes' : 'No'}</Text>
  </TouchableOpacity>
));

const StepperRight = React.memo(({ value, onChange }: { value: number; onChange: (n: number) => void }) => (
  <View style={styles.stepperRightWrap}>
    <TouchableOpacity onPress={() => onChange(Math.max(0, value - 1))} style={styles.stepperBtn} accessibilityLabel="Decrease">
      <Text style={styles.stepperBtnText}>-</Text>
    </TouchableOpacity>
    <Text style={styles.stepperVal}>{value}</Text>
    <TouchableOpacity onPress={() => onChange(Math.min(6, value + 1))} style={styles.stepperBtn} accessibilityLabel="Increase">
      <Text style={styles.stepperBtnText}>+</Text>
    </TouchableOpacity>
  </View>
));

// Endpoints (ajusta si difieren)
const GET_ENDPOINT = '/ax_get_trip_prefs.php';
const SAVE_ENDPOINT = '/ax_update_trip_prefs.php';

// Tipos
type TripPrefs = {
  Mascotas: number;
  Musica: number;
  Comida: number;
  Fumar: number;
  Valijas_cnt: number;
  Valijas_precio: number; // DOUBLE(10,2)
  Ninios: number;
  Aire: number;
  Roofrack: number;
};

type Touched = {
  Valijas_precio: boolean;
  Valijas_cnt: boolean;
};

export default function TripPreferences() {
  const { token } = useAuth();

  // Estado general
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [inlineInfo, setInlineInfo] = useState<string | null>(null);

  // Ref de bloqueo inmediato (evita doble tap antes del render)
  const savingRef = useRef(false);

  // Switches 0/1
  const [Mascotas, setMascotas] = useState(0);
  const [Musica, setMusica] = useState(0);
  const [Comida, setComida] = useState(0);
  const [Fumar, setFumar] = useState(0);
  const [Ninios, setNinios] = useState(0);
  const [Aire, setAire] = useState(0);
  const [Roofrack, setRoofrack] = useState(0);

  // Stepper + Precio
  const [Valijas_cnt, setValijasCnt] = useState(0);
  const [Valijas_precio_text, setValijasPrecioText] = useState(''); // string controlado

  const [touched, setTouched] = useState<Touched>({ Valijas_precio: false, Valijas_cnt: false });
  const markOnly = (k: keyof Touched) => setTouched({ Valijas_precio: false, Valijas_cnt: false, [k]: true });
  // Helpers de UI — movidos a nivel módulo para evitar remounts

  // Normaliza precio: coma→punto y solo dígitos y punto
  const normalizePriceText = (s: string) => s.replace(',', '.').replace(/[^\d.]/g, '');

  // Validaciones (bubbles)
  const errPrecio = useMemo(() => {
    if (!touched.Valijas_precio) return undefined;
    const txt = Valijas_precio_text.trim();
    if (!txt) return 'Price required';
    // hasta 6 enteros + 2 decimales
    if (!/^\d{1,6}(\.\d{1,2})?$/.test(txt)) return 'Max 999999.99';
    const num = Number(txt);
    if (Number.isNaN(num)) return 'Invalid number';
    return undefined;
  }, [touched.Valijas_precio, Valijas_precio_text]);

  const errValijasCnt = useMemo(() => {
    if (!touched.Valijas_cnt) return undefined;
    if (!Number.isInteger(Valijas_cnt)) return 'Must be integer';
    if (Valijas_cnt < 0) return 'Must be >= 0';
    if (Valijas_cnt > 6) return 'Max 6';
    return undefined;
  }, [touched.Valijas_cnt, Valijas_cnt]);

  // Cargar prefs
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setAuthToken(token || '');
        const out = await requestForm<{ error?: number; msg?: string; data?: TripPrefs }>(GET_ENDPOINT, {});
        if (!out.error && out.data) {
          const d = out.data;
          if (!mounted) return;
          setMascotas(d.Mascotas ?? 0);
          setMusica(d.Musica ?? 0);
          setComida(d.Comida ?? 0);
          setFumar(d.Fumar ?? 0);
          setValijasCnt(Math.min(6, d.Valijas_cnt ?? 0)); // clamp a 6
          setValijasPrecioText(String(d.Valijas_precio ?? 0));
          setNinios(d.Ninios ?? 0);
          setAire(d.Aire ?? 0);
          setRoofrack(d.Roofrack ?? 0);
        } else {
          mounted && setServerError(out.msg || 'Could not load preferences');
        }
      } catch (e: any) {
        mounted && setServerError(e?.message || 'Network error');
      } finally {
        mounted && setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [token]);

  // Guardar
  const onSave = async () => {
    // bloqueo inmediato para evitar doble tap antes de que saving se refleje
    if (savingRef.current || saving || loading) return;

    setInlineInfo(null);

    // Validación secuencial
    const txt = Valijas_precio_text.trim();
    if (!txt || !/^\d{1,6}(\.\d{1,2})?$/.test(txt)) { markOnly('Valijas_precio'); return; }
    const priceNum = Number(txt);

    if (!Number.isInteger(Valijas_cnt) || Valijas_cnt < 0 || Valijas_cnt > 6) { markOnly('Valijas_cnt'); return; }

    try {
      savingRef.current = true; // 🔒 bloqueo inmediato
      setSaving(true);

      const payload = {
        Mascotas, Musica, Comida, Fumar,
        Valijas_cnt,
        Valijas_precio: Number(priceNum.toFixed(2)),
        Ninios, Aire, Roofrack,
      };
      const out = await requestForm<{ error?: number; msg?: string }>(SAVE_ENDPOINT, payload);
      if (!out.error) {
        setInlineInfo('Preferences saved');
      } else {
        setServerError(out.msg || 'Could not save');
      }
    } catch (e: any) {
      setServerError(e?.message || 'Network error');
    } finally {
      setSaving(false);
      savingRef.current = false; // 🔓 libera en cualquier caso
    }
  };

  // Handler estable para evitar re-renders innecesarios (evita pérdida de foco)
  const onChangePrecio = useCallback((text: string) => {
    setValijasPrecioText(text);
  }, []);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator />
      </View>
    );
  }

  const isBusy = saving || loading;
  return (
    <KeyboardAwareScrollView
      contentContainerStyle={[styles.container, { paddingBottom: 140 }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="always"
      enableOnAndroid
      enableAutomaticScroll
      extraScrollHeight={140}
      extraHeight={140}
    >
      {/* HTTP/servidor/red */}
      {!!serverError && <AppAlert message={serverError} onClose={() => setServerError(null)} />}
      {/* info inline */}
      {!!inlineInfo && <Text style={styles.inlineInfo}>{inlineInfo}</Text>}

      <Text style={styles.sectionTitle}>Trip preferences</Text>

      {/* Switches (derecha) */}
      <Row><Label text="Allow pets" onPress={() => setMascotas(Mascotas ? 0 : 1)} /><SwitchRight value={Mascotas} onToggle={() => setMascotas(Mascotas ? 0 : 1)} /></Row>
      <Row><Label text="Play music" onPress={() => setMusica(Musica ? 0 : 1)} /><SwitchRight value={Musica} onToggle={() => setMusica(Musica ? 0 : 1)} /></Row>
      <Row><Label text="Allow food" onPress={() => setComida(Comida ? 0 : 1)} /><SwitchRight value={Comida} onToggle={() => setComida(Comida ? 0 : 1)} /></Row>
      <Row><Label text="Allow smoking" onPress={() => setFumar(Fumar ? 0 : 1)} /><SwitchRight value={Fumar} onToggle={() => setFumar(Fumar ? 0 : 1)} /></Row>
      <Row><Label text="Allow children" onPress={() => setNinios(Ninios ? 0 : 1)} /><SwitchRight value={Ninios} onToggle={() => setNinios(Ninios ? 0 : 1)} /></Row>
      <Row><Label text="Use A/C" onPress={() => setAire(Aire ? 0 : 1)} /><SwitchRight value={Aire} onToggle={() => setAire(Aire ? 0 : 1)} /></Row>
      <Row><Label text="Has roof rack" onPress={() => setRoofrack(Roofrack ? 0 : 1)} /><SwitchRight value={Roofrack} onToggle={() => setRoofrack(Roofrack ? 0 : 1)} /></Row>

      {/* Max bags a la derecha con stepper */}
      <Row>
        <Label text="Max bags" />
        <StepperRight
          value={Valijas_cnt}
          onChange={(n) => {
            setValijasCnt(Math.min(6, Math.max(0, n))); // clamp también aquí
            setInlineInfo(null);
          }}
        />
      </Row>
      <View style={styles.errorSpacer}>{!!errValijasCnt && <Text style={styles.errorInline}>{errValijasCnt}</Text>}</View>

      {/* Precio compacto a la derecha usando nuestro Input */}
      <Row>
        <Label text="Baggage price" />
        <View style={styles.priceWrap}>
          <Input            
            value={Valijas_precio_text}
            onChangeText={setValijasPrecioText}
            placeholder="0.00"
            // Usamos phone-pad porque ya funciona en otras pantallas del proyecto (numérico estable en Android/iOS)
            keyboardType="phone-pad"
            maxlenght={9}
            onBlur={() => {
              setValijasPrecioText(prev => normalizePriceText((prev || '').trim()));
              setTouched(v => ({ ...v, Valijas_precio: true }));
            }}
            error={errPrecio}
            errorMode="bubble"
          />
        </View>
      </Row>
      <View style={styles.errorSpacer}>{!!errPrecio && <Text style={styles.errorInline}>{errPrecio}</Text>}</View>

      {/* Botón SAVE bloqueado sin "raya" y sin gran radius */}
      <View style={{ marginTop:12, marginBottom:40 }}>
        <Boton
          label={saving ? 'Saving…' : 'Save'}
          onPress={() => { if (!saving) onSave(); }}
        />
      </View>

      {saving && (
        <View style={styles.overlay} pointerEvents="auto">
          <ActivityIndicator size="large" />
          <Text style={styles.overlayText}>Saving… please wait</Text>
        </View>
      )}

    </KeyboardAwareScrollView>
  );
}

/* -------- styles -------- */
const styles = StyleSheet.create({
  container: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  rightTap: { paddingVertical: 6, paddingHorizontal: 12 },
  stepperRightWrap: { flexDirection: 'row', alignItems: 'center' },
  stepperBtn: {
    width: 36, height: 32, borderRadius: 6, borderWidth: 1, borderColor: '#ccc',
    alignItems: 'center', justifyContent: 'center',
  },
  stepperBtnText: { fontSize: 18, fontWeight: '700' },
  stepperVal: { width: 44, textAlign: 'center', fontSize: 16, fontWeight: '700', marginHorizontal: 8 },
  priceWrap: { width: 140 }, // compacto: entra 999999.99
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  overlay: { position:'absolute', left:0, top:0, right:0, bottom:0, backgroundColor:'rgba(255, 255, 255, 0.25)', alignItems:'center', justifyContent:'center' },
  overlayText: { marginTop:8, color:'#fff', fontSize:14 },
  inlineInfo: { color: '#08660b', marginBottom: 8 },
  errorInline: { color: '#b00020' },
  errorSpacer: { minHeight: 18, justifyContent: 'center' }, // evita saltos que cierran teclado
  btnGuard: { borderRadius: 6, borderWidth: 0 },
  btnWrap: { position: 'relative' },
  btnOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'transparent' },
  btnDisabled: { opacity: 0.5 },
  labelTap: { flex: 1, paddingVertical: 6 },
});