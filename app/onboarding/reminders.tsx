// app/onboarding/reminders.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { ActionButton } from '@/ui/components/ActionButton';
import { theme } from '@/ui/theme';
import { ensurePermissions, syncReminders } from '@/notifications/scheduler';
import { reminderRepo } from '@/domain/reminder';
import { getDbSync } from '@/db/client';

export default function RemindersOnboarding() {
  const finish = async () => {
    await ensurePermissions();
    await syncReminders(reminderRepo(getDbSync()).listEnabled());
    router.replace('/');
  };
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lembretes</Text>
      <Text style={styles.body}>
        Criamos 6 lembretes default ao longo do dia. Eles silenciam automaticamente se você já mediu
        na janela próxima. Você pode editar tudo em Perfil &gt; Lembretes.
      </Text>
      <ActionButton label="Permitir lembretes e começar" onPress={finish} />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: theme.spacing.xl, gap: theme.spacing.md },
  title: { fontSize: theme.fontSizes.lg, color: theme.colors.text, fontWeight: '700' },
  body: { fontSize: theme.fontSizes.md, color: theme.colors.text, lineHeight: 22 },
});
