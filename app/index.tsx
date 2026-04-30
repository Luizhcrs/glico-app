// app/index.tsx
import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useLatestMeasurement, useMeasurementsInRange } from '@/ui/hooks/useMeasurements';
import { useSettings } from '@/ui/hooks/useSettings';
import { Screen } from '@/ui/components/Screen';
import { BigNumber } from '@/ui/components/BigNumber';
import { StatusPill, type Status } from '@/ui/components/StatusPill';
import { ActionButton } from '@/ui/components/ActionButton';
import { theme } from '@/ui/theme';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { GlucoseContext } from '@/domain/types';

function statusFor(value: number, low: number, high: number): Status {
  if (value < low) return 'low';
  if (value > high) return 'high';
  return 'ok';
}

const CONTEXT_LABEL: Record<GlucoseContext, string> = {
  fasting: 'Jejum',
  pre_meal: 'Pré-refeição',
  post_meal: 'Pós-refeição',
  bedtime: 'Antes de dormir',
  exercise: 'Exercício',
  hypo: 'Hipo',
  random: 'Aleatório',
};

export default function HomeScreen() {
  const { data: settings } = useSettings();
  const { data: latest } = useLatestMeasurement();
  const { startMs, endMs } = useMemo(() => {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(); end.setHours(23, 59, 59, 999);
    return { startMs: start.getTime(), endMs: end.getTime() };
  }, []);
  const { data: today } = useMeasurementsInRange(startMs, endMs);

  if (!settings) return null;
  const name = settings.displayName ?? '';
  const greeting = greetingFor(new Date());

  return (
    <Screen
      rightAction={{ label: 'Perfil', onPress: () => router.push('/profile') }}
    >
      <Animated.View entering={FadeIn.duration(350)} style={styles.greetWrap}>
        <Text style={styles.greeting}>{greeting},</Text>
        <Text style={styles.greetingName}>{name || 'Olá'}</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(450).delay(80).springify().damping(18)} style={styles.heroCard}>
        {latest ? (
          <>
            <Text style={styles.heroLabel}>
              Última medição · {formatDistanceToNow(new Date(latest.measuredAt), { addSuffix: true, locale: ptBR })}
            </Text>
            <BigNumber
              value={latest.valueMgdl}
              color={latest.valueMgdl < settings.targetLow ? theme.colors.danger : undefined}
            />
            <StatusPill status={statusFor(latest.valueMgdl, settings.targetLow, settings.targetHigh)} />
          </>
        ) : (
          <>
            <Text style={styles.heroLabel}>Nenhuma medição registrada ainda</Text>
            <BigNumber value="—" />
            <Text style={styles.empty}>Toque em "+ Medir" pra começar</Text>
          </>
        )}
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(400).delay(160)} style={styles.actionsRow}>
        <View style={{ flex: 1 }}>
          <ActionButton label="+ Medir" onPress={() => router.push('/log')} />
        </View>
        <View style={{ width: theme.spacing.sm }} />
        <View style={{ flex: 1 }}>
          <ActionButton label="Hipo" variant="danger" onPress={() => router.push('/hypo')} />
        </View>
      </Animated.View>
      <View style={{ height: theme.spacing.sm }} />
      <ActionButton label="+ Insulina" variant="ghost" onPress={() => router.push('/insulin')} />
      <View style={{ height: theme.spacing.sm }} />
      <Pressable onPress={() => router.push('/trend')} style={styles.linkRow}>
        <Text style={styles.linkLabel}>Ver tendência</Text>
        <Text style={styles.linkArrow}>›</Text>
      </Pressable>

      <Text style={styles.section}>Hoje</Text>
      {today.length === 0 ? (
        <Text style={styles.subtle}>Sem medições hoje</Text>
      ) : (
        <View style={styles.list}>
          {today.map((m, i) => {
            const status = statusFor(m.valueMgdl, settings.targetLow, settings.targetHigh);
            const valueColor =
              status === 'low' ? theme.colors.danger :
              status === 'high' ? theme.colors.warn :
              theme.colors.accent;
            return (
              <Animated.View key={m.id} entering={FadeInUp.duration(300).delay(60 * i)} style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTime}>{format(new Date(m.measuredAt), 'HH:mm')}</Text>
                  <Text style={styles.rowCtx}>{CONTEXT_LABEL[m.context]}</Text>
                </View>
                <Text style={[styles.rowValue, { color: valueColor }]}>{m.valueMgdl}</Text>
              </Animated.View>
            );
          })}
        </View>
      )}
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
  greeting: { fontSize: theme.fontSizes.md, color: theme.colors.textMuted, fontWeight: '500' },
  greetingName: { fontSize: 28, fontWeight: '700', color: theme.colors.text, letterSpacing: -0.5 },
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
    fontWeight: '600',
  },
  empty: { color: theme.colors.textMuted, fontSize: theme.fontSizes.sm, marginTop: theme.spacing.xs },
  actionsRow: { flexDirection: 'row' },
  linkRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: theme.spacing.md, paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radii.md, backgroundColor: theme.colors.surface,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  linkLabel: { color: theme.colors.text, fontSize: theme.fontSizes.sm, fontWeight: '600' },
  linkArrow: { color: theme.colors.accent, fontSize: 20, fontWeight: '300' },
  subtle: {
    color: theme.colors.textMuted, fontSize: theme.fontSizes.sm,
    textAlign: 'center', paddingVertical: theme.spacing.md,
  },
  section: {
    marginTop: theme.spacing.xl, marginBottom: theme.spacing.sm,
    fontSize: theme.fontSizes.xs, fontWeight: '700',
    color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8,
  },
  list: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: theme.spacing.md, paddingHorizontal: theme.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border,
  },
  rowTime: { color: theme.colors.text, fontSize: theme.fontSizes.md, fontWeight: '600' },
  rowCtx: { color: theme.colors.textMuted, fontSize: theme.fontSizes.xs },
  rowValue: { fontSize: theme.fontSizes.lg, fontWeight: '700' },
});
