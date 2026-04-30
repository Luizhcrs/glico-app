// src/ui/components/MeasurementSheet.tsx
//
// Bottom sheet sutil pra editar / excluir uma medição.
// Tocar em "Excluir" usa softDelete + mostra botão "Desfazer" embutido por 5s.
// Edit é inline: trocar contexto (chips) + nota livre + valor.
//
import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, Modal, Pressable, TextInput, Animated, Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Trash2, Save, X, Undo2 } from 'lucide-react-native';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { measurementRepo } from '@/domain/measurement';
import { getDbSync } from '@/db/client';
import { ContextChips } from '@/ui/components/ContextChips';
import { theme } from '@/ui/theme';
import type { GlucoseContext, Measurement } from '@/domain/types';

interface Props {
  measurementId: number | null;
  onClose: () => void;
  onChanged: () => void;
}

export function MeasurementSheet({ measurementId, onClose, onChanged }: Props) {
  const visible = measurementId != null;
  const repo = useMemo(() => measurementRepo(getDbSync()), []);
  const [m, setM] = useState<Measurement | null>(null);
  const [valueText, setValueText] = useState('');
  const [context, setContext] = useState<GlucoseContext>('random');
  const [note, setNote] = useState('');
  const [deletedId, setDeletedId] = useState<number | null>(null);

  const overlay = useMemo(() => new Animated.Value(0), []);
  const sheetY = useMemo(() => new Animated.Value(60), []);

  useEffect(() => {
    if (measurementId == null) return;
    const found = repo.findById(measurementId);
    if (!found) return;
    setM(found);
    setValueText(String(found.valueMgdl));
    setContext(found.context);
    setNote(found.note ?? '');
    setDeletedId(null);
    Animated.parallel([
      Animated.timing(overlay, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.timing(sheetY, { toValue: 0, duration: 240, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [measurementId, repo, overlay, sheetY]);

  const close = () => {
    // Fecha instantâneo no react state, anima depois pra ficar percebido como rápido
    setM(null);
    setDeletedId(null);
    onClose();
    overlay.setValue(0);
    sheetY.setValue(60);
  };

  const save = () => {
    if (!m) return;
    const v = parseInt(valueText, 10);
    if (Number.isNaN(v) || v < 20 || v > 600) return;
    repo.update(m.id, {
      valueMgdl: v,
      context,
      note: note.trim() ? note.trim() : null,
    });
    onChanged();
    close();
  };

  const remove = () => {
    if (!m) return;
    repo.softDelete(m.id);
    setDeletedId(m.id);
    onChanged();
  };

  const undo = () => {
    if (deletedId == null) return;
    repo.restore(deletedId);
    onChanged();
    close();
  };

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={close}>
      <Animated.View style={[styles.overlay, { opacity: overlay }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} />
      </Animated.View>
      <Animated.View
        style={[
          styles.sheet,
          { transform: [{ translateY: sheetY }] },
        ]}
      >
        <SheetHandle />
        {deletedId != null ? (
          <DeletedView onUndo={undo} onClose={close} />
        ) : m ? (
          <EditView
            m={m}
            valueText={valueText}
            setValueText={setValueText}
            context={context}
            setContext={setContext}
            note={note}
            setNote={setNote}
            onSave={save}
            onDelete={remove}
            onClose={close}
          />
        ) : null}
      </Animated.View>
    </Modal>
  );
}

function SheetHandle() {
  return <View style={styles.handle} />;
}

function EditView({
  m, valueText, setValueText, context, setContext, note, setNote,
  onSave, onDelete, onClose,
}: {
  m: Measurement;
  valueText: string; setValueText: (v: string) => void;
  context: GlucoseContext; setContext: (c: GlucoseContext) => void;
  note: string; setNote: (n: string) => void;
  onSave: () => void; onDelete: () => void; onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.body, { paddingBottom: insets.bottom + 12 }]}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Editar medição</Text>
          <Text style={styles.subtitle}>{format(new Date(m.measuredAt), "EEEE, dd 'de' MMM · HH:mm", { locale: ptBR })}</Text>
        </View>
        <Pressable onPress={onClose} hitSlop={10} style={styles.iconBtn}>
          <X size={20} color={theme.colors.textMuted} strokeWidth={2.2} />
        </Pressable>
      </View>

      <Text style={styles.label}>Valor (mg/dL)</Text>
      <TextInput
        keyboardType="number-pad"
        value={valueText}
        onChangeText={setValueText}
        maxLength={3}
        style={styles.input}
        placeholderTextColor={theme.colors.textMuted}
      />

      <Text style={styles.label}>Contexto</Text>
      <ContextChips value={context} onChange={setContext} />

      <Text style={styles.label}>Nota (opcional)</Text>
      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder="Ex.: pós exercício leve, jantei tarde…"
        placeholderTextColor={theme.colors.textMuted}
        multiline
        style={[styles.input, styles.inputMulti]}
        maxLength={200}
      />

      <View style={styles.actions}>
        <Pressable onPress={onDelete} style={({ pressed }) => [styles.dangerBtn, pressed && { opacity: 0.7 }]}>
          <Trash2 size={18} color={theme.colors.danger} strokeWidth={2} />
          <Text style={styles.dangerTxt}>Excluir</Text>
        </Pressable>
        <Pressable onPress={onSave} style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }]}>
          <Save size={18} color="#fff" strokeWidth={2.2} />
          <Text style={styles.primaryTxt}>Salvar</Text>
        </Pressable>
      </View>
    </View>
  );
}

function DeletedView({ onUndo, onClose }: { onUndo: () => void; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const [secondsLeft, setSecondsLeft] = useState(5);
  useEffect(() => {
    if (secondsLeft <= 0) { onClose(); return; }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft, onClose]);

  return (
    <View style={[styles.body, { paddingBottom: insets.bottom + 12 }]}>
      <View style={styles.deletedRow}>
        <Trash2 size={18} color={theme.colors.textMuted} strokeWidth={2} />
        <Text style={styles.deletedMsg}>Medição apagada</Text>
        <Pressable onPress={onUndo} hitSlop={8} style={styles.undoBtn}>
          <Undo2 size={16} color={theme.colors.accent} strokeWidth={2.2} />
          <Text style={styles.undoTxt}>Desfazer ({secondsLeft})</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(45,58,45,0.45)' },
  sheet: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    backgroundColor: theme.colors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: -6 },
    elevation: 12,
  },
  handle: {
    width: 40, height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10, marginBottom: 4,
  },
  body: { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: theme.spacing.md },
  title: { fontFamily: theme.fonts.bold, fontSize: theme.fontSizes.lg, color: theme.colors.text },
  subtitle: { fontFamily: theme.fonts.regular, fontSize: theme.fontSizes.xs, color: theme.colors.textMuted, marginTop: 2 },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.colors.surface,
  },
  label: {
    fontSize: theme.fontSizes.xs, fontFamily: theme.fonts.semibold,
    color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8,
    marginTop: theme.spacing.md, marginBottom: 6,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    padding: 12,
    color: theme.colors.text,
    fontSize: theme.fontSizes.md,
    fontFamily: theme.fonts.medium,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  inputMulti: { minHeight: 64, textAlignVertical: 'top' },
  actions: { flexDirection: 'row', gap: 10, marginTop: theme.spacing.lg },
  dangerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 14, paddingHorizontal: 16,
    backgroundColor: '#fff5f5',
    borderRadius: theme.radii.pill,
    borderWidth: 1, borderColor: '#f2d4d4',
  },
  dangerTxt: { color: theme.colors.danger, fontFamily: theme.fonts.semibold, fontSize: theme.fontSizes.sm },
  primaryBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14,
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radii.pill,
  },
  primaryTxt: { color: '#fff', fontFamily: theme.fonts.semibold, fontSize: theme.fontSizes.md },
  deletedRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: theme.spacing.md,
  },
  deletedMsg: { flex: 1, color: theme.colors.text, fontFamily: theme.fonts.medium, fontSize: theme.fontSizes.sm },
  undoBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.radii.pill,
  },
  undoTxt: { color: theme.colors.accent, fontFamily: theme.fonts.semibold, fontSize: theme.fontSizes.sm },
});
