// app/_layout.tsx
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, TextInput, Alert } from 'react-native';
import { Stack, useRouter, usePathname } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import {
  useFonts,
  PlusJakartaSans_200ExtraLight,
  PlusJakartaSans_300Light,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { openDb, getDbSync } from '@/db/client';
import { settingsRepo } from '@/domain/settings';
import { hasAppPin, verifyAppPin } from '@/crypto/keychain';
import { installSmartReminderHandler } from '@/notifications/smart';
import { ActionButton } from '@/ui/components/ActionButton';
import { ToastProvider } from '@/ui/components/Toast';
import { theme } from '@/ui/theme';

installSmartReminderHandler();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_200ExtraLight,
    PlusJakartaSans_300Light,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });
  const [ready, setReady] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [needLock, setNeedLock] = useState(false);
  const [pinTry, setPinTry] = useState('');
  const router = useRouter();
  const pathname = usePathname();
  // Init once on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await openDb();
      const s = settingsRepo(getDbSync()).get();
      if (cancelled) return;
      if (s.appLockEnabled && (await hasAppPin())) {
        setNeedLock(true);
      } else {
        setUnlocked(true);
      }
      setReady(true);
    })();
    return () => { cancelled = true; };
  }, []);

  // Onboarding guard reacts to path changes without re-running init
  useEffect(() => {
    if (!ready) return;
    const s = settingsRepo(getDbSync()).get();
    if (!s.displayName && !pathname?.startsWith('/onboarding')) {
      router.replace('/onboarding/welcome');
    }
  }, [ready, pathname, router]);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((resp) => {
      const link = resp.notification.request.content.data?.deepLink as string | undefined;
      if (link && link.startsWith('glico://')) {
        const path = link.replace('glico://', '/');
        router.push(path as never);
      }
    });
    return () => sub.remove();
  }, [router]);
  if (!ready || !fontsLoaded) {
    return <View style={{ flex:1, alignItems:'center', justifyContent:'center', backgroundColor: theme.colors.bg }}>
      <ActivityIndicator color={theme.colors.accent} />
    </View>;
  }
  if (needLock && !unlocked) {
    return (
      <View style={{ flex:1, justifyContent:'center', padding: theme.spacing.xl, backgroundColor: theme.colors.bg }}>
        <Text style={{ color: theme.colors.text, fontSize: theme.fontSizes.lg, marginBottom: theme.spacing.md }}>Digite seu PIN</Text>
        <TextInput value={pinTry} onChangeText={setPinTry} secureTextEntry keyboardType="number-pad" maxLength={8}
          style={{ backgroundColor: theme.colors.surface, padding: theme.spacing.md, borderRadius: theme.radii.md, borderWidth: 1, borderColor: theme.colors.border, color: theme.colors.text }} />
        <View style={{ height: theme.spacing.md }} />
        <ActionButton label="Desbloquear" onPress={async () => {
          if (await verifyAppPin(pinTry)) setUnlocked(true);
          else { Alert.alert('PIN incorreto'); setPinTry(''); }
        }} />
      </View>
    );
  }
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ToastProvider>
          <Stack screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.colors.bg },
            animation: 'slide_from_right',
            gestureEnabled: true,
            fullScreenGestureEnabled: true,
          }} />
        </ToastProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
