// app/insulin.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput } from 'react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Minus, Plus, Check } from 'lucide-react-native';
import { insulinRepo } from '@/domain/insulin';
import { measurementRepo } from '@/domain/measurement';
import { getDbSync } from '@/db/client';
import { validateInsulinUnits } from '@/domain/validators';
import { Screen } from '@/ui/components/Screen';
import { ActionButton } from '@/ui/components/ActionButton';
import { useToast } from '@/ui/components/Toast';
import { theme } from '@/ui/theme';
import type { InsulinType } from '@/domain/types';

const BRAND_SUGGESTIONS: Record<InsulinType, string[]> = {
  basal: ['Basaglar', 'Lantus', 'Tresiba', 'Toujeo', 'Levemir'],
  bolus: ['Fiasp', 'NovoRapid', 'Humalog', 'Apidra'],
};

const TYPES: Array<{
  key: InsulinType;
  primary: string;
  secondary: string;
  hint: string;
}> = [
  {
    key: 'basal',
    primary: 'Lenta',
    secondary: 'basal',
    hint: 'Ação prolongada — uma ou duas vezes ao dia.',
  },
  {
    key: 'bolus',
    primary: 'Rápida',
    secondary: 'bolus',
    hint: 'Aplicada antes das refeições ou pra correção.',
  },
];

