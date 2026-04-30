// app/profile/lock.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Switch } from 'react-native';
import { router } from 'expo-router';
import { setAppPin, clearAppPin } from '@/crypto/keychain';
import { settingsRepo } from '@/domain/settings';
import { getDbSync } from '@/db/client';
import { useSettings } from '@/ui/hooks/useSettings';
import { Screen } from '@/ui/components/Screen';
import { ActionButton } from '@/ui/components/ActionButton';
import { useToast } from '@/ui/components/Toast';
import { theme } from '@/ui/theme';

export default function LockScreen() {
  const { data: s, reload } = useSettings();
  const toast = useToast();
  const [enabled, setEnabled] = useState(s?.appLockEnabled ?? false);
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');

  useEffect(() => { setEnabled(s?.appLockEnabled ?? false); }, [s?.appLockEnabled]);

  const save = async () => {
    if (enabled) {
      if (pin.length < 4 || pin.length > 8) { toast.error('Use 4 a 8 dígitos no PIN.'); return; }
      if (pin !== pinConfirm) { toast.error('Confirmação não bate.'); return; }
      await setAppPin(pin);
      settingsRepo(getDbSync()).update({ appLockEnabled: true });
      toast.success('Bloqueio ativado');
    } else {
      await clearAppPin();
      settingsRepo(getDbSync()).update({ appLockEnabled: false });
      toast.success('Bloqueio desativado');
    }
    reload();
    router.back();
  };

  return (
    <Screen title="Bloqueio do app" showBack>
      <View style={styles.toggleCard}>
        <Text style={styles.label}>Ativar PIN</Text>
        <Switch
          value={enabled}
          onValueChange={setEnabled}
          thumbColor={enabled ? theme.colors.accent : '#ccc'}
          trackColor={{ false: theme.colors.border, true: theme.colors.accentMuted }}
        />
      </View>
      {enabled && (
        <>
          <Text style={styles.help}>
            4 a 8 dígitos. Esqueceu o PIN? Você precisará reinstalar o app —
            todos os dados locais serão perdidos.
          </Text>
          <TextInput
            value={pin} onChangeText={setPin} placeholder="PIN"
            keyboardType="number-pad" secureTextEntry maxLength={8}
            style={styles.input} placeholderTextColor={theme.colors.textMuted}
          />
          <TextInput
            value={pinConfirm} onChangeText={setPinConfirm} placeholder="Confirme o PIN"
            keyboardType="number-pad" secureTextEntry maxLength={8}
            style={styles.input} placeholderTextColor={theme.colors.textMuted}
          />
        </>
      )}
      <View style={{ height: theme.spacing.lg }} />
      <ActionButton label="Salvar" onPress={save} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  toggleCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: theme.spacing.md, paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
  },
  label: { color: theme.colors.text, fontSize: theme.fontSizes.md, fontFamily: theme.fonts.medium },
  help: {
    color: theme.colors.textMuted, fontSize: theme.fontSizes.sm, fontFamily: theme.fonts.regular,
    lineHeight: 20, marginTop: theme.spacing.lg,
  },
  input: {
    backgroundColor: theme.colors.surface, borderRadius: theme.radii.md,
    padding: theme.spacing.md, color: theme.colors.text,
    fontFamily: theme.fonts.medium, fontSize: theme.fontSizes.md,
    borderWidth: 1, borderColor: theme.colors.border, marginTop: theme.spacing.sm,
  },
});
