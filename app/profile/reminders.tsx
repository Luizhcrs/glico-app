// app/profile/reminders.tsx
import React from 'react';
import { View, Text, ScrollView, Switch, StyleSheet } from 'react-native';
import { reminderRepo } from '@/domain/reminder';
import { getDbSync } from '@/db/client';
import { useEffect, useState, useCallback } from 'react';
import type { Reminder } from '@/domain/types';
import { syncReminders } from '@/notifications/scheduler';
import { theme } from '@/ui/theme';

export default function RemindersScreen() {
  const [items, setItems] = useState<Reminder[]>([]);
  const reload = useCallback(() => {
    setItems(reminderRepo(getDbSync()).listAll());
  }, []);
  useEffect(() => { reload(); }, [reload]);

  const toggle = async (r: Reminder, enabled: boolean) => {
    reminderRepo(getDbSync()).setEnabled(r.id, enabled);
    reload();
    const updated = reminderRepo(getDbSync()).listEnabled();
    await syncReminders(updated);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.help}>Toque para alternar. Lembrete silencia automaticamente se você já mediu na janela ±tolerância.</Text>
      {items.map((r) => (
        <View key={r.id} style={styles.row}>
          <View>
            <Text style={styles.label}>{r.label}</Text>
            <Text style={styles.subtle}>{r.timeOfDay} · ±{r.toleranceMinutes}min</Text>
          </View>
          <Switch value={r.enabled} onValueChange={(v) => toggle(r, v)}
            thumbColor={r.enabled ? theme.colors.accent : '#ccc'} />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: theme.spacing.lg, gap: theme.spacing.sm },
  help: { color: theme.colors.textMuted, fontSize: theme.fontSizes.xs, marginBottom: theme.spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: theme.spacing.md, borderBottomWidth: 1, borderColor: theme.colors.border },
  label: { color: theme.colors.text, fontSize: theme.fontSizes.md, fontWeight: '600' },
  subtle: { color: theme.colors.textMuted, fontSize: theme.fontSizes.xs },
});
