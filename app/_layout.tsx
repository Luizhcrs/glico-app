// app/_layout.tsx
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { openDb } from '@/db/client';
import { theme } from '@/ui/theme';

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  useEffect(() => { openDb().then(() => setReady(true)); }, []);
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
