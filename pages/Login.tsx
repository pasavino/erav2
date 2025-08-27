// /pages/Login.tsx
import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Boton from '../components/boton';
import { useAuth } from '../context/Auth';

export default function Login() {
  const nav = useNavigation();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [pass, setPass]   = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const isEmail = (s:string)=>/^\S+@\S+\.\S+$/.test(s);

  const onLogin = async () => {
    setErr(null);
    if (!isEmail(email)) { setErr('Invalid email'); return; }
    if (!pass) { setErr('Password required'); return; }
    try { setLoading(true); await signIn(email, pass); Alert.alert('Welcome', email); }
    catch(e:any){ setErr(e?.message || 'Login failed'); }
    finally{ setLoading(false); }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={styles.wrap}>
      <Text style={styles.title}>Sign in</Text>
      <TextInput style={styles.input} placeholder="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail}/>
      <TextInput style={styles.input} placeholder="Password" secureTextEntry value={pass} onChangeText={setPass}/>
      {err ? <Text style={styles.err}>{err}</Text> : null}
      {loading ? <ActivityIndicator/> : (
        <>
          <Boton label="Login" onPress={onLogin}/>
          <View style={{ height: 8 }} />
          <Boton label="Forgot password?" onPress={() => nav.navigate('ForgotPassword' as never)}/>
          <View style={{ height: 8 }} />
          <Boton label="Create account" onPress={() => Alert.alert('Create account', 'TODO: Sign up screen')}/>
        </>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap:{ flex:1, padding:16, gap:12, justifyContent:'center' },
  title:{ fontSize:22, fontWeight:'600', marginBottom:8, textAlign:'center' },
  input:{ borderWidth:1, borderColor:'#ddd', borderRadius:10, padding:12 },
  err:{ color:'#b00020', marginTop:-4 }
});
