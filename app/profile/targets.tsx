// app/profile/targets.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { settingsRepo } from '@/domain/settings';
import { getDbSync } from '@/db/client';
import { useSettings } from '@/ui/hooks/useSettings';
import { ActionButton } from '@/ui/components/ActionButton';
import { theme } from '@/ui/theme';

export default function TargetsScreen() {
  const { data: s, reload } = useSettings();
  const [low, setLow] = useState(String(s?.targetLow ?? 70));
  const [high, setHigh] = useState(String(s?.targetHigh ?? 180));
  const [hypo, setHypo] = useState(String(s?.hypoThreshold ?? 70));
  const [hyper, setHyper] = useState(String(s?.hyperThreshold ?? 250));

  const save = () => {
    const lo = parseInt(low,10), hi = parseInt(high,10), hy = parseInt(hypo,10), hr = parseInt(hyper,10);
    if (!(lo > 0 && hi > lo && hy > 0 && hr > hi)) {
      Alert.alert('Valores inválidos', 'Verifique a ordem: hipo < alvo low < alvo high < hiper.');
      return;
    }
    settingsRepo(getDbSync()).update({ targetLow: lo, targetHigh: hi, hypoThreshold: hy, hyperThreshold: hr });
    reload();
    router.back();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Field label="Alvo low (mg/dL)" value={low} onChangeText={setLow} />
      <Field label="Alvo high (mg/dL)" value={high} onChangeText={setHigh} />
      <Field label="Hipoglicemia (<)" value={hypo} onChangeText={setHypo} />
      <Field label="Hiperglicemia (>)" value={hyper} onChangeText={setHyper} />
      <View style={{ height: theme.spacing.lg }} />
      <ActionButton label="Salvar" onPress={save} />
    </ScrollView>
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
  container: { padding: theme.spacing.lg, gap: theme.spacing.sm },
  label: { fontSize: theme.fontSizes.xs, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: theme.spacing.md },
  input: { backgroundColor: theme.colors.surface, borderRadius: theme.radii.md, padding: theme.spacing.md, color: theme.colors.text, borderWidth: 1, borderColor: theme.colors.border },
});
