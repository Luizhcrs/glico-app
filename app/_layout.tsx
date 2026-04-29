// app/_layout.tsx
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, useRouter, usePathname } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { openDb, getDbSync } from '@/db/client';
import { settingsRepo } from '@/domain/settings';
import { theme } from '@/ui/theme';

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    (async () => {
      await openDb();
      const s = settingsRepo(getDbSync()).get();
      setReady(true);
      if (!s.displayName && !pathname?.startsWith('/onboarding')) {
        router.replace('/onboarding/welcome');
      }
    })();
  }, [router, pathname]);

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
  if (!ready) {
    return <View style={{ flex:1, alignItems:'center', justifyContent:'center', backgroundColor: theme.colors.bg }}>
      <ActivityIndicator color={theme.colors.accent} />
    </View>;
  }
  return (
    <Stack screenOptions={{
      headerStyle: { backgroundColor: theme.colors.bg },
      headerTitleStyle: { color: theme.colors.text },
      contentStyle: { backgroundColor: theme.colors.bg },
    }} />
  );
}
