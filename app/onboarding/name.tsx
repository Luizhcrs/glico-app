// app/onboarding/name.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { settingsRepo } from '@/domain/settings';
import { getDbSync } from '@/db/client';
import { ActionButton } from '@/ui/components/ActionButton';
import { theme } from '@/ui/theme';

export default function Name() {
  const [name, setName] = useState('');
  const next = () => {
    if (!name.trim()) { Alert.alert('Nome obrigatório'); return; }
    settingsRepo(getDbSync()).update({ displayName: name.trim() });
    router.push('/onboarding/targets');
  };
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Como você se chama?</Text>
      <TextInput value={name} onChangeText={setName} placeholder="Nome"
        style={styles.input} placeholderTextColor={theme.colors.textMuted} />
      <ActionButton label="Continuar" onPress={next} disabled={!name} />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: theme.spacing.xl, gap: theme.spacing.md },
  title: { fontSize: theme.fontSizes.lg, color: theme.colors.text },
  input: { backgroundColor: theme.colors.surface, borderRadius: theme.radii.md, padding: theme.spacing.md, color: theme.colors.text, borderWidth: 1, borderColor: theme.colors.border },
});
