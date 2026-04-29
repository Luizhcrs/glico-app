// app/profile/lock.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, Alert, Switch } from 'react-native';
import { router } from 'expo-router';
import { setAppPin, clearAppPin } from '@/crypto/keychain';
import { settingsRepo } from '@/domain/settings';
import { getDbSync } from '@/db/client';
import { useSettings } from '@/ui/hooks/useSettings';
import { ActionButton } from '@/ui/components/ActionButton';
import { theme } from '@/ui/theme';

export default function LockScreen() {
  const { data: s, reload } = useSettings();
  const [enabled, setEnabled] = useState(s?.appLockEnabled ?? false);
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');

  useEffect(() => { setEnabled(s?.appLockEnabled ?? false); }, [s?.appLockEnabled]);

  const save = async () => {
    if (enabled) {
      if (pin.length < 4 || pin.length > 8) { Alert.alert('PIN', 'Use 4 a 8 dígitos.'); return; }
      if (pin !== pinConfirm) { Alert.alert('PIN', 'Confirmação não bate.'); return; }
      await setAppPin(pin);
      settingsRepo(getDbSync()).update({ appLockEnabled: true });
    } else {
      await clearAppPin();
      settingsRepo(getDbSync()).update({ appLockEnabled: false });
    }
    reload();
    router.back();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>Ativar bloqueio com PIN</Text>
        <Switch value={enabled} onValueChange={setEnabled}
          thumbColor={enabled ? theme.colors.accent : '#ccc'} />
      </View>
      {enabled && (
        <>
          <Text style={styles.help}>4 a 8 dígitos. Esqueceu o PIN? Você precisará reinstalar o app — todos os dados locais serão perdidos.</Text>
          <TextInput value={pin} onChangeText={setPin} placeholder="PIN" keyboardType="number-pad" secureTextEntry maxLength={8} style={styles.input} />
          <TextInput value={pinConfirm} onChangeText={setPinConfirm} placeholder="Confirme o PIN" keyboardType="number-pad" secureTextEntry maxLength={8} style={styles.input} />
        </>
      )}
      <View style={{ height: theme.spacing.lg }} />
      <ActionButton label="Salvar" onPress={save} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: theme.spacing.lg, gap: theme.spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: theme.spacing.md },
  label: { color: theme.colors.text, fontSize: theme.fontSizes.md },
  help: { color: theme.colors.textMuted, fontSize: theme.fontSizes.xs, marginVertical: theme.spacing.sm },
  input: { backgroundColor: theme.colors.surface, borderRadius: theme.radii.md, padding: theme.spacing.md, color: theme.colors.text, borderWidth: 1, borderColor: theme.colors.border, marginTop: theme.spacing.sm },
});
