// src/ui/components/Screen.tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { theme } from '@/ui/theme';

interface ScreenProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: { label: string; onPress: () => void };
  scroll?: boolean;
  bg?: string;
  contentStyle?: object;
  children: React.ReactNode;
}

export function Screen({
  title,
  showBack,
  onBack,
  rightAction,
  scroll = true,
  bg = theme.colors.bg,
  contentStyle,
  children,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const Container: React.ComponentType<any> = scroll ? ScrollView : View;

  return (
    <View style={[styles.root, { backgroundColor: bg, paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={bg} />
      {(title || showBack || rightAction) && (
        <View style={styles.header}>
          {showBack ? (
            <Pressable onPress={onBack ?? (() => router.back())} hitSlop={12} style={styles.backBtn}>
              <ChevronLeft size={26} color={theme.colors.text} strokeWidth={2.2} />
            </Pressable>
          ) : <View style={styles.spacer} />}
          {title ? <Text style={styles.title} numberOfLines={1}>{title}</Text> : <View style={{ flex: 1 }} />}
          {rightAction ? (
            <Pressable onPress={rightAction.onPress} hitSlop={8} style={styles.rightBtn}>
              <Text style={styles.rightTxt}>{rightAction.label}</Text>
            </Pressable>
          ) : <View style={styles.spacer} />}
        </View>
      )}
      <Container
        {...(scroll
          ? { contentContainerStyle: [styles.content, { paddingBottom: insets.bottom + theme.spacing.xl }, contentStyle] }
          : { style: [styles.content, styles.contentFill, { paddingBottom: insets.bottom + theme.spacing.xl }, contentStyle] }
        )}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </Container>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    minHeight: 48,
  },
  spacer: { width: 44 },
  backBtn: {
    width: 44, height: 44, alignItems: 'center', justifyContent: 'center',
  },
  title: {
    flex: 1, textAlign: 'center', fontSize: theme.fontSizes.md,
    fontFamily: theme.fonts.semibold,
    color: theme.colors.text,
  },
  rightBtn: {
    height: 44, paddingHorizontal: theme.spacing.md,
    alignItems: 'center', justifyContent: 'center',
  },
  rightTxt: {
    color: theme.colors.accent, fontSize: theme.fontSizes.sm,
    fontFamily: theme.fonts.semibold,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  contentFill: { flex: 1 },
});
