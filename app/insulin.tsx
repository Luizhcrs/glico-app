// app/insulin.tsx
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, ScrollView, TextInput } from 'react-native';
import { router } from 'expo-router';
import { insulinRepo } from '@/domain/insulin';
import { measurementRepo } from '@/domain/measurement';
import { getDbSync } from '@/db/client';
import { validateInsulinUnits } from '@/domain/validators';
import { ActionButton } from '@/ui/components/ActionButton';
import { theme } from '@/ui/theme';
import type { InsulinType } from '@/domain/types';

export default function InsulinScreen() {
  const [units, setUnits] = useState(2);
  const [insulinType, setInsulinType] = useState<InsulinType>('bolus');
  const [brand, setBrand] = useState('');
  const [linkLatest, setLinkLatest] = useState(true);

  const submit = () => {
    const v = validateInsulinUnits(units);
    if (!v.ok) { Alert.alert('Unidades inválidas', v.reason); return; }
    const repo = insulinRepo(getDbSync());
    const lastM = linkLatest ? measurementRepo(getDbSync()).latest() : null;
    repo.insert({
      units,
      insulinType,
      insulinBrand: brand || null,
      takenAt: Date.now(),
      measurementId: lastM?.id ?? null,
    });
    router.replace('/');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Insulina aplicada</Text>

      <Text style={styles.label}>Tipo</Text>
      <View style={styles.row}>
        {(['basal','bolus'] as const).map((t) => (
          <Pressable key={t} onPress={() => setInsulinType(t)}
            style={[styles.tab, insulinType === t && styles.tabSel]}>
            <Text style={[styles.tabTxt, insulinType === t && styles.tabTxtSel]}>
              {t === 'basal' ? 'Basal' : 'Bolus'}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Unidades</Text>
      <View style={styles.stepperRow}>
        <Pressable onPress={() => setUnits((u) => Math.max(0, u - 0.5))} style={styles.stepBtn}><Text style={styles.stepTxt}>−</Text></Pressable>
        <Text style={styles.units}>{units.toFixed(1)}</Text>
        <Pressable onPress={() => setUnits((u) => Math.min(100, u + 0.5))} style={styles.stepBtn}><Text style={styles.stepTxt}>+</Text></Pressable>
      </View>

      <Text style={styles.label}>Marca (opcional)</Text>
      <TextInput value={brand} onChangeText={setBrand} placeholder="ex.: Lantus, Tresiba, NovoRapid"
        style={styles.input} placeholderTextColor={theme.colors.textMuted} />

      <Pressable onPress={() => setLinkLatest(!linkLatest)} style={styles.toggleRow}>
        <View style={[styles.checkbox, linkLatest && styles.checkboxOn]} />
        <Text style={styles.toggleTxt}>Vincular à última medição</Text>
      </Pressable>

      <View style={{ height: theme.spacing.lg }} />
      <ActionButton label="Salvar dose" onPress={submit} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: theme.spacing.lg, gap: theme.spacing.sm },
  title: { fontSize: theme.fontSizes.lg, fontWeight: '700', color: theme.colors.text, textAlign: 'center' },
  label: { marginTop: theme.spacing.md, fontSize: theme.fontSizes.sm, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', gap: theme.spacing.sm },
  tab: { flex: 1, paddingVertical: theme.spacing.md, borderRadius: theme.radii.md, backgroundColor: theme.colors.cardBg, alignItems: 'center' },
  tabSel: { backgroundColor: theme.colors.accent },
  tabTxt: { color: theme.colors.text, fontWeight: '600' },
  tabTxtSel: { color: '#fff' },
  stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: theme.spacing.lg },
  stepBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: theme.colors.cardBg, alignItems: 'center', justifyContent: 'center' },
  stepTxt: { fontSize: theme.fontSizes.xl, color: theme.colors.text, fontWeight: '700' },
  units: { fontSize: theme.fontSizes.hero, fontWeight: '300', color: theme.colors.text, minWidth: 100, textAlign: 'center' },
  input: { backgroundColor: theme.colors.surface, borderRadius: theme.radii.md, padding: theme.spacing.md, color: theme.colors.text, borderWidth: 1, borderColor: theme.colors.border },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, marginTop: theme.spacing.md },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: theme.colors.accent },
  checkboxOn: { backgroundColor: theme.colors.accent },
  toggleTxt: { color: theme.colors.text, fontSize: theme.fontSizes.sm },
});
