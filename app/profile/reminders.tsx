// app/profile/reminders.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { reminderRepo } from '@/domain/reminder';
import { getDbSync } from '@/db/client';
import type { Reminder } from '@/domain/types';
import { syncReminders } from '@/notifications/scheduler';
import { Screen } from '@/ui/components/Screen';
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
    <Screen title="Lembretes" showBack>
      <Text style={styles.help}>
        Lembretes silenciam automaticamente se você já mediu na janela próxima.
      </Text>
      <View style={styles.group}>
        {items.map((r, i) => (
          <View key={r.id} style={[styles.row, i < items.length - 1 && styles.rowBorder]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{r.label}</Text>
              <Text style={styles.subtle}>{r.timeOfDay} · janela ±{r.toleranceMinutes}min</Text>
            </View>
            <Switch
              value={r.enabled}
              onValueChange={(v) => toggle(r, v)}
              thumbColor={r.enabled ? theme.colors.accent : '#ccc'}
              trackColor={{ false: theme.colors.border, true: theme.colors.accentMuted }}
            />
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  help: {
    color: theme.colors.textMuted, fontSize: theme.fontSizes.sm,
    fontFamily: theme.fonts.regular, marginBottom: theme.spacing.lg, lineHeight: 20,
  },
  group: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: theme.spacing.md, paddingHorizontal: theme.spacing.md,
  },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border },
  label: { color: theme.colors.text, fontSize: theme.fontSizes.md, fontFamily: theme.fonts.semibold },
  subtle: { color: theme.colors.textMuted, fontSize: theme.fontSizes.xs, fontFamily: theme.fonts.regular, marginTop: 2 },
});
