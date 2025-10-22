// /pages/Login.tsx
import { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, useWindowDimensions, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Boton from '../components/boton';
import Input from '../components/input';
import AppAlert from '../components/appAlert';
import { useAuth } from '../context/Auth';
import { auth } from '../services/auth';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// ✅ biometrics en carpeta lib (plural)
import {
  isBiometricAvailable,
  biometricAuthenticate,
  getCreds,
  saveCreds,
} from '../lib/biometrics';

export default function Login() {
  const nav = useNavigation();
  const { signIn, token } = (useAuth() as any);

  const [email, setEmail] = useState('');
  const [pass,  setPass]  = useState('');
  const [loading, setLoading] = useState(false);

  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState<{ email:boolean; pass:boolean }>({ email:false, pass:false });
  const [alertMsg, setAlertMsg] = useState<string | null>(null); // popup

  // 🔐 Biometrics
  const [bioAvailable, setBioAvailable] = useState(false);
  const [haveCreds, setHaveCreds] = useState(false);

  // Si ya hay token → ir a Home (sin pedir huella)
  useEffect(() => {
    if (token) {
      try {
        nav.reset({ index: 0, routes: [{ name: 'Home' as never }] });
      } catch { /* Gate/MainTabs también redirige; no-op si falla */ }
    }
  }, [token, nav]);

  // Init biometría (disponibilidad + si hay credenciales guardadas)
  useEffect(() => {
    (async () => {
      try {
        const ok = await isBiometricAvailable();
        const creds = await getCreds();
        setBioAvailable(ok);
        setHaveCreds(!!creds);
      } catch {
        setBioAvailable(false);
        setHaveCreds(false);
      }
    })();
  }, []);

  const isEmail = (s:string)=>/^\S+@\S+\.\S+$/.test(s);
  const showValidationEmail = submitted || touched.email;
  const showValidationPass  = submitted || touched.pass;

  const errEmail = useMemo(() => {
    if (!showValidationEmail) return undefined;
    if (!email.trim()) return 'Email required';
    if (!isEmail(email)) return 'Enter a valid email';
    return undefined;
  }, [showValidationEmail, email]);

  const errPass = useMemo(() => {
    if (!showValidationPass) return undefined;
    if (!pass) return 'Password required';
    return undefined;
  }, [showValidationPass, pass]);

  const onLogin = async () => {
    if (loading) return; // evita doble tap

    // Validación rápida
    const hasEmail = email.trim().length > 0;
    const validEmail = /^\S+@\S+\.\S+$/.test(email);
    const hasPass = pass.trim().length > 0;

    setSubmitted(true);

    if (!hasEmail || !validEmail || !hasPass) return;

    try {
      setLoading(true);
      const res = await signIn(email, pass);
      // Si login OK, guardamos credenciales para habilitar huella en futuros ingresos
      if (!res?.error) {
        await saveCreds(email, pass);
        setHaveCreds(true);
      } else if (res?.msg) {
        setAlertMsg(res.msg);
      }
    } catch (e: any) {
      setAlertMsg(e?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // 👉 Aquí se dispara el ESCANEO de huella
  const onBiometricLogin = async () => {
    if (loading) return;
    try {
      setLoading(true);
      const ok = await biometricAuthenticate('Use your fingerprint to continue');
      if (!ok) return;

      // Si no hay credenciales guardadas, avisamos
      const creds = await getCreds();
      if (!creds) {
        setAlertMsg('No saved credentials available for biometrics. Sign in once first.');
        return;
      }

      const res = await signIn(creds.email, creds.password);
      if (res?.error) setAlertMsg(res?.msg || 'Could not sign in.');
    } catch (e: any) {
      setAlertMsg(e?.message || 'Biometric error.');
    } finally {
      setLoading(false);
    }
  };

  // Imagen (sin recortes)
  const { width: winWidth, height: winHeight } = useWindowDimensions();
  const hero = require('../assets/niger.png');
  const { width: imgW, height: imgH } = Image.resolveAssetSource(hero);
  const ratio = imgW / imgH;
  const maxH = Math.round(winHeight * 0.28);
  let w = Math.min(winWidth - 32, 480);
  let h = Math.round(w / ratio);
  if (h > maxH) { h = maxH; w = Math.round(h * ratio); }

  return (
    <>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.wrap}
        enableOnAndroid
        extraScrollHeight={24}
        extraHeight={24}
        keyboardShouldPersistTaps="handled"
      >
        <Image
          source={hero}
          style={{ width: w, height: h, alignSelf: 'center', marginBottom: 10, marginTop: -10 }}
          resizeMode="contain"
        />

        <Text style={styles.title}>Sign in</Text>

        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          onBlur={()=> setTouched(v=>({ ...v, email:true }))}
          error={errEmail}
          errorMode="bubble"
          maxlenght={50}
        />

        <Input
          label="Password"
          value={pass}
          onChangeText={setPass}
          placeholder="••••••••"
          secureTextEntry
          onBlur={()=> setTouched(v=>({ ...v, pass:true }))}
          error={errPass}
          errorMode="bubble"
          maxlenght={20}
        />

        {loading ? (
          <ActivityIndicator />
        ) : (
          <>
            {/* FILA: Login (izq) + botón de huella (der) */}
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Boton label="Login" onPress={onLogin} />
              </View>

              {bioAvailable ? (
                <TouchableOpacity
                  onPress={onBiometricLogin}
                  style={styles.fpBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Sign in with fingerprint"
                >
                  <MaterialCommunityIcons name="fingerprint" size={24} />
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={{ height: 8 }} />
            <Boton label="Forgot password?" onPress={() => nav.navigate('ForgotPassword' as never)} />
            <View style={{ height: 8 }} />
            <Boton label="Create account" onPress={() => nav.navigate('Register' as never)} />
          </>
        )}
      </KeyboardAwareScrollView>

      {/* Popup reusable para errores del backend */}
      <AppAlert
        message={alertMsg || ''}
        onClose={() => setAlertMsg(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  wrap:  { flexGrow: 1, padding: 16, justifyContent: 'flex-start', backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '600', marginTop: 10, marginBottom: 2, textAlign: 'center' },
  row:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fpBtn: {
    width: 48, height: 48,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderRadius: 12, marginLeft: 8,
  },
});