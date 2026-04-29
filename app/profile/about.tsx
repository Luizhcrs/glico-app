// app/profile/about.tsx
import React from 'react';
import { ScrollView, Text, StyleSheet } from 'react-native';
import { theme } from '@/ui/theme';

export default function AboutScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Glico</Text>
      <Text style={styles.version}>Versão 0.1.0</Text>
      <Text style={styles.body}>
        Seus dados nunca saem do seu celular. Só você tem acesso. Backup é seu, exportação é sua.
      </Text>
      <Text style={styles.body}>
        Este app não substitui orientação médica. Em caso de hipoglicemia grave ou cetoacidose, procure atendimento de emergência.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: theme.spacing.lg, gap: theme.spacing.md },
  title: { fontSize: theme.fontSizes.xl, fontWeight: '700', color: theme.colors.text },
  version: { color: theme.colors.textMuted, fontSize: theme.fontSizes.sm },
  body: { color: theme.colors.text, fontSize: theme.fontSizes.sm, lineHeight: 20 },
});
