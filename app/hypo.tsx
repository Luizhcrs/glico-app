// app/hypo.tsx
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { hypoRepo } from '@/domain/hypo';
import { getDbSync } from '@/db/client';
import { scheduleHypoFollowUp } from '@/notifications/scheduler';
import { silenceCoveredReminders } from '@/notifications/smart';
import { Screen } from '@/ui/components/Screen';
import { Keypad } from '@/ui/components/Keypad';
import { BigNumber } from '@/ui/components/BigNumber';
import { ActionButton } from '@/ui/components/ActionButton';
import { useToast } from '@/ui/components/Toast';
import { theme } from '@/ui/theme';
import { validateMeasurement } from '@/domain/validators';
import type { HypoSymptom, HypoTreatment } from '@/domain/types';

const SYMPTOMS: { key: HypoSymptom; label: string }[] = [
  { key: 'tremor', label: 'Tremor' }, { key: 'sweat', label: 'Suor' },
  { key: 'dizziness', label: 'Tontura' }, { key: 'hunger', label: 'Fome' },
  { key: 'confusion', label: 'Confusão' }, { key: 'irritability', label: 'Irritabilidade' },
];
const TREATMENTS: { key: HypoTreatment; label: string }[] = [
  { key: 'sugar', label: 'Açúcar 15g' }, { key: 'juice', label: 'Suco' },
  { key: 'food', label: 'Comida' }, { key: 'glucagon', label: 'Glucagon' }, { key: 'other', label: 'Outro' },
];

const HYPO_BG = '#fff5f5';

export default function HypoScreen() {
  const toast = useToast();
  const [value, setValue] = useState('');
  const [symptoms, setSymptoms] = useState<HypoSymptom[]>([]);
  const [treatment, setTreatment] = useState<HypoTreatment | null>(null);
  const numeric = parseInt(value, 10);

  const toggle = (s: HypoSymptom) => {
    setSymptoms((cur) => cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]);
  };

  const submit = async () => {
    const v = parseInt(value, 10);
    if (!validateMeasurement(v).ok) { toast.error('Valor inválido'); return; }
    const measuredAt = Date.now();
    hypoRepo(getDbSync()).logHypo({
      valueMgdl: v,
      measuredAt,
      symptoms,
      treatment: treatment ?? undefined,
      treatmentGrams: treatment === 'sugar' ? 15 : undefined,
    });
    await silenceCoveredReminders(measuredAt);
    await scheduleHypoFollowUp(measuredAt);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    toast.success('Hipo salva. Lembrete em 15 min pra remedir.');
    router.replace('/');
  };

  return (
    <Screen title="Episódio de hipo" showBack bg={HYPO_BG}>
      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>Glicemia atual</Text>
        <BigNumber value={numeric || '—'} color={theme.colors.danger} />
        <Text style={styles.heroHint}>Após salvar, lembrete em 15 minutos</Text>
      </View>

      <Keypad value={value} onChange={setValue} onConfirm={() => {}} />

      <Text style={styles.section}>Sintomas</Text>
      <View style={styles.grid}>
        {SYMPTOMS.map((s) => {
          const sel = symptoms.includes(s.key);
          return (
            <Pressable key={s.key}
              onPress={() => { toggle(s.key); Haptics.selectionAsync().catch(() => {}); }}
              style={[styles.chip, sel && styles.chipSel]}>
              <Text style={[styles.chipTxt, sel && styles.chipTxtSel]}>{s.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.section}>Tratamento</Text>
      <View style={styles.grid}>
        {TREATMENTS.map((t) => {
          const sel = treatment === t.key;
          return (
            <Pressable key={t.key}
              onPress={() => { setTreatment(t.key); Haptics.selectionAsync().catch(() => {}); }}
              style={[styles.chip, sel && styles.chipSel]}>
              <Text style={[styles.chipTxt, sel && styles.chipTxtSel]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ height: theme.spacing.lg }} />
      <ActionButton label="Salvar e definir lembrete 15min" variant="danger" onPress={submit} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    backgroundColor: '#fff',
    borderRadius: theme.radii.lg,
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.xs,
    shadowColor: theme.colors.danger,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  heroLabel: {
    fontSize: theme.fontSizes.xs, fontWeight: '700',
    color: theme.colors.danger, textTransform: 'uppercase', letterSpacing: 0.8,
  },
  heroHint: { fontSize: theme.fontSizes.xs, color: theme.colors.textMuted, marginTop: theme.spacing.xs },
  section: {
    marginTop: theme.spacing.lg, marginBottom: theme.spacing.sm,
    fontSize: theme.fontSizes.xs, fontWeight: '700',
    color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  chip: {
    paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.pill, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: '#fff',
  },
  chipSel: { backgroundColor: theme.colors.danger, borderColor: theme.colors.danger },
  chipTxt: { color: theme.colors.text, fontSize: theme.fontSizes.sm },
  chipTxtSel: { color: '#fff', fontWeight: '600' },
});
