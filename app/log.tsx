// app/log.tsx
import React, { useState } from 'react';
import { View, Text, Alert, StyleSheet, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { measurementRepo } from '@/domain/measurement';
import { getDbSync } from '@/db/client';
import { validateMeasurement, needsConfirmation } from '@/domain/validators';
import { useSettings } from '@/ui/hooks/useSettings';
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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Nova medição</Text>
      <BigNumber value={numeric || '–'} />
      {numeric > 0 && (
        <StatusPill status={statusFor(numeric, settings.targetLow, settings.targetHigh)} />
      )}
      <View style={{ height: theme.spacing.md }} />
      <ContextChips value={context} onChange={setContext} />
      <View style={{ height: theme.spacing.md }} />
      <Keypad value={value} onChange={setValue} onConfirm={submit} />
      <View style={{ height: theme.spacing.md }} />
      <ActionButton label="Salvar" onPress={submit} disabled={!value} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: theme.spacing.lg, gap: theme.spacing.sm },
  title: { fontSize: theme.fontSizes.lg, fontWeight: '700', color: theme.colors.text, textAlign: 'center' },
});
