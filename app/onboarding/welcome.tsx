// app/onboarding/welcome.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { ActionButton } from '@/ui/components/ActionButton';
import { theme } from '@/ui/theme';

export default function Welcome() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bem-vinda ao Glico</Text>
      <Text style={styles.body}>Registro rápido de glicemia com lembretes que respeitam seu ritmo. Tudo fica no seu celular.</Text>
      <ActionButton label="Começar" onPress={() => router.push('/onboarding/name')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: theme.spacing.xl, gap: theme.spacing.lg },
  title: { fontSize: theme.fontSizes.xl, fontWeight: '700', color: theme.colors.text, textAlign: 'center' },
  body: { fontSize: theme.fontSizes.md, color: theme.colors.text, textAlign: 'center', lineHeight: 22 },
});
