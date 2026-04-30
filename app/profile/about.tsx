// app/profile/about.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { Trash2, AlertTriangle } from 'lucide-react-native';
import { Screen } from '@/ui/components/Screen';
import { BrandLogo } from '@/ui/components/BrandLogo';
import { useToast } from '@/ui/components/Toast';
import { getDbSync } from '@/db/client';
import { settingsRepo } from '@/domain/settings';
import { clearAppPin } from '@/crypto/keychain';
import { theme } from '@/ui/theme';

export default function AboutScreen() {
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);

  const resetAll = async () => {
    const db = getDbSync();
    db.exec(`DELETE FROM hypo_event;`);
    db.exec(`DELETE FROM insulin_dose;`);
    db.exec(`DELETE FROM measurement;`);
    db.exec(`DELETE FROM reminder;`);
    db.exec(`UPDATE settings SET
      display_name = NULL,
      avatar_uri = NULL,
      diagnosis_year = NULL,
      insulin_method = 'pen',
      target_low = 70,
      target_high = 180,
      hypo_threshold = 70,
      severe_hypo_threshold = 54,
      hyper_threshold = 250,
      unit = 'mgdl',
      app_lock_enabled = 0
      WHERE id = 1;`);

    // Re-seed default reminders
    const defaults = [
      { label: 'Jejum',         time: '07:00', ctx: 'fasting' },
      { label: 'Pré-almoço',    time: '12:00', ctx: 'pre_meal' },
      { label: 'Pós-almoço',    time: '14:00', ctx: 'post_meal' },
      { label: 'Pré-jantar',    time: '19:00', ctx: 'pre_meal' },
      { label: 'Pós-jantar',    time: '21:00', ctx: 'post_meal' },
      { label: 'Antes de dormir', time: '23:00', ctx: 'bedtime' },
    ];
    const now = Date.now();
    for (const r of defaults) {
      db.run(
        `INSERT INTO reminder (label, time_of_day, context_hint, days_of_week, tolerance_minutes, enabled, created_at)
         VALUES (?, ?, ?, '1111111', 30, 1, ?)`,
        [r.label, r.time, r.ctx, now],
      );
    }

    await clearAppPin();
    await Notifications.cancelAllScheduledNotificationsAsync();

    setConfirming(false);
    toast.success('Perfil resetado');
    router.replace('/onboarding/welcome');
  };

  return (
    <Screen title="Sobre & privacidade" showBack>
      <View style={styles.brand}>
        <BrandLogo size={64} />
        <Text style={styles.title}>Glico</Text>
        <Text style={styles.version}>versão 0.1.0</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.body}>
          Seus dados nunca saem do seu celular. Só você tem acesso. Backup é seu, exportação é sua.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.body}>
          Este app não substitui orientação médica. Em caso de hipoglicemia grave ou cetoacidose, procure atendimento de emergência.
        </Text>
      </View>

      <Text style={styles.section}>Zona de risco</Text>
      <Pressable
        onPress={() => setConfirming(true)}
        style={({ pressed }) => [styles.dangerCard, pressed && { opacity: 0.7 }]}
      >
        <Trash2 size={20} color={theme.colors.danger} strokeWidth={2} />
        <View style={{ flex: 1 }}>
          <Text style={styles.dangerLabel}>Resetar perfil</Text>
          <Text style={styles.dangerHint}>Apaga todas as medições, doses, lembretes e PIN. Volta pro onboarding.</Text>
        </View>
      </Pressable>

      <Modal transparent visible={confirming} animationType="fade" onRequestClose={() => setConfirming(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIcon}>
              <AlertTriangle size={24} color={theme.colors.danger} strokeWidth={2} />
            </View>
            <Text style={styles.modalTitle}>Resetar tudo?</Text>
            <Text style={styles.modalBody}>
              Apaga {'\n'}· Todas as medições{'\n'}· Doses de insulina{'\n'}· Episódios de hipo{'\n'}· Configuração de lembretes{'\n'}· Nome, alvos, PIN
              {'\n\n'}Operação irreversível. Continuar?
            </Text>
            <View style={styles.modalActions}>
              <Pressable onPress={() => setConfirming(false)} style={({ pressed }) => [styles.modalBtnGhost, pressed && { opacity: 0.7 }]}>
                <Text style={styles.modalBtnGhostTxt}>Cancelar</Text>
              </Pressable>
              <Pressable onPress={resetAll} style={({ pressed }) => [styles.modalBtnDanger, pressed && { opacity: 0.85 }]}>
                <Text style={styles.modalBtnDangerTxt}>Resetar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: { alignItems: 'center', gap: theme.spacing.sm, marginVertical: theme.spacing.md },
  title: { fontFamily: theme.fonts.bold, fontSize: theme.fontSizes.xl, color: theme.colors.text, letterSpacing: -0.5 },
  version: { color: theme.colors.textMuted, fontSize: theme.fontSizes.xs, fontFamily: theme.fonts.regular },
  card: {
    backgroundColor: theme.colors.surface, borderRadius: theme.radii.md,
    padding: theme.spacing.md, marginTop: theme.spacing.sm,
  },
  body: { color: theme.colors.text, fontSize: theme.fontSizes.sm, fontFamily: theme.fonts.regular, lineHeight: 20 },
  section: {
    marginTop: theme.spacing.xl, marginBottom: theme.spacing.sm,
    fontSize: theme.fontSizes.xs, fontFamily: theme.fonts.bold,
    color: theme.colors.danger, textTransform: 'uppercase', letterSpacing: 0.8,
  },
  dangerCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: theme.spacing.md, paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    borderWidth: 1, borderColor: '#f2d4d4',
  },
  dangerLabel: { color: theme.colors.danger, fontFamily: theme.fonts.semibold, fontSize: theme.fontSizes.sm },
  dangerHint: { color: theme.colors.textMuted, fontFamily: theme.fonts.regular, fontSize: theme.fontSizes.xs, marginTop: 2 },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(45,58,45,0.55)',
    alignItems: 'center', justifyContent: 'center', padding: 32,
  },
  modalCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20, padding: 24,
    width: '100%', maxWidth: 360,
    alignItems: 'flex-start',
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  modalIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#fff5f5', alignItems: 'center', justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  modalTitle: { fontFamily: theme.fonts.bold, fontSize: theme.fontSizes.lg, color: theme.colors.text },
  modalBody: {
    fontFamily: theme.fonts.regular, fontSize: theme.fontSizes.sm,
    color: theme.colors.textMuted, lineHeight: 20, marginTop: 8,
  },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: theme.spacing.lg, alignSelf: 'stretch' },
  modalBtnGhost: {
    flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.cardBg,
  },
  modalBtnGhostTxt: { color: theme.colors.text, fontFamily: theme.fonts.semibold, fontSize: theme.fontSizes.sm },
  modalBtnDanger: {
    flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.danger,
  },
  modalBtnDangerTxt: { color: '#fff', fontFamily: theme.fonts.semibold, fontSize: theme.fontSizes.sm },
});
