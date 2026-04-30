// app/onboarding/welcome.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/ui/components/Screen';
import { ActionButton } from '@/ui/components/ActionButton';
import { BrandLogo } from '@/ui/components/BrandLogo';
import { theme } from '@/ui/theme';

export default function Welcome() {
  return (
    <Screen scroll={false}>
      <View style={styles.container}>
        <View style={styles.brandWrap}>
          <BrandLogo size={72} />
          <Text style={styles.brand}>Glico</Text>
        </View>
        <View style={styles.center}>
          <Text style={styles.title}>Bem-vinda ao Glico</Text>
          <Text style={styles.body}>Registro rápido de glicemia com lembretes que respeitam seu ritmo. Tudo fica no seu celular.</Text>
        </View>
        <View style={styles.bottom}>
          <ActionButton label="Começar" onPress={() => router.push('/onboarding/name')} />
          <Text style={styles.privacy}>Seus dados nunca saem do seu celular.</Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'space-between', paddingVertical: theme.spacing.xl },
  brandWrap: { alignItems: 'center', gap: theme.spacing.md, marginTop: theme.spacing.xl },
  brand: { fontSize: theme.fontSizes.lg, fontFamily: theme.fonts.bold, color: theme.colors.text, letterSpacing: 1 },
  center: { gap: theme.spacing.md, alignItems: 'center', paddingHorizontal: theme.spacing.md },
  title: { fontSize: 28, fontFamily: theme.fonts.bold, color: theme.colors.text, textAlign: 'center', lineHeight: 34 },
  body: {
    fontSize: theme.fontSizes.md, fontFamily: theme.fonts.regular, color: theme.colors.textMuted,
    textAlign: 'center', lineHeight: 22, maxWidth: 320,
  },
  bottom: { gap: theme.spacing.md, alignItems: 'center' },
  privacy: { fontSize: theme.fontSizes.xs, fontFamily: theme.fonts.regular, color: theme.colors.textMuted, textAlign: 'center' },
});