export default function InsulinScreen() {
  const toast = useToast();
  const repo = useMemo(() => insulinRepo(getDbSync()), []);
  const [units, setUnits] = useState(2);
  const [insulinType, setInsulinType] = useState<InsulinType>('bolus');
  const [brand, setBrand] = useState('');
  const [linkLatest, setLinkLatest] = useState(true);

  // Pre-popula com última marca usada pra esse tipo
  useEffect(() => {
    const last = repo.lastBrandFor(insulinType);
    setBrand(last ?? '');
  }, [insulinType, repo]);

  const submit = () => {
    const v = validateInsulinUnits(units);
    if (!v.ok) { toast.error(`Unidades inválidas: ${v.reason}`); return; }
    const lastM = linkLatest ? measurementRepo(getDbSync()).latest() : null;
    repo.insert({
      units,
      insulinType,
      insulinBrand: brand.trim() || null,
      takenAt: Date.now(),
      measurementId: lastM?.id ?? null,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    toast.success(`Dose registrada: ${units.toFixed(1)} U`);
    router.replace('/');
  };

  const activeHint = TYPES.find((t) => t.key === insulinType)?.hint;

  return (
    <Screen title="Insulina aplicada" showBack>
      <Text style={styles.label}>Tipo</Text>
      <View style={styles.row}>
        {TYPES.map((t) => {
          const sel = insulinType === t.key;
          return (
            <Pressable
              key={t.key}
              onPress={() => setInsulinType(t.key)}
              style={({ pressed }) => [styles.tab, sel && styles.tabSel, pressed && { opacity: 0.85 }]}
            >
              <Text style={[styles.tabPrimary, sel && styles.tabPrimarySel]}>{t.primary}</Text>
              <Text style={[styles.tabSecondary, sel && styles.tabSecondarySel]}>{t.secondary}</Text>
            </Pressable>
          );
        })}
      </View>
      {activeHint ? <Text style={styles.hint}>{activeHint}</Text> : null}

      <Text style={styles.label}>Unidades</Text>
      <View style={styles.stepperRow}>
        <Pressable
          onPress={() => setUnits((u) => Math.max(0, u - 0.5))}
          style={({ pressed }) => [styles.stepBtn, pressed && { opacity: 0.6 }]}
        >
          <Minus size={22} color={theme.colors.accent} strokeWidth={2.4} />
        </Pressable>
        <Text style={styles.units}>{units.toFixed(1)}</Text>
        <Pressable
          onPress={() => setUnits((u) => Math.min(100, u + 0.5))}
          style={({ pressed }) => [styles.stepBtn, pressed && { opacity: 0.6 }]}
        >
          <Plus size={22} color={theme.colors.accent} strokeWidth={2.4} />
        </Pressable>
      </View>

      <Text style={styles.label}>Marca</Text>
      <View style={styles.brandRow}>
        {BRAND_SUGGESTIONS[insulinType].map((b) => {
          const sel = brand.trim().toLowerCase() === b.toLowerCase();
          return (
            <Pressable
              key={b}
              onPress={() => setBrand(b)}
              style={({ pressed }) => [styles.brandChip, sel && styles.brandChipSel, pressed && { opacity: 0.7 }]}
            >
              <Text style={[styles.brandChipTxt, sel && styles.brandChipTxtSel]}>{b}</Text>
            </Pressable>
          );
        })}
      </View>
      <TextInput
        value={brand} onChangeText={setBrand}
        placeholder="Outra marca…"
        style={[styles.input, { marginTop: theme.spacing.sm }]}
        placeholderTextColor={theme.colors.textMuted}
      />

      <Pressable
        onPress={() => setLinkLatest(!linkLatest)}
        style={({ pressed }) => [styles.toggleRow, pressed && { opacity: 0.7 }]}
      >
        <View style={[styles.checkbox, linkLatest && styles.checkboxOn]}>
          {linkLatest ? <Check size={14} color="#fff" strokeWidth={3} /> : null}
        </View>
        <Text style={styles.toggleTxt}>Vincular à última medição</Text>
      </Pressable>

      <View style={{ height: theme.spacing.lg }} />
      <ActionButton label="Salvar dose" onPress={submit} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: {
    marginTop: theme.spacing.lg, marginBottom: theme.spacing.sm,
    fontSize: theme.fontSizes.xs, fontFamily: theme.fonts.bold,
    color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8,
  },
  row: { flexDirection: 'row', gap: theme.spacing.sm },
  tab: {
    flex: 1, paddingVertical: theme.spacing.md,
    borderRadius: theme.radii.md, backgroundColor: theme.colors.surface,
    borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center',
  },
  tabSel: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
  tabPrimary: { color: theme.colors.text, fontFamily: theme.fonts.bold, fontSize: theme.fontSizes.md },
  tabPrimarySel: { color: '#fff' },
  tabSecondary: {
    color: theme.colors.textMuted, fontFamily: theme.fonts.regular,
    fontSize: theme.fontSizes.xs, marginTop: 2, textTransform: 'lowercase',
  },
  tabSecondarySel: { color: '#fff', opacity: 0.85 },
  hint: {
    color: theme.colors.textMuted, fontFamily: theme.fonts.regular,
    fontSize: theme.fontSizes.xs, marginTop: theme.spacing.sm, lineHeight: 18,
  },
  stepperRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: theme.spacing.xl, marginTop: theme.spacing.sm,
  },
  stepBtn: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: theme.colors.surface,
    borderWidth: 1, borderColor: theme.colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  units: {
    fontSize: theme.fontSizes.hero, fontFamily: theme.fonts.extralight,
    color: theme.colors.text, minWidth: 110, textAlign: 'center',
    fontVariant: ['tabular-nums'], letterSpacing: -1,
  },
  input: {
    backgroundColor: theme.colors.surface, borderRadius: theme.radii.md,
    padding: theme.spacing.md, color: theme.colors.text,
    fontFamily: theme.fonts.medium, fontSize: theme.fontSizes.md,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  brandRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  brandChip: {
    paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.surface,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  brandChipSel: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
  brandChipTxt: { color: theme.colors.text, fontFamily: theme.fonts.medium, fontSize: theme.fontSizes.sm },
  brandChipTxtSel: { color: '#fff', fontFamily: theme.fonts.semibold },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, marginTop: theme.spacing.lg },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 2, borderColor: theme.colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: theme.colors.accent },
  toggleTxt: { color: theme.colors.text, fontSize: theme.fontSizes.sm, fontFamily: theme.fonts.medium },
});
