// app/onboarding/targets.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/ui/components/Screen';
import { ActionButton } from '@/ui/components/ActionButton';
import { theme } from '@/ui/theme';

export default function TargetsOnboarding() {
  return (
    <Screen showBack scroll={false}>
      <View style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.step}>Passo 2 de 3</Text>
          <Text style={styles.title}>Seus alvos</Text>
          <Text style={styles.body}>
            Adotamos a faixa padrão: <Text style={styles.bold}>70 a 180 mg/dL</Text> no alvo, hipoglicemia abaixo de 70.
            Você ajusta no perfil quando quiser.
          </Text>
          <View style={styles.card}>
            <Stat label="Alvo" value="70–180" unit="mg/dL" />
            <View style={styles.divider} />
            <Stat label="Hipo" value="< 70" unit="mg/dL" color={theme.colors.danger} />
            <View style={styles.divider} />
            <Stat label="Hiper" value="> 250" unit="mg/dL" color={theme.colors.warn} />
          </View>
        </View>
        <ActionButton label="Continuar" onPress={() => router.push('/onboarding/reminders')} />
      </View>
    </Screen>
  );
}

function Stat({ label, value, unit, color }: { label: string; value: string; unit: string; color?: string }) {
  return (
    <View style={statStyles.row}>
      <Text style={statStyles.label}>{label}</Text>
      <Text style={[statStyles.value, color ? { color } : null]}>{value} <Text style={statStyles.unit}>{unit}</Text></Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: theme.spacing.md },
  label: { fontSize: theme.fontSizes.sm, color: theme.colors.textMuted, fontWeight: '500' },
  value: { fontSize: theme.fontSizes.lg, color: theme.colors.text, fontWeight: '700' },
  unit: { fontSize: theme.fontSizes.xs, color: theme.colors.textMuted, fontWeight: '500' },
});

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'space-between', paddingVertical: theme.spacing.lg },
  center: { gap: theme.spacing.sm, marginTop: theme.spacing.xl },
  step: {
    fontSize: theme.fontSizes.xs, color: theme.colors.accent,
    textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: '700',
  },
  title: { fontSize: 28, fontWeight: '700', color: theme.colors.text, lineHeight: 34 },
  body: { fontSize: theme.fontSizes.md, color: theme.colors.textMuted, lineHeight: 22 },
  bold: { fontWeight: '700', color: theme.colors.text },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    paddingHorizontal: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.border },
});
