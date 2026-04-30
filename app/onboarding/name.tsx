// app/onboarding/name.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { settingsRepo } from '@/domain/settings';
import { getDbSync } from '@/db/client';
import { Screen } from '@/ui/components/Screen';
import { ActionButton } from '@/ui/components/ActionButton';
import { StepDots } from '@/ui/components/StepDots';
import { theme } from '@/ui/theme';

export default function Name() {
  const [name, setName] = useState('');
  const next = () => {
    if (!name.trim()) { Alert.alert('Nome obrigatório'); return; }
    settingsRepo(getDbSync()).update({ displayName: name.trim() });
    router.push('/onboarding/targets');
  };
  return (
    <Screen showBack scroll={false}>
      <View style={styles.container}>
        <View>
          <StepDots current={1} total={3} />
        </View>
        <View style={styles.center}>
          <Text style={styles.title}>Como você se chama?</Text>
          <Text style={styles.body}>Vamos personalizar seus lembretes.</Text>
          <TextInput
            value={name} onChangeText={setName} placeholder="Seu nome"
            style={styles.input} placeholderTextColor={theme.colors.textMuted}
            autoFocus
          />
        </View>
        <ActionButton label="Continuar" onPress={next} disabled={!name} />
      </View>
    </Screen>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'space-between', paddingVertical: theme.spacing.lg },
  center: { gap: theme.spacing.sm, marginTop: theme.spacing.xl },
  title: { fontSize: 28, fontWeight: '700', color: theme.colors.text, lineHeight: 34 },
  body: { fontSize: theme.fontSizes.md, color: theme.colors.textMuted, lineHeight: 22 },
  input: {
    backgroundColor: theme.colors.surface, borderRadius: theme.radii.md,
    padding: theme.spacing.md, color: theme.colors.text,
    borderWidth: 1, borderColor: theme.colors.border, fontSize: theme.fontSizes.md,
    marginTop: theme.spacing.md,
  },
});
