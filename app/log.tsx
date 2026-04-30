// app/log.tsx
import React, { useState } from 'react';
import { View, Text, Alert, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { router, useLocalSearchParams } from 'expo-router';
import { measurementRepo } from '@/domain/measurement';
import { getDbSync } from '@/db/client';
import { validateMeasurement, needsConfirmation } from '@/domain/validators';
import { useSettings } from '@/ui/hooks/useSettings';
import { Screen } from '@/ui/components/Screen';
import { BigNumber } from '@/ui/components/BigNumber';
import { StatusPill, type Status } from '@/ui/components/StatusPill';
import { ContextChips } from '@/ui/components/ContextChips';
import { Keypad } from '@/ui/components/Keypad';
import { ActionButton } from '@/ui/components/ActionButton';
import { theme } from '@/ui/theme';
import type { GlucoseContext, MealLabel } from '@/domain/types';

function statusFor(v: number, low: number, high: number): Status {
  if (v < low) return 'low'; if (v > high) return 'high'; return 'ok';
}

export default function LogScreen() {
  const params = useLocalSearchParams<{ context?: string; meal?: string }>();
  const initialContext = (params.context as GlucoseContext) ?? 'random';
  const { data: settings } = useSettings();
  const [value, setValue] = useState('');
  const [context, setContext] = useState<GlucoseContext>(initialContext);

  if (!settings) return null;
  const numeric = value === '' ? 0 : parseInt(value, 10);

  const submit = () => {
    const v = parseInt(value, 10);
    const valid = validateMeasurement(v);
    if (!valid.ok) { Alert.alert('Valor inválido', valid.reason); return; }
    const persist = () => {
      measurementRepo(getDbSync()).insert({
        valueMgdl: v,
        measuredAt: Date.now(),
        context,
        mealLabel: (params.meal as MealLabel) ?? null,
      });
      router.replace('/');
    };
    if (needsConfirmation(v)) {
      Alert.alert('Tem certeza desse valor?', `${v} mg/dL é incomum. Confirma?`, [
        { text: 'Cancelar' },
        { text: 'Confirmar', onPress: persist },
      ]);
    } else {
      persist();
    }
  };

  const status = numeric > 0 ? statusFor(numeric, settings.targetLow, settings.targetHigh) : null;
  const numColor = status === 'low' ? theme.colors.danger : status === 'high' ? theme.colors.warn : undefined;

  return (
    <Screen title="Nova medição" showBack scroll>
      <Animated.View entering={FadeInDown.duration(400).springify().damping(18)} style={styles.heroCard}>
        <BigNumber value={numeric || '—'} color={numColor} />
        {status && <StatusPill status={status} />}
      </Animated.View>

      <Animated.View entering={FadeIn.duration(350).delay(100)}>
        <Text style={styles.label}>Contexto</Text>
        <ContextChips value={context} onChange={setContext} />
      </Animated.View>

      <View style={{ height: theme.spacing.lg }} />

      <Animated.View entering={FadeInUp.duration(400).delay(160)}>
        <Keypad value={value} onChange={setValue} onConfirm={submit} />
      </Animated.View>

      <View style={{ height: theme.spacing.md }} />
      <ActionButton label="Salvar medição" onPress={submit} disabled={!value} />
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
    fontSize: theme.fontSizes.xs, fontWeight: '700',
    color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8,
    marginBottom: theme.spacing.sm,
  },
});
