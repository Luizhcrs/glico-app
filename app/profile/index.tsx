// app/profile/index.tsx
import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, Image } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ChevronRight, Target, Bell, Lock, Info, Syringe, Camera } from 'lucide-react-native';
import { useSettings } from '@/ui/hooks/useSettings';
import { insulinRepo } from '@/domain/insulin';
import { settingsRepo } from '@/domain/settings';
import { getDbSync } from '@/db/client';
import { Screen } from '@/ui/components/Screen';
import { useToast } from '@/ui/components/Toast';
import { theme } from '@/ui/theme';
import type { LucideIcon } from 'lucide-react-native';

export default function ProfileScreen() {
  const { data: s, reload } = useSettings();
  const toast = useToast();

  const pickAvatar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      toast.error('Permissão da galeria negada');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]) return;
    settingsRepo(getDbSync()).update({ avatarUri: result.assets[0].uri });
    reload();
    toast.success('Foto atualizada');
  };

  const insulinStats = useMemo(() => {
    const repo = insulinRepo(getDbSync());
    return {
      basal: repo.averagePerDay(7, 'basal'),
      bolus: repo.averagePerDay(7, 'bolus'),
      lastBasal: repo.lastBrandFor('basal'),
      lastBolus: repo.lastBrandFor('bolus'),
    };
  }, []);
  if (!s) return null;
  const initial = (s.displayName ?? '?').slice(0, 1).toUpperCase();
  const hasInsulinData = insulinStats.basal.doseCount > 0 || insulinStats.bolus.doseCount > 0;
  return (
    <Screen title="Perfil" showBack>
      <Pressable onPress={pickAvatar} style={({ pressed }) => [styles.avatarWrap, pressed && { opacity: 0.7 }]}>
        <View style={styles.avatar}>
          {s.avatarUri
            ? <Image source={{ uri: s.avatarUri }} style={{ width: 84, height: 84, borderRadius: 42 }} />
            : <Text style={styles.avatarTxt}>{initial}</Text>}
        </View>
        <View style={styles.cameraBadge}>
          <Camera size={14} color="#fff" strokeWidth={2.4} />
        </View>
      </Pressable>
      <Text style={styles.name}>{s.displayName ?? 'Sem nome'}</Text>
      <Text style={styles.subtle}>
        T1{s.diagnosisYear ? ` desde ${s.diagnosisYear}` : ''} · {s.insulinMethod === 'pen' ? 'caneta MDI' : 'bomba'}
      </Text>

      {hasInsulinData ? (
        <>
          <Text style={styles.section}>Insulina · últimos 7 dias</Text>
          <View style={styles.insulinRow}>
            <View style={styles.insulinCard}>
              <View style={styles.insulinHeader}>
                <Syringe size={14} color={theme.colors.accent} strokeWidth={2.2} />
                <Text style={styles.insulinTitle}>Lenta</Text>
              </View>
              <Text style={styles.insulinAvg}>{insulinStats.basal.avgPerDay} <Text style={styles.insulinUnit}>U/dia</Text></Text>
              <Text style={styles.insulinSub}>
                {insulinStats.basal.doseCount} {insulinStats.basal.doseCount === 1 ? 'dose' : 'doses'}
                {insulinStats.lastBasal ? ` · ${insulinStats.lastBasal}` : ''}
              </Text>
            </View>
            <View style={styles.insulinCard}>
              <View style={styles.insulinHeader}>
                <Syringe size={14} color={theme.colors.accent} strokeWidth={2.2} />
                <Text style={styles.insulinTitle}>Rápida</Text>
              </View>
              <Text style={styles.insulinAvg}>{insulinStats.bolus.avgPerDay} <Text style={styles.insulinUnit}>U/dia</Text></Text>
              <Text style={styles.insulinSub}>
                {insulinStats.bolus.doseCount} {insulinStats.bolus.doseCount === 1 ? 'dose' : 'doses'}
                {insulinStats.lastBolus ? ` · ${insulinStats.lastBolus}` : ''}
              </Text>
            </View>
          </View>
        </>
      ) : null}

      <Text style={styles.section}>Alvos</Text>
      <View style={styles.group}>
        <Row icon={Target} label="Faixa alvo" value={`${s.targetLow}–${s.targetHigh} mg/dL`} onPress={() => router.push('/profile/targets')} chevron />
        <Row label="Hipoglicemia" value={`< ${s.hypoThreshold}`} />
        <Row label="Hiperglicemia" value={`> ${s.hyperThreshold}`} last />
      </View>

      <Text style={styles.section}>Lembretes</Text>
      <View style={styles.group}>
        <Row icon={Bell} label="Configurar lembretes" onPress={() => router.push('/profile/reminders')} chevron last />
      </View>

      <Text style={styles.section}>Dados</Text>
      <View style={styles.group}>
        <Row icon={Lock} label={s.appLockEnabled ? 'Bloqueio: ativo' : 'Bloqueio do app'} onPress={() => router.push('/profile/lock')} chevron />
        <Row icon={Info} label="Sobre & privacidade" onPress={() => router.push('/profile/about')} chevron last />
      </View>
    </Screen>
  );
}

