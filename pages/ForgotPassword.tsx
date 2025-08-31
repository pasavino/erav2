// /pages/ForgotPassword.tsx
import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Boton from '../components/boton';
import Input from '../components/input';
import { auth, RecoverRes } from '../services/api';
import { Image, useWindowDimensions } from 'react-native';

export default function ForgotPassword() {
  const nav = useNavigation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [touchedEmail, setTouchedEmail] = useState(false);
  const [serverErr, setServerErr] = useState<string | undefined>(undefined);

  const isEmail = (s: string) => /^\S+@\S+\.\S+$/.test(s);
  const showValidation = submitted || touchedEmail;

  const errMsg = useMemo(() => {
    if (!showValidation) return undefined;
    if (!email.trim()) return 'Email required';
    if (!isEmail(email)) return 'Enter a valid email';
    return undefined;
  }, [showValidation, email]);

  const onSend = async () => {
    setSubmitted(true);
    setServerErr(undefined);
    if (errMsg) return; // no enviar con error

    try {
      setLoading(true);
      const res: RecoverRes = await auth.recover(email); // {error, msg}
      if (res.error === 0) {
        Alert.alert('Success', 'Password sent to your email.');
        nav.goBack();
      } else {
        setServerErr(res.msg || 'Recovery failed');
      }
    } catch (e: any) {
      setServerErr(e?.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const { width: winWidth } = useWindowDimensions();
  const heroHeight = Math.round(winWidth * 0.45);

  return (
    <View style={styles.wrap}>
      <Image
        source={require('../assets/niger.png')}
        style={{
          width: '100%',
          height: heroHeight,
          alignSelf: 'stretch',
          marginBottom: 12,
          transform: [{ translateY: -90 }]
        }}
        resizeMode="cover"   // <- en vez de "contain"
      />
      <Text style={styles.title}>Forgot your password?</Text>
      <Text style={styles.desc}>Enter your registered email and we’ll send you a new password.</Text>

      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        onBlur={() => setTouchedEmail(true)}
        error={errMsg}             // <-- siempre bubble si hay error
        errorMode="bubble"
      />

      {serverErr ? <Text style={styles.serverErr}>{serverErr}</Text> : null}

      {loading ? <ActivityIndicator/> : <Boton label="Send password" onPress={onSend} />}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 16, justifyContent: 'center', gap: 12 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 4, marginTop:-50 },
  desc: { fontSize: 14, color: '#666', marginBottom: 8 },
  serverErr: { color: '#b00020' }
});