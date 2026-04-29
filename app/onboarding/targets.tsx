// app/onboarding/targets.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { ActionButton } from '@/ui/components/ActionButton';
import { theme } from '@/ui/theme';

export default function TargetsOnboarding() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Seus alvos</Text>
      <Text style={styles.body}>
        Adotamos a faixa padrão recomendada: 70 a 180 mg/dL no alvo, hipoglicemia abaixo de 70.
        Você pode ajustar tudo no perfil quando quiser.
      </Text>
      <ActionButton label="Próximo" onPress={() => router.push('/onboarding/reminders')} />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: theme.spacing.xl, gap: theme.spacing.md },
  title: { fontSize: theme.fontSizes.lg, color: theme.colors.text, fontWeight: '700' },
  body: { fontSize: theme.fontSizes.md, color: theme.colors.text, lineHeight: 22 },
});
