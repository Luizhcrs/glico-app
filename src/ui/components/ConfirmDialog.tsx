// src/ui/components/ConfirmDialog.tsx
//
// Modal de confirmação Sage Calm. Substitui Alert.alert nativo.
//
import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { theme } from '@/ui/theme';

interface Props {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'default',
  onConfirm,
  onCancel,
}: Props) {
  const isDanger = variant === 'danger';
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={[styles.icon, isDanger && styles.iconDanger]}>
            <AlertTriangle
              size={22}
              color={isDanger ? theme.colors.danger : theme.colors.warn}
              strokeWidth={2}
            />
          </View>
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.body}>{message}</Text> : null}
          <View style={styles.actions}>
            <Pressable
              onPress={onCancel}
              style={({ pressed }) => [styles.btnGhost, pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.btnGhostTxt}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.btnPrimary,
                isDanger && styles.btnDanger,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={styles.btnPrimaryTxt}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(45,58,45,0.55)',
    alignItems: 'center', justifyContent: 'center',
    padding: 32,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 24,
    width: '100%', maxWidth: 360,
    alignItems: 'flex-start',
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 }, elevation: 8,
  },
  icon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#fdf6e3',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  iconDanger: { backgroundColor: '#fff5f5' },
  title: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSizes.lg,
    color: theme.colors.text,
  },
  body: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textMuted,
    lineHeight: 20,
    marginTop: 8,
  },
  actions: { flexDirection: 'row', gap: 10, marginTop: theme.spacing.lg, alignSelf: 'stretch' },
  btnGhost: {
    flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.cardBg,
  },
  btnGhostTxt: { color: theme.colors.text, fontFamily: theme.fonts.semibold, fontSize: theme.fontSizes.sm },
  btnPrimary: {
    flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.accent,
  },
  btnDanger: { backgroundColor: theme.colors.danger },
  btnPrimaryTxt: { color: '#fff', fontFamily: theme.fonts.semibold, fontSize: theme.fontSizes.sm },
});
