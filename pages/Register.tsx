// pages/Register.tsx
import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import Boton from '../components/boton';
import Input from '../components/input';
import AppAlert from '../components/appAlert';
import { useAuth } from '../context/Auth';

type FieldErrors = Partial<{
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
  general: string;
}>;

export default function Register() {
  const nav = useNavigation<any>();
  const auth = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [email,     setEmail]     = useState('');
  const [phone,     setPhone]     = useState('');
  const [password,  setPassword]  = useState('');

  const [touched, setTouched] = useState({
    first: false, last: false, email: false, phone: false, pass: false,
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  const isEmail = (s:string)=>/^\S+@\S+\.\S+$/.test(s);

  // flags de visualización de errores (sin colisión con show/hide de password)
  const showFirst  = submitted || touched.first;
  const showLast   = submitted || touched.last;
  const showEmail  = submitted || touched.email;
  const showPhone  = submitted || touched.phone;
  const showPassVal= submitted || touched.pass;

  const errFirst = useMemo(() => {
    if (!showFirst) return undefined;
    if (!firstName.trim()) return 'First name required';
    return undefined;
  }, [showFirst, firstName]);

  const errLast = useMemo(() => {
    if (!showLast) return undefined;
    if (!lastName.trim()) return 'Last name required';
    return undefined;
  }, [showLast, lastName]);

  const errEmail = useMemo(() => {
    if (!showEmail) return undefined;
    if (!email.trim()) return 'Email required';
    if (!isEmail(email)) return 'Enter a valid email';
    return undefined;
  }, [showEmail, email]);

  const errPhone = useMemo(() => {
    if (!showPhone) return undefined;
    if (phone && phone.trim().length > 0 && phone.trim().length < 6) return 'Phone seems too short';
    return undefined;
  }, [showPhone, phone]);

  const errPass = useMemo(() => {
    if (!showPassVal) return undefined;
    if (!password) return 'Password required';
    if (password.length < 8) return 'At least 8 characters';
    return undefined;
  }, [showPassVal, password]);

  const mapBackendErrors = (data: any): FieldErrors => {
    const e: FieldErrors = {};
    if (data?.errors && typeof data.errors === 'object') {
      const eo = data.errors;
      if (eo.first_name) e.first_name = String(eo.first_name);
      if (eo.last_name)  e.last_name  = String(eo.last_name);
      if (eo.email)      e.email      = String(eo.email);
      if (eo.phone)      e.phone      = String(eo.phone);
      if (eo.password)   e.password   = String(eo.password);
    }
    const general = data?.message || data?.error || data?.detail;
    if (general) e.general = String(general);
    return e;
  };

  const onRegister = async () => {
    if (loading) return;

    const ok =
      firstName.trim() &&
      lastName.trim() &&
      isEmail(email) &&
      password.trim().length >= 8;

    setSubmitted(true);
    if (!ok) return;

    try {
      setLoading(true);
      await (auth as any).register?.({
        first_name: firstName.trim(),
        last_name:  lastName.trim(),
        email:      email.trim().toLowerCase(),
        phone:      phone.trim() || null,
        password,
      });
      nav.navigate('Login');
    } catch (err: any) {
      const data = err?.response?.data ?? err?.data ?? err;
      const be = mapBackendErrors(data);
      setAlertMsg(be.general || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.wrap}
        enableOnAndroid
        extraScrollHeight={24}
        extraHeight={24}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Create account</Text>

        <Input
          label="First Name"
          value={firstName}
          onChangeText={setFirstName}
          placeholder="John"
          onBlur={() => setTouched(v => ({ ...v, first: true }))}
          error={errFirst}
          errorMode="bubble"
        />

        <Input
          label="Last Name"
          value={lastName}
          onChangeText={setLastName}
          placeholder="Doe"
          onBlur={() => setTouched(v => ({ ...v, last: true }))}
          error={errLast}
          errorMode="bubble"
        />

        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          onBlur={() => setTouched(v => ({ ...v, email: true }))}
          error={errEmail}
          errorMode="bubble"
        />

        <Input
          label="Phone"
          value={phone}
          onChangeText={setPhone}
          placeholder="+23"
          onBlur={() => setTouched(v => ({ ...v, phone: true }))}
          error={errPhone}
          errorMode="bubble"
        />

        {/* Password: sin ícono; el propio <Input> muestra “Show/Hide” como en Login */}
        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="At least 8 characters"
          secureTextEntry
          onBlur={() => setTouched(v => ({ ...v, pass: true }))}
          error={errPass}
          errorMode="bubble"
        />

        {loading ? (
          <ActivityIndicator />
        ) : (
          <Boton label="Create account" onPress={onRegister} />
        )}
      </KeyboardAwareScrollView>

      <AppAlert
        message={alertMsg || ''}
        onClose={() => setAlertMsg(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  wrap:  { flexGrow: 1, padding: 16, justifyContent: 'flex-start', backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '600', marginTop: Platform.OS === 'ios' ? 10 : 6, marginBottom: 10, textAlign: 'center' },
});