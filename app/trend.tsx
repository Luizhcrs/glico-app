// app/trend.tsx
import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSettings } from '@/ui/hooks/useSettings';
import { useMeasurementsInRange } from '@/ui/hooks/useMeasurements';
import { useStats } from '@/ui/hooks/useStats';
import { bucketByTimeOfDay } from '@/domain/stats';
import { Screen } from '@/ui/components/Screen';
import { TrendChart } from '@/ui/components/TrendChart';
import { ActionButton } from '@/ui/components/ActionButton';
import { theme } from '@/ui/theme';
import { generateAndShareReport } from '@/pdf/report';

const RANGES = [
  { key: '7', label: '7 dias', days: 7 },
  { key: '30', label: '30 dias', days: 30 },
  { key: '90', label: '90 dias', days: 90 },
] as const;

export default function TrendScreen() {
  const { data: settings } = useSettings();
  const [rangeKey, setRangeKey] = useState<'7'|'30'|'90'>('30');
  const days = RANGES.find((r) => r.key === rangeKey)!.days;
  const { fromMs, toMs } = useMemo(() => {
    const to = Date.now();
    return { fromMs: to - days * 24 * 3600_000, toMs: to };
  }, [days]);
  const { data } = useMeasurementsInRange(fromMs, toMs);
  const stats = useStats(data, settings?.targetLow ?? 70, settings?.targetHigh ?? 180);
  const buckets = bucketByTimeOfDay(data);

  if (!settings) return null;

  return (
    <Screen title="Tendência" showBack>
      <View style={styles.tabs}>
        {RANGES.map((r) => (
          <Pressable key={r.key} onPress={() => setRangeKey(r.key)}
            style={[styles.tab, rangeKey === r.key && styles.tabSel]}>
            <Text style={[styles.tabTxt, rangeKey === r.key && styles.tabTxtSel]}>{r.label}</Text>
          </Pressable>
        ))}
      </View>

      <TrendChart data={data} targetLow={settings.targetLow} targetHigh={settings.targetHigh} />

      <View style={styles.statRow}>
        <Stat label="TIR" value={`${stats.tirPct}%`} />
        <Stat label="Média" value={String(stats.meanMgdl)} />
        <Stat label="Hipos" value={String(stats.hypoCount)} />
      </View>

      <Text style={styles.section}>Por janela do dia</Text>
      {[
        { label: 'Manhã (06–12)', mean: buckets.morning.mean, count: buckets.morning.count },
        { label: 'Tarde (12–18)', mean: buckets.afternoon.mean, count: buckets.afternoon.count },
        { label: 'Noite (18–24)', mean: buckets.evening.mean, count: buckets.evening.count },
        { label: 'Madrugada (00–06)', mean: buckets.night.mean, count: buckets.night.count },
      ].map((b) => (
        <Row key={b.label} label={b.label} value={b.mean} count={b.count} />
      ))}

      <View style={{ height: theme.spacing.lg }} />
      <ActionButton label="Exportar PDF" onPress={() => generateAndShareReport(data, settings, days)} />
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Row({ label, value, count }: { label: string; value: number; count: number }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{count === 0 ? '—' : `${value} mg/dL`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row', gap: theme.spacing.xs, marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.cardBg, borderRadius: theme.radii.pill, padding: 4,
  },
  tab: {
    flex: 1, paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.pill, alignItems: 'center',
  },
  tabSel: {
    backgroundColor: theme.colors.surface,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  tabTxt: { color: theme.colors.textMuted, fontSize: theme.fontSizes.sm, fontWeight: '500' },
  tabTxtSel: { color: theme.colors.text, fontWeight: '700' },
  statRow: { flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.md },
  stat: {
    flex: 1, padding: theme.spacing.md,
    backgroundColor: theme.colors.surface, borderRadius: theme.radii.md, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  statValue: { fontSize: theme.fontSizes.xl, fontWeight: '700', color: theme.colors.text, fontVariant: ['tabular-nums'] },
  statLabel: { color: theme.colors.textMuted, fontSize: theme.fontSizes.xs, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: '600', marginTop: 2 },
  section: {
    marginTop: theme.spacing.xl, marginBottom: theme.spacing.sm,
    fontSize: theme.fontSizes.xs, fontWeight: '700',
    color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8,
  },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: theme.spacing.md, paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border,
  },
  rowLabel: { color: theme.colors.text, fontSize: theme.fontSizes.sm, fontWeight: '500' },
  rowValue: { color: theme.colors.accent, fontWeight: '700', fontSize: theme.fontSizes.sm },
});
