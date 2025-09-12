// /pages/Login.tsx
import { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, Image, useWindowDimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Boton from '../components/boton';
import Input from '../components/input';
import AppAlert from '../components/appAlert';
import { useAuth } from '../context/Auth';

export default function Login() {
  const nav = useNavigation();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [pass,  setPass]  = useState('');
  const [loading, setLoading] = useState(false);

  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState<{ email:boolean; pass:boolean }>({ email:false, pass:false });
  const [alertMsg, setAlertMsg] = useState<string | null>(null); // ← popup

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
    setSubmitted(true);
    if (errEmail || errPass) return;
    try {
      setLoading(true);
      await signIn(email, pass);           // si error=0 → Gate manda a Home
    } catch (e:any) {
      setAlertMsg(e?.message || 'Login failed'); // ← msg del backend en popup
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
        />

        {loading ? (
          <ActivityIndicator />
        ) : (
          <>
            <Boton label="Login" onPress={onLogin} />
            <View style={{ height: 8 }} />
            <Boton label="Forgot password?" onPress={() => nav.navigate('ForgotPassword' as never)} />
            <View style={{ height: 8 }} />
            <Boton label="Create account" onPress={() => {/* TODO: sign up */}} />
          </>
        )}
      </KeyboardAwareScrollView>

      {/* Popup reusable para errores del backend */}
      <AppAlert
        message={alertMsg || ''}              // ← sólo estos 2 props
        onClose={() => setAlertMsg(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  wrap:  { flexGrow: 1, padding: 16, justifyContent: 'flex-start', backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '600', marginTop: 10, marginBottom: 2, textAlign: 'center' },
});