interface RowProps {
  icon?: LucideIcon;
  label: string;
  value?: string;
  onPress?: () => void;
  chevron?: boolean;
  last?: boolean;
}

function Row({ icon: Icon, label, value, onPress, chevron, last }: RowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        !last && styles.rowBorder,
        pressed && onPress ? { opacity: 0.6 } : null,
      ]}
    >
      {Icon ? <Icon size={18} color={theme.colors.accent} strokeWidth={2} style={{ marginRight: 12 }} /> : null}
      <Text style={styles.rowLabel}>{label}</Text>
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      {chevron ? <ChevronRight size={18} color={theme.colors.textMuted} strokeWidth={2} style={{ marginLeft: 8 }} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  avatarWrap: {
    alignSelf: 'center', marginTop: theme.spacing.sm,
    width: 84, height: 84,
  },
  avatar: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: theme.colors.cardBg,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarTxt: { fontSize: 34, color: theme.colors.accent, fontFamily: theme.fonts.bold },
  cameraBadge: {
    position: 'absolute', right: -2, bottom: -2,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: theme.colors.accent,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: theme.colors.bg,
  },
  name: { textAlign: 'center', fontFamily: theme.fonts.bold, fontSize: theme.fontSizes.lg, color: theme.colors.text, marginTop: theme.spacing.sm },
  subtle: { textAlign: 'center', color: theme.colors.textMuted, fontSize: theme.fontSizes.xs, fontFamily: theme.fonts.regular, marginTop: 2 },
  section: {
    marginTop: theme.spacing.xl, marginBottom: theme.spacing.sm,
    fontSize: theme.fontSizes.xs, fontFamily: theme.fonts.bold,
    color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8,
  },
  group: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: theme.spacing.md, paddingHorizontal: theme.spacing.md,
  },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border },
  rowLabel: { flex: 1, color: theme.colors.text, fontSize: theme.fontSizes.sm, fontFamily: theme.fonts.medium },
  rowValue: { color: theme.colors.accent, fontFamily: theme.fonts.semibold, fontSize: theme.fontSizes.sm },
  insulinRow: { flexDirection: 'row', gap: theme.spacing.sm },
  insulinCard: {
    flex: 1, backgroundColor: theme.colors.surface,
    padding: theme.spacing.md, borderRadius: theme.radii.md,
  },
  insulinHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  insulinTitle: {
    fontSize: theme.fontSizes.xs, fontFamily: theme.fonts.bold,
    color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6,
  },
  insulinAvg: {
    fontSize: theme.fontSizes.xl, fontFamily: theme.fonts.bold,
    color: theme.colors.text, marginTop: 6, fontVariant: ['tabular-nums'],
  },
  insulinUnit: { fontSize: theme.fontSizes.xs, color: theme.colors.textMuted, fontFamily: theme.fonts.regular },
  insulinSub: { fontSize: theme.fontSizes.xs, fontFamily: theme.fonts.regular, color: theme.colors.textMuted, marginTop: 4 },
});
