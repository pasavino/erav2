// lib/biometrics.ts
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'era.refresh_token';

export async function canUseBiometrics(): Promise<boolean> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && enrolled;
  } catch {
    return false;
  }
}

export async function enableBiometricToken(refreshToken: string) {
  // NO uses authenticationPrompt aquí (solo aplica en getItemAsync)
  await SecureStore.setItemAsync(TOKEN_KEY, refreshToken, {
    requireAuthentication: true, // ok
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY, // iOS
  });
}

export async function readBiometricToken(): Promise<string | null> {
  try {
    // Aquí sí: authenticationPrompt debe ser STRING
    const t = await SecureStore.getItemAsync(TOKEN_KEY, {
      requireAuthentication: true,
      authenticationPrompt: 'Biometric authentication', // iOS
    });
    return t ?? null;
  } catch {
    return null;
  }
}

export async function disableBiometricToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}