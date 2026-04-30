// app/profile/targets.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { settingsRepo } from '@/domain/settings';
import { getDbSync } from '@/db/client';
import { useSettings } from '@/ui/hooks/useSettings';
import { Screen } from '@/ui/components/Screen';
import { ActionButton } from '@/ui/components/ActionButton';
import { useToast } from '@/ui/components/Toast';
import { theme } from '@/ui/theme';

export default function TargetsScreen() {
  const { data: s, reload } = useSettings();
  const toast = useToast();
  const [low, setLow] = useState(String(s?.targetLow ?? 70));
  const [high, setHigh] = useState(String(s?.targetHigh ?? 180));
  const [hypo, setHypo] = useState(String(s?.hypoThreshold ?? 70));
  const [hyper, setHyper] = useState(String(s?.hyperThreshold ?? 250));

  const save = () => {
    const lo = parseInt(low,10), hi = parseInt(high,10), hy = parseInt(hypo,10), hr = parseInt(hyper,10);
    if (!(lo > 0 && hi > lo && hy > 0 && hr > hi)) {
      toast.error('Verifique a ordem: hipo < alvo baixo < alvo alto < hiper.');
      return;
    }
    settingsRepo(getDbSync()).update({ targetLow: lo, targetHigh: hi, hypoThreshold: hy, hyperThreshold: hr });
    reload();
    toast.success('Alvos atualizados');
    router.back();
  };

  return (
    <Screen title="Alvos de glicemia" showBack>
      <Field label="Alvo baixo (mg/dL)" value={low} onChangeText={setLow} />
      <Field label="Alvo alto (mg/dL)" value={high} onChangeText={setHigh} />
      <Field label="Hipoglicemia (<)" value={hypo} onChangeText={setHypo} />
      <Field label="Hiperglicemia (>)" value={hyper} onChangeText={setHyper} />
      <View style={{ height: theme.spacing.lg }} />
      <ActionButton label="Salvar" onPress={save} />
    </Screen>
  );
}

function Field({ label, value, onChangeText }: { label: string; value: string; onChangeText: (s: string) => void }) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TextInput keyboardType="number-pad" value={value} onChangeText={onChangeText} style={styles.input} />
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: theme.fontSizes.xs, fontFamily: theme.fonts.bold,
    color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8,
    marginTop: theme.spacing.lg, marginBottom: theme.spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.surface, borderRadius: theme.radii.md,
    padding: theme.spacing.md, color: theme.colors.text,
    fontFamily: theme.fonts.medium, fontSize: theme.fontSizes.md,
    borderWidth: 1, borderColor: theme.colors.border,
  },
});
