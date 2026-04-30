// app/hypo.tsx
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import Animated, { FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { hypoRepo } from '@/domain/hypo';
import { getDbSync } from '@/db/client';
import { scheduleHypoFollowUp } from '@/notifications/scheduler';
import { Screen } from '@/ui/components/Screen';
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

const HYPO_BG = '#fff5f5';

export default function HypoScreen() {
  const [value, setValue] = useState('');
  const [symptoms, setSymptoms] = useState<HypoSymptom[]>([]);
  const [treatment, setTreatment] = useState<HypoTreatment | null>(null);
  const numeric = parseInt(value, 10);

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
    <Screen title="Episódio de hipo" showBack bg={HYPO_BG}>
      <Animated.View entering={FadeInDown.duration(400).springify().damping(18)} style={styles.heroCard}>
        <Text style={styles.heroLabel}>Glicemia atual</Text>
        <BigNumber value={numeric || '—'} color={theme.colors.danger} />
        <Text style={styles.heroHint}>Após salvar, lembrete em 15 minutos</Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(400).delay(80)}>
        <Keypad value={value} onChange={setValue} onConfirm={() => {}} />
      </Animated.View>

      <Text style={styles.section}>Sintomas</Text>
      <View style={styles.grid}>
        {SYMPTOMS.map((s, i) => {
          const sel = symptoms.includes(s.key);
          return (
            <AnimatedChip key={s.key} entering={FadeInUp.duration(300).delay(140 + i * 30)}
              selected={sel} onPress={() => { toggle(s.key); Haptics.selectionAsync().catch(() => {}); }}
              label={s.label} />
          );
        })}
      </View>

      <Text style={styles.section}>Tratamento</Text>
      <View style={styles.grid}>
        {TREATMENTS.map((t, i) => {
          const sel = treatment === t.key;
          return (
            <AnimatedChip key={t.key} entering={FadeInUp.duration(300).delay(220 + i * 30)}
              selected={sel} onPress={() => { setTreatment(t.key); Haptics.selectionAsync().catch(() => {}); }}
              label={t.label} />
          );
        })}
      </View>

      <View style={{ height: theme.spacing.lg }} />
      <ActionButton label="Salvar e definir lembrete 15min" variant="danger" onPress={submit} />
    </Screen>
  );
}

function AnimatedChip({
  entering, selected, onPress, label,
}: { entering: any; selected: boolean; onPress: () => void; label: string }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View entering={entering} style={animStyle}>
      <Pressable
        onPressIn={() => { scale.value = withTiming(0.95, { duration: 80 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 10, stiffness: 200 }); }}
        onPress={onPress}
        style={[styles.chip, selected && styles.chipSel]}
      >
        <Text style={[styles.chipTxt, selected && styles.chipTxtSel]}>{label}</Text>
      </Pressable>
    </Animated.View>
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
