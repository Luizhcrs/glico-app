import * as SecureStore from 'expo-secure-store';
import { randomBytes } from 'react-native-quick-crypto';

const DB_KEY_NAME = 'glico.db.key';
const PIN_KEY_NAME = 'glico.app.pin';

export async function getOrCreateDbKey(): Promise<string> {
  const existing = await SecureStore.getItemAsync(DB_KEY_NAME);
  if (existing) return existing;
  const buf = randomBytes(32);
  const hex = Buffer.from(buf).toString('hex');
  await SecureStore.setItemAsync(DB_KEY_NAME, hex, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED,
  });
  return hex;
}

export async function setAppPin(pin: string): Promise<void> {
  await SecureStore.setItemAsync(PIN_KEY_NAME, pin, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function verifyAppPin(pin: string): Promise<boolean> {
  const stored = await SecureStore.getItemAsync(PIN_KEY_NAME);
  return stored === pin;
}

export async function hasAppPin(): Promise<boolean> {
  const stored = await SecureStore.getItemAsync(PIN_KEY_NAME);
  return stored !== null;
}

export async function clearAppPin(): Promise<void> {
  await SecureStore.deleteItemAsync(PIN_KEY_NAME);
}
