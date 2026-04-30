// app/profile/index.tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet, Image } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useSettings } from '@/ui/hooks/useSettings';
import { Screen } from '@/ui/components/Screen';
import { theme } from '@/ui/theme';

export default function ProfileScreen() {
  const { data: s } = useSettings();
  if (!s) return null;
  const initial = (s.displayName ?? '?').slice(0, 1).toUpperCase();
  return (
    <Screen title="Perfil" showBack>
      <Animated.View entering={ZoomIn.duration(400).springify().damping(14)} style={styles.avatar}>
        {s.avatarUri ? <Image source={{ uri: s.avatarUri }} style={{ width: 80, height: 80, borderRadius: 40 }} /> :
          <Text style={styles.avatarTxt}>{initial}</Text>}
      </Animated.View>
      <Animated.Text entering={FadeIn.duration(350).delay(120)} style={styles.name}>
        {s.displayName ?? 'Sem nome'}
      </Animated.Text>
      <Animated.Text entering={FadeIn.duration(350).delay(180)} style={styles.subtle}>
        T1{s.diagnosisYear ? ` desde ${s.diagnosisYear}` : ''} · {s.insulinMethod === 'pen' ? 'caneta MDI' : 'bomba'}
      </Animated.Text>

      <Text style={styles.section}>Alvos</Text>
      <Row label="Faixa alvo" value={`${s.targetLow}–${s.targetHigh} mg/dL`} onPress={() => router.push('/profile/targets')} />
      <Row label="Hipoglicemia" value={`< ${s.hypoThreshold}`} />
      <Row label="Hiperglicemia" value={`> ${s.hyperThreshold}`} />

      <Text style={styles.section}>Lembretes</Text>
      <Row label="Configurar lembretes" value="›" onPress={() => router.push('/profile/reminders')} />

      <Text style={styles.section}>Dados</Text>
      <Row label={s.appLockEnabled ? 'Bloqueio: ativo' : 'Bloqueio do app'} value="›" onPress={() => router.push('/profile/lock')} />
      <Row label="Sobre & privacidade" value="›" onPress={() => router.push('/profile/about')} />
    </Screen>
  );
}

function Row({ label, value, onPress }: { label: string; value: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: theme.colors.cardBg,
    alignSelf: 'center', alignItems: 'center', justifyContent: 'center',
    marginTop: theme.spacing.sm,
  },
  avatarTxt: { fontSize: 32, color: theme.colors.accent, fontWeight: '700' },
  name: { textAlign: 'center', fontWeight: '700', fontSize: theme.fontSizes.lg, color: theme.colors.text, marginTop: theme.spacing.sm },
  subtle: { textAlign: 'center', color: theme.colors.textMuted, fontSize: theme.fontSizes.xs, marginTop: 2 },
  section: { marginTop: theme.spacing.xl, marginBottom: theme.spacing.sm, fontSize: theme.fontSizes.xs, fontWeight: '700', color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: theme.spacing.md, paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border,
  },
  rowLabel: { color: theme.colors.text, fontSize: theme.fontSizes.sm, fontWeight: '500' },
  rowValue: { color: theme.colors.accent, fontWeight: '600', fontSize: theme.fontSizes.sm },
});
