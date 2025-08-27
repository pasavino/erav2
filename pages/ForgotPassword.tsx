// /pages/ForgotPassword.tsx
import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Boton from '../components/boton';
import { auth, RecoverRes } from '../services/api';

export default function ForgotPassword() {
  const nav = useNavigation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const isEmail = (s: string) => /^\S+@\S+\.\S+$/.test(s);

  const onSend = async () => {
    setErr(null);
    if (!isEmail(email)) { setErr('Enter a valid email'); return; }
    try {
      setLoading(true);
      const res: RecoverRes = await auth.recover(email); // {error,msg}
      if (res.error === 0) {
        Alert.alert('Success', 'Password sent to your email.');
        nav.goBack();
      } else {
        setErr(res.msg || 'Recovery failed');
      }
    } catch (e:any) {
      setErr(e?.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Forgot your password?</Text>
      <Text style={styles.desc}>Enter your registered email and we’ll send you a new password.</Text>
      <TextInput style={styles.input} placeholder="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail}/>
      {err ? <Text style={styles.err}>{err}</Text> : null}
      {loading ? <ActivityIndicator/> : <Boton label="Send password" onPress={onSend} />}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 16, justifyContent: 'center', gap: 12 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  desc: { fontSize: 14, color: '#666', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12 },
  err: { color: '#b00020' },
});
