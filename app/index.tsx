// app/index.tsx
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useLatestMeasurement, useMeasurementsInRange } from '@/ui/hooks/useMeasurements';
import { useSettings } from '@/ui/hooks/useSettings';
import { BigNumber } from '@/ui/components/BigNumber';
import { StatusPill, type Status } from '@/ui/components/StatusPill';
import { ActionButton } from '@/ui/components/ActionButton';
import { theme } from '@/ui/theme';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function statusFor(value: number, low: number, high: number): Status {
  if (value < low) return 'low';
  if (value > high) return 'high';
  return 'ok';
}

export default function HomeScreen() {
  const { data: settings } = useSettings();
  const { data: latest } = useLatestMeasurement();
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
  const { data: today } = useMeasurementsInRange(todayStart.getTime(), todayEnd.getTime());

  if (!settings) return null;
  const name = settings.displayName ?? 'Olá';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.greeting}>Olá, {name}</Text>
      {latest ? (
        <>
          <Text style={styles.subtle}>
            Última medição há {format(new Date(latest.measuredAt), "HH:mm 'de' dd/MM", { locale: ptBR })}
          </Text>
          <BigNumber value={latest.valueMgdl} />
          <StatusPill status={statusFor(latest.valueMgdl, settings.targetLow, settings.targetHigh)} />
        </>
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyTxt}>Nenhuma medição registrada ainda</Text>
        </View>
      )}

      <View style={styles.actions}>
        <View style={{ flex: 1 }}><ActionButton label="+ Medir" onPress={() => router.push('/log')} /></View>
        <View style={{ width: 12 }} />
        <View style={{ flex: 1 }}><ActionButton label="Hipo" variant="danger" onPress={() => router.push('/hypo')} /></View>
      </View>
      <View style={{ height: 8 }} />
      <ActionButton label="+ Insulina" variant="ghost" onPress={() => router.push('/insulin')} />

      <Text style={styles.section}>Hoje</Text>
      {today.length === 0 ? <Text style={styles.subtle}>Sem medições hoje</Text> :
        today.map((m) => (
          <View key={m.id} style={styles.row}>
            <Text style={styles.rowLabel}>{format(new Date(m.measuredAt), 'HH:mm')} · {m.context}</Text>
            <Text style={styles.rowValue}>{m.valueMgdl}</Text>
          </View>
        ))
      }
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: theme.spacing.lg, gap: theme.spacing.sm },
  greeting: { fontSize: theme.fontSizes.lg, fontWeight: '700', color: theme.colors.text },
  subtle: { color: theme.colors.textMuted, fontSize: theme.fontSizes.sm, textAlign: 'center' },
  actions: { flexDirection: 'row', marginTop: theme.spacing.lg },
  section: { marginTop: theme.spacing.lg, fontSize: theme.fontSizes.sm, fontWeight: '600', color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: theme.spacing.sm, borderBottomWidth: 1, borderColor: theme.colors.border },
  rowLabel: { color: theme.colors.text, fontSize: theme.fontSizes.sm },
  rowValue: { color: theme.colors.accent, fontSize: theme.fontSizes.md, fontWeight: '700' },
  empty: { alignItems: 'center', padding: theme.spacing.xl },
  emptyTxt: { color: theme.colors.textMuted },
});
