// services/biometric.ts
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

export const BIOMETRIC_KEY = 'BIOMETRIC_ENABLED';
export const CREDS_KEY = 'BIOMETRIC_CREDS';

type Creds = { email: string; password: string };

export async function isBiometricAvailable(): Promise<boolean> {
  const has = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return has && enrolled;
}

export async function biometricAuthenticate(prompt?: string): Promise<boolean> {
  const res = await LocalAuthentication.authenticateAsync({
    promptMessage: prompt ?? 'Usa tu huella para continuar',
    cancelLabel: 'Cancelar',
    disableDeviceFallback: true,
  });
  return !!res.success;
}

export async function getBiometricOptIn(): Promise<boolean> {
  return (await SecureStore.getItemAsync(BIOMETRIC_KEY)) === '1';
}
export async function setBiometricOptIn(on: boolean) {
  await SecureStore.setItemAsync(BIOMETRIC_KEY, on ? '1' : '0');
  if (!on) await SecureStore.deleteItemAsync(CREDS_KEY);
}

export async function saveCreds(email: string, password: string) {
  await SecureStore.setItemAsync(CREDS_KEY, JSON.stringify({ email, password }));
}
export async function getCreds(): Promise<Creds | null> {
  const s = await SecureStore.getItemAsync(CREDS_KEY);
  return s ? JSON.parse(s) as Creds : null;
}