// app/index.tsx
import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { ChevronRight, Plus, AlertOctagon, Syringe } from 'lucide-react-native';
import { useLatestMeasurement, useMeasurementsInRange } from '@/ui/hooks/useMeasurements';
import { useSettings } from '@/ui/hooks/useSettings';
import { insulinRepo } from '@/domain/insulin';
import { measurementRepo } from '@/domain/measurement';
import { getDbSync } from '@/db/client';
import { Screen } from '@/ui/components/Screen';
import { BigNumber } from '@/ui/components/BigNumber';
import { StatusPill, type Status } from '@/ui/components/StatusPill';
import { ActionButton } from '@/ui/components/ActionButton';
import { TrendArrow } from '@/ui/components/TrendArrow';
import { MeasurementSheet } from '@/ui/components/MeasurementSheet';
import { SwipeableMeasurementRow } from '@/ui/components/SwipeableMeasurementRow';
import { useToast } from '@/ui/components/Toast';
import { theme } from '@/ui/theme';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Measurement } from '@/domain/types';

function statusFor(value: number, low: number, high: number): Status {
  if (value < low) return 'low';
  if (value > high) return 'high';
  return 'ok';
}

function bucketLabel(d: Date): 'Madrugada' | 'Manhã' | 'Tarde' | 'Noite' {
  const h = d.getHours();
  if (h < 6) return 'Madrugada';
  if (h < 12) return 'Manhã';
  if (h < 18) return 'Tarde';
  return 'Noite';
}

interface DaySection { title: string; data: Measurement[]; }

export default function HomeScreen() {
  const { data: settings } = useSettings();
  const { data: latest, previous, reload: reloadLatest } = useLatestMeasurement();
  const toast = useToast();
  const [sheetMeasurementId, setSheetMeasurementId] = useState<number | null>(null);
  const { startMs, endMs } = useMemo(() => {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(); end.setHours(23, 59, 59, 999);
    return { startMs: start.getTime(), endMs: end.getTime() };
  }, []);
  const { data: today, reload: reloadToday } = useMeasurementsInRange(startMs, endMs);

  const reloadAll = () => { reloadLatest(); reloadToday(); };
  const delta = latest && previous ? latest.valueMgdl - previous.valueMgdl : null;

  const insulinByMeasurement = useMemo(() => {
    const repo = insulinRepo(getDbSync());
    const map = new Map<number, { basal: number; bolus: number }>();
    for (const m of today) {
      const linked = repo.listByMeasurement(m.id);
      if (linked.length === 0) continue;
      const acc = { basal: 0, bolus: 0 };
      for (const d of linked) {
        if (d.insulinType === 'basal') acc.basal += d.units;
        else acc.bolus += d.units;
      }
      map.set(m.id, acc);
    }
    return map;
  }, [today]);

  const sections: DaySection[] = useMemo(() => {
    const order: Array<DaySection['title']> = ['Manhã', 'Tarde', 'Noite', 'Madrugada'];
    const buckets: Record<string, Measurement[]> = {};
    for (const m of today) {
      const k = bucketLabel(new Date(m.measuredAt));
      (buckets[k] ??= []).push(m);
    }
    return order
      .filter((k) => buckets[k]?.length)
      .map((k) => ({ title: k, data: buckets[k] }));
  }, [today]);

  const handleDelete = (m: Measurement) => {
    const repo = measurementRepo(getDbSync());
    repo.softDelete(m.id);
    reloadAll();
    toast.show(`Medição ${m.valueMgdl} mg/dL apagada`, {
      variant: 'info',
      duration: 5000,
      action: {
        label: 'Desfazer',
        onPress: () => { repo.restore(m.id); reloadAll(); },
      },
    });
  };

  const insulinHintFor = (id: number): string | undefined => {
    const ins = insulinByMeasurement.get(id);
    if (!ins) return undefined;
    const parts: string[] = [];
    if (ins.bolus > 0) parts.push(`${ins.bolus.toFixed(1)}u rápida`);
    if (ins.basal > 0) parts.push(`${ins.basal.toFixed(1)}u lenta`);
    return parts.length ? parts.join(' + ') : undefined;
  };

  if (!settings) return null;
  const name = settings.displayName ?? '';
  const greeting = greetingFor(new Date());

  return (
    <Screen
      rightAction={{ label: 'Perfil', onPress: () => router.push('/profile') }}
    >
      <View style={styles.greetWrap}>
        <Text style={styles.greeting}>{greeting},</Text>
        <Text style={styles.greetingName}>{name || 'Olá'}</Text>
      </View>

      <View style={styles.heroCard}>
        {latest ? (
          <>
            <Text style={styles.heroLabel}>
              Última medição · {formatDistanceToNow(new Date(latest.measuredAt), { addSuffix: true, locale: ptBR })}
            </Text>
            <BigNumber
              value={latest.valueMgdl}
              color={
                latest.valueMgdl < settings.targetLow ? theme.colors.danger :
                latest.valueMgdl > settings.targetHigh ? theme.colors.warn :
                theme.colors.accent
              }
            />
            <View style={styles.heroPillRow}>
              <StatusPill status={statusFor(latest.valueMgdl, settings.targetLow, settings.targetHigh)} />
              <TrendArrow delta={delta} />
            </View>
          </>
        ) : (
          <>
            <Text style={styles.heroLabel}>Nenhuma medição registrada ainda</Text>
            <BigNumber value="—" />
            <Text style={styles.empty}>Toque em "+ Medir" pra começar</Text>
          </>
        )}
      </View>

      <View style={styles.actionsRow}>
        <View style={{ flex: 1 }}>
          <ActionButton label="Medir" icon={Plus} onPress={() => router.push('/log')} />
        </View>
        <View style={{ width: theme.spacing.sm }} />
        <View style={{ flex: 1 }}>
          <ActionButton label="Hipo" icon={AlertOctagon} variant="danger" onPress={() => router.push('/hypo')} />
        </View>
      </View>
      <View style={{ height: theme.spacing.sm }} />
      <ActionButton label="Insulina" icon={Syringe} variant="ghost" onPress={() => router.push('/insulin')} />
      <View style={{ height: theme.spacing.sm }} />
      <Pressable onPress={() => router.push('/trend')} style={({ pressed }) => [styles.linkRow, pressed && { opacity: 0.7 }]}>
        <Text style={styles.linkLabel}>Ver tendência</Text>
        <ChevronRight size={18} color={theme.colors.accent} strokeWidth={2.2} />
      </Pressable>

      <Text style={styles.section}>Hoje</Text>
      {sections.length === 0 ? (
        <Text style={styles.subtle}>Sem medições hoje</Text>
      ) : (
        sections.map((sec) => (
          <View key={sec.title} style={styles.sectionBlock}>
            <Text style={styles.bucketHeader}>{sec.title}</Text>
            <View style={styles.list}>
              {sec.data.map((m, i) => {
                const status = statusFor(m.valueMgdl, settings.targetLow, settings.targetHigh);
                const valueColor =
                  status === 'low' ? theme.colors.danger :
                  status === 'high' ? theme.colors.warn :
                  theme.colors.accent;
                return (
                  <SwipeableMeasurementRow
                    key={m.id}
                    measurement={m}
                    valueColor={valueColor}
                    insulinHint={insulinHintFor(m.id)}
                    isLast={i === sec.data.length - 1}
                    onPress={() => setSheetMeasurementId(m.id)}
                    onDelete={() => handleDelete(m)}
                  />
                );
              })}
            </View>
          </View>
        ))
      )}

      <MeasurementSheet
        measurementId={sheetMeasurementId}
        onClose={() => setSheetMeasurementId(null)}
        onChanged={reloadAll}
      />
    </Screen>
  );
}

