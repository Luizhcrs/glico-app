// app/hypo.tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { hypoRepo } from '@/domain/hypo';
import { getDbSync } from '@/db/client';
import { scheduleHypoFollowUp } from '@/notifications/scheduler';
import { Keypad } from '@/ui/components/Keypad';
import { BigNumber } from '@/ui/components/BigNumber';
import { ActionButton } from '@/ui/components/ActionButton';
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

export default function HypoScreen() {
  const [value, setValue] = useState('');
  const [symptoms, setSymptoms] = useState<HypoSymptom[]>([]);
  const [treatment, setTreatment] = useState<HypoTreatment | null>(null);

  const toggle = (s: HypoSymptom) => {
    setSymptoms((cur) => cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]);
  };

  const submit = async () => {
    const v = parseInt(value, 10);
    if (!validateMeasurement(v).ok) { Alert.alert('Valor inválido'); return; }
    hypoRepo(getDbSync()).logHypo({
      valueMgdl: v,
      measuredAt: Date.now(),
      symptoms,
      treatment: treatment ?? undefined,
      treatmentGrams: treatment === 'sugar' ? 15 : undefined,
    });
    await scheduleHypoFollowUp(Date.now());
    Alert.alert('Salvo', 'Lembrete em 15 minutos pra remedir (regra dos 15).');
    router.replace('/');
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: '#fff5f5' }]}>
      <Text style={styles.title}>Episódio de hipo</Text>
      <BigNumber value={parseInt(value, 10) || '–'} color={theme.colors.danger} />
      <View style={{ height: theme.spacing.md }} />
      <Keypad value={value} onChange={setValue} onConfirm={() => {}} />

      <Text style={styles.section}>Sintomas</Text>
      <View style={styles.grid}>
        {SYMPTOMS.map((s) => (
          <Pressable key={s.key} onPress={() => toggle(s.key)}
            style={[styles.chip, symptoms.includes(s.key) && styles.chipSel]}>
            <Text style={[styles.chipTxt, symptoms.includes(s.key) && styles.chipTxtSel]}>{s.label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.section}>Tratamento</Text>
      <View style={styles.grid}>
        {TREATMENTS.map((t) => (
          <Pressable key={t.key} onPress={() => setTreatment(t.key)}
            style={[styles.chip, treatment === t.key && styles.chipSel]}>
            <Text style={[styles.chipTxt, treatment === t.key && styles.chipTxtSel]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={{ height: theme.spacing.lg }} />
      <ActionButton label="Salvar e definir lembrete 15min" variant="danger" onPress={submit} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: theme.spacing.lg, gap: theme.spacing.sm },
  title: { fontSize: theme.fontSizes.lg, fontWeight: '700', color: theme.colors.danger, textAlign: 'center' },
  section: { marginTop: theme.spacing.lg, fontSize: theme.fontSizes.sm, fontWeight: '600', color: theme.colors.textMuted },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  chip: {
    paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.md, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: '#fff',
  },
  chipSel: { backgroundColor: theme.colors.danger, borderColor: theme.colors.danger },
  chipTxt: { color: theme.colors.text, fontSize: theme.fontSizes.sm },
  chipTxtSel: { color: '#fff', fontWeight: '600' },
});
