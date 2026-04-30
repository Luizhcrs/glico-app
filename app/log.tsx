// app/log.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { measurementRepo } from '@/domain/measurement';
import { getDbSync } from '@/db/client';
import { silenceCoveredReminders } from '@/notifications/smart';
import { validateMeasurement, needsConfirmation } from '@/domain/validators';
import { useSettings } from '@/ui/hooks/useSettings';
import { Screen } from '@/ui/components/Screen';
import { BigNumber } from '@/ui/components/BigNumber';
import { StatusPill, type Status } from '@/ui/components/StatusPill';
import { ContextChips } from '@/ui/components/ContextChips';
import { Keypad } from '@/ui/components/Keypad';
import { ActionButton } from '@/ui/components/ActionButton';
import { ConfirmDialog } from '@/ui/components/ConfirmDialog';
import { useToast } from '@/ui/components/Toast';
import { theme } from '@/ui/theme';
import type { GlucoseContext, MealLabel } from '@/domain/types';

function statusFor(v: number, low: number, high: number): Status {
  if (v < low) return 'low'; if (v > high) return 'high'; return 'ok';
}

export default function LogScreen() {
  const params = useLocalSearchParams<{ context?: string; meal?: string }>();
  const initialContext = (params.context as GlucoseContext) ?? 'random';
  const { data: settings } = useSettings();
  const toast = useToast();
  const [value, setValue] = useState('');
  const [context, setContext] = useState<GlucoseContext>(initialContext);
  const [note, setNote] = useState('');
  const [confirmOutlier, setConfirmOutlier] = useState(false);

  if (!settings) return null;
  const numeric = value === '' ? 0 : parseInt(value, 10);

  const persist = async () => {
    const v = parseInt(value, 10);
    const measuredAt = Date.now();
    measurementRepo(getDbSync()).insert({
      valueMgdl: v,
      measuredAt,
      context,
      mealLabel: (params.meal as MealLabel) ?? null,
      note: note.trim() ? note.trim() : null,
    });
    await silenceCoveredReminders(measuredAt);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    toast.success(`Medição salva: ${v} mg/dL`);
    router.replace('/');
  };

  const submit = () => {
    const v = parseInt(value, 10);
    const valid = validateMeasurement(v);
    if (!valid.ok) { toast.error(`Valor inválido: ${valid.reason}`); return; }
    if (needsConfirmation(v)) {
      setConfirmOutlier(true);
    } else {
      persist();
    }
  };

  const status = numeric > 0 ? statusFor(numeric, settings.targetLow, settings.targetHigh) : null;
  const numColor =
    status === 'low' ? theme.colors.danger :
    status === 'high' ? theme.colors.warn :
    status === 'ok' ? theme.colors.accent :
    undefined;

  return (
    <Screen title="Nova medição" showBack scroll>
      <View style={styles.heroCard}>
        <BigNumber value={numeric || '—'} color={numColor} />
        {status && <StatusPill status={status} />}
      </View>

      <Text style={styles.label}>Contexto</Text>
      <ContextChips value={context} onChange={setContext} />

      <View style={{ height: theme.spacing.lg }} />

      <Keypad value={value} onChange={setValue} onConfirm={submit} />

      <Text style={styles.label}>Nota (opcional)</Text>
      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder="Ex.: pós exercício, jantei tarde…"
        placeholderTextColor={theme.colors.textMuted}
        style={styles.noteInput}
        maxLength={200}
        multiline
      />

      <View style={{ height: theme.spacing.md }} />
      <ActionButton label="Salvar medição" onPress={submit} disabled={!value} />

      <ConfirmDialog
        visible={confirmOutlier}
        title="Tem certeza desse valor?"
        message={`${numeric} mg/dL é incomum. Confirma o registro?`}
        confirmLabel="Confirmar"
        cancelLabel="Cancelar"
        onConfirm={() => { setConfirmOutlier(false); persist(); }}
        onCancel={() => setConfirmOutlier(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  label: {
    fontSize: theme.fontSizes.xs, fontFamily: theme.fonts.bold,
    color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8,
    marginTop: theme.spacing.lg, marginBottom: theme.spacing.sm,
  },
  noteInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    padding: 12,
    color: theme.colors.text,
    fontSize: theme.fontSizes.sm,
    fontFamily: theme.fonts.regular,
    borderWidth: 1, borderColor: theme.colors.border,
    minHeight: 56, textAlignVertical: 'top',
  },
});