function greetingFor(d: Date): string {
  const h = d.getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

const styles = StyleSheet.create({
  greetWrap: { marginBottom: theme.spacing.lg },
  greeting: { fontSize: theme.fontSizes.md, color: theme.colors.textMuted, fontFamily: theme.fonts.medium },
  greetingName: { fontSize: 28, fontFamily: theme.fonts.bold, color: theme.colors.text, letterSpacing: -0.5 },
  heroCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    alignItems: 'center',
    gap: theme.spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  heroLabel: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontFamily: theme.fonts.semibold,
  },
  heroPillRow: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' },
  empty: { color: theme.colors.textMuted, fontSize: theme.fontSizes.sm, fontFamily: theme.fonts.regular, marginTop: theme.spacing.xs },
  actionsRow: { flexDirection: 'row' },
  linkRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: theme.spacing.md, paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radii.md, backgroundColor: theme.colors.surface,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  linkLabel: { color: theme.colors.text, fontSize: theme.fontSizes.sm, fontFamily: theme.fonts.semibold },
  subtle: {
    color: theme.colors.textMuted, fontSize: theme.fontSizes.sm, fontFamily: theme.fonts.regular,
    textAlign: 'center', paddingVertical: theme.spacing.md,
  },
  section: {
    marginTop: theme.spacing.xl, marginBottom: theme.spacing.sm,
    fontSize: theme.fontSizes.xs, fontFamily: theme.fonts.bold,
    color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8,
  },
  list: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    overflow: 'hidden',
  },
  sectionBlock: { marginBottom: theme.spacing.md },
  bucketHeader: {
    fontSize: theme.fontSizes.xs, fontFamily: theme.fonts.semibold,
    color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6,
    marginBottom: 6, marginLeft: 4,
  },
});
