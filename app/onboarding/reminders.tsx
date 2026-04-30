// app/onboarding/reminders.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/ui/components/Screen';
import { ActionButton } from '@/ui/components/ActionButton';
import { theme } from '@/ui/theme';
import { ensurePermissions, syncReminders } from '@/notifications/scheduler';
import { reminderRepo } from '@/domain/reminder';
import { getDbSync } from '@/db/client';

const DEFAULTS = [
  { time: '07:00', label: 'Jejum' },
  { time: '12:00', label: 'Pré-almoço' },
  { time: '14:00', label: 'Pós-almoço' },
  { time: '19:00', label: 'Pré-jantar' },
  { time: '21:00', label: 'Pós-jantar' },
  { time: '23:00', label: 'Antes de dormir' },
];

export default function RemindersOnboarding() {
  const finish = async () => {
    await ensurePermissions();
    await syncReminders(reminderRepo(getDbSync()).listEnabled());
    router.replace('/');
  };
  return (
    <Screen showBack scroll>
      <View style={styles.container}>
        <View>
          <Text style={styles.step}>Passo 3 de 3</Text>
          <Text style={styles.title}>Lembretes</Text>
          <Text style={styles.body}>
            Criamos 6 horários ao longo do dia. Eles silenciam automaticamente se você já mediu na janela próxima.
          </Text>
          <View style={styles.card}>
            {DEFAULTS.map((d, i) => (
              <View key={d.time} style={[styles.row, i < DEFAULTS.length - 1 && styles.rowBorder]}>
                <Text style={styles.time}>{d.time}</Text>
                <Text style={styles.label}>{d.label}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.hint}>Pode editar tudo no Perfil depois.</Text>
        </View>
        <View style={{ height: theme.spacing.lg }} />
        <ActionButton label="Permitir lembretes e começar" onPress={finish} />
      </View>
    </Screen>
  );
}
const styles = StyleSheet.create({
  container: { paddingVertical: theme.spacing.lg, gap: theme.spacing.md },
  step: {
    fontSize: theme.fontSizes.xs, color: theme.colors.accent,
    textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: '700', marginBottom: theme.spacing.xs,
  },
  title: { fontSize: 28, fontWeight: '700', color: theme.colors.text, lineHeight: 34, marginBottom: theme.spacing.sm },
  body: { fontSize: theme.fontSizes.md, color: theme.colors.textMuted, lineHeight: 22, marginBottom: theme.spacing.lg },
  card: {
    backgroundColor: theme.colors.surface, borderRadius: theme.radii.md,
    paddingHorizontal: theme.spacing.md,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border },
  time: {
    fontSize: theme.fontSizes.md, fontWeight: '700',
    color: theme.colors.accent, fontVariant: ['tabular-nums'], minWidth: 56,
  },
  label: { fontSize: theme.fontSizes.sm, color: theme.colors.text, fontWeight: '500' },
  hint: { fontSize: theme.fontSizes.xs, color: theme.colors.textMuted, marginTop: theme.spacing.sm, textAlign: 'center' },
});
