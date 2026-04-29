// app/trend.tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSettings } from '@/ui/hooks/useSettings';
import { useMeasurementsInRange } from '@/ui/hooks/useMeasurements';
import { useStats } from '@/ui/hooks/useStats';
import { bucketByTimeOfDay } from '@/domain/stats';
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
  const to = Date.now();
  const from = to - days * 24 * 3600_000;
  const { data } = useMeasurementsInRange(from, to);
  const stats = useStats(data, settings?.targetLow ?? 70, settings?.targetHigh ?? 180);
  const buckets = bucketByTimeOfDay(data);

  if (!settings) return null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
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
      <Row label="Manhã (06–12)" value={buckets.morning.mean} count={buckets.morning.count} />
      <Row label="Tarde (12–18)" value={buckets.afternoon.mean} count={buckets.afternoon.count} />
      <Row label="Noite (18–24)" value={buckets.evening.mean} count={buckets.evening.count} />
      <Row label="Madrugada (00–06)" value={buckets.night.mean} count={buckets.night.count} />

      <View style={{ height: theme.spacing.lg }} />
      <ActionButton label="Exportar PDF" onPress={() => generateAndShareReport(data, settings, days)} />
    </ScrollView>
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
  container: { padding: theme.spacing.lg, gap: theme.spacing.sm },
  tabs: { flexDirection: 'row', gap: theme.spacing.sm },
  tab: { flex: 1, paddingVertical: theme.spacing.sm, borderRadius: theme.radii.md, backgroundColor: theme.colors.cardBg, alignItems: 'center' },
  tabSel: { backgroundColor: theme.colors.accent },
  tabTxt: { color: theme.colors.text, fontSize: theme.fontSizes.sm },
  tabTxtSel: { color: '#fff', fontWeight: '600' },
  statRow: { flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.md },
  stat: { flex: 1, padding: theme.spacing.md, backgroundColor: theme.colors.cardBg, borderRadius: theme.radii.md, alignItems: 'center' },
  statValue: { fontSize: theme.fontSizes.xl, fontWeight: '700', color: theme.colors.text },
  statLabel: { color: theme.colors.textMuted, fontSize: theme.fontSizes.xs, textTransform: 'uppercase', letterSpacing: 0.5 },
  section: { marginTop: theme.spacing.md, fontSize: theme.fontSizes.sm, fontWeight: '600', color: theme.colors.textMuted, textTransform: 'uppercase' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: theme.spacing.sm, borderBottomWidth: 1, borderColor: theme.colors.border },
  rowLabel: { color: theme.colors.text, fontSize: theme.fontSizes.sm },
  rowValue: { color: theme.colors.accent, fontWeight: '600' },
});
