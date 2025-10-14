// /pages/ForgotPassword.tsx
import React, { useState, useMemo } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  useWindowDimensions,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Boton from '../components/boton';
import Input from '../components/input';
import { auth } from '../services/auth';

type RecoverRes = { error: number; msg?: string };

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
    if (errMsg) return;
    try {
      setLoading(true);
      const res = (await auth.recover(email)) as unknown as RecoverRes;
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

  const { width } = useWindowDimensions();
  const heroHeight = Math.round(width * 0.45);
  const KV_OFFSET = Platform.OS === 'ios' ? 80 : 0;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={KV_OFFSET}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.wrap}
        keyboardShouldPersistTaps="handled"
      >
        <Image
          source={require('../assets/niger.png')}
          style={{ width: '100%', height: heroHeight, alignSelf: 'stretch', marginBottom: 12 }}
          resizeMode="cover"
        />

        <Text style={styles.title}>Forgot your password?</Text>
        <Text style={styles.desc}>
          Enter your registered email and we’ll send you a new password.
        </Text>

        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          onBlur={() => setTouchedEmail(true)}
          error={errMsg}
          errorMode="bubble"
          maxlenght={50}
        />

        {serverErr ? <Text style={styles.serverErr}>{serverErr}</Text> : null}

        <View style={{ height: 12 }} />
        {loading ? <ActivityIndicator /> : <Boton label="Send password" onPress={onSend} />}
        <View style={{ height: 24 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: { flexGrow: 1, padding: 16, gap: 12 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  desc: { fontSize: 14, color: '#666', marginBottom: 8 },
  serverErr: { color: '#b00020' },
});