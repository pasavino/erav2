import React, { useRef, useState } from 'react';
import { Alert, View, StyleSheet } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Input from '../components/input';
import Boton from '../components/boton';
import { requestForm } from '../services/http';

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [touched, setTouched] = useState({ current: false, new: false, confirm: false });
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  const currentPasswordError = !currentPassword.trim() ? 'Current password required' : undefined;
  // Misma regla que onRegister: password.trim().length >= 8.
  const newPasswordError = !newPassword.trim()
    ? 'New password required'
    : newPassword.trim().length < 8
      ? 'At least 8 characters'
      : undefined;
  const confirmNewPasswordError = !confirmNewPassword.trim()
    ? 'Confirm new password required'
    : confirmNewPassword !== newPassword
      ? 'Passwords do not match'
      : undefined;
  const isValid = !currentPasswordError && !newPasswordError && !confirmNewPasswordError;

  const onChangePassword = async () => {
    if (savingRef.current || !isValid) return;
    savingRef.current = true;
    setSaving(true);

    try {
      const out = await requestForm<{ message?: string }>(
        '/ax_change_password.php',
        { currentPassword, newPassword },
        { includeTokenInBody: false }
      );
      if (out.error === 0) {
        Alert.alert('Success', out.msg || out.message || 'Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setTouched({ current: false, new: false, confirm: false });
      } else {
        Alert.alert('Error', out.msg || out.message || 'Could not change password');
      }
    } catch (error: unknown) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Network error');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      enableOnAndroid
      enableAutomaticScroll
      extraScrollHeight={140}
      extraHeight={140}
    >
      <Input
        label="Current password"
        value={currentPassword}
        editable={!saving}
        onChangeText={setCurrentPassword}
        onBlur={() => setTouched(v => ({ ...v, current: true }))}
        error={touched.current ? currentPasswordError : undefined}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Input
        label="New password"
        value={newPassword}
        editable={!saving}
        onChangeText={setNewPassword}
        onBlur={() => setTouched(v => ({ ...v, new: true }))}
        error={touched.new ? newPasswordError : undefined}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Input
        label="Confirm new password"
        value={confirmNewPassword}
        editable={!saving}
        onChangeText={setConfirmNewPassword}
        onBlur={() => setTouched(v => ({ ...v, confirm: true }))}
        error={touched.confirm ? confirmNewPasswordError : undefined}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
      />

      <View style={styles.buttonWrap}>
        {/* Pendiente de conectar con el backend del equipo. */}
        {/* Conexión implementada mediante onChangePassword. */}
        <Boton label={saving ? 'Saving…' : 'Change password'} onPress={onChangePassword} disabled={!isValid || saving} />
      </View>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 140, gap: 12 },
  buttonWrap: { marginTop: 12, marginBottom: 4 },
});
