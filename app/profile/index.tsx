// app/profile/index.tsx
import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Image } from 'react-native';
import { router } from 'expo-router';
import { useSettings } from '@/ui/hooks/useSettings';
import { theme } from '@/ui/theme';

export default function ProfileScreen() {
  const { data: s } = useSettings();
  if (!s) return null;
  const initial = (s.displayName ?? '?').slice(0, 1).toUpperCase();
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.avatar}>
        {s.avatarUri ? <Image source={{ uri: s.avatarUri }} style={{ width: 64, height: 64, borderRadius: 32 }} /> :
          <Text style={styles.avatarTxt}>{initial}</Text>}
      </View>
      <Text style={styles.name}>{s.displayName ?? 'Sem nome'}</Text>
      <Text style={styles.subtle}>T1{s.diagnosisYear ? ` desde ${s.diagnosisYear}` : ''} · {s.insulinMethod === 'pen' ? 'caneta MDI' : 'bomba'}</Text>

      <Text style={styles.section}>Alvos</Text>
      <Row label="Faixa alvo" value={`${s.targetLow}–${s.targetHigh} mg/dL`} onPress={() => router.push('/profile/targets')} />
      <Row label="Hipoglicemia" value={`< ${s.hypoThreshold}`} />
      <Row label="Hiperglicemia" value={`> ${s.hyperThreshold}`} />

      <Text style={styles.section}>Lembretes</Text>
      <Row label="Configurar lembretes" value="›" onPress={() => router.push('/profile/reminders')} />

      <Text style={styles.section}>Dados</Text>
      <Row label={s.appLockEnabled ? 'Bloqueio: ativo' : 'Bloqueio do app'} value="›" onPress={() => router.push('/profile/lock')} />
      <Row label="Sobre & privacidade" value="›" onPress={() => router.push('/profile/about')} />
    </ScrollView>
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
  container: { padding: theme.spacing.lg, gap: theme.spacing.sm },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: theme.colors.cardBg, alignSelf: 'center', alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { fontSize: theme.fontSizes.xl, color: theme.colors.accent, fontWeight: '700' },
  name: { textAlign: 'center', fontWeight: '600', color: theme.colors.text, marginTop: theme.spacing.sm },
  subtle: { textAlign: 'center', color: theme.colors.textMuted, fontSize: theme.fontSizes.xs },
  section: { marginTop: theme.spacing.lg, fontSize: theme.fontSizes.xs, fontWeight: '600', color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: theme.spacing.md, borderBottomWidth: 1, borderColor: theme.colors.border },
  rowLabel: { color: theme.colors.text, fontSize: theme.fontSizes.sm },
  rowValue: { color: theme.colors.accent, fontWeight: '600' },
});
