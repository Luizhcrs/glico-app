// src/ui/components/ActionButton.tsx
import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { theme } from '@/ui/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ActionButton({
  label, onPress, variant = 'primary', disabled,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'danger';
  disabled?: boolean;
}) {
  const v = variants[variant];
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      onPress={disabled ? undefined : onPress}
      onPressIn={() => { if (!disabled) scale.value = withSpring(0.96, { damping: 18, stiffness: 260 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 14, stiffness: 220 }); }}
      style={[
        styles.btn,
        { backgroundColor: v.bg, opacity: disabled ? 0.5 : 1 },
        animStyle,
      ]}
    >
      <Text style={[styles.txt, { color: v.fg }]}>{label}</Text>
    </AnimatedPressable>
  );
}

const variants = {
  primary: { bg: theme.colors.accent, fg: '#fff' },
  ghost:   { bg: theme.colors.cardBg, fg: theme.colors.text },
  danger:  { bg: theme.colors.danger, fg: '#fff' },
};

const styles = StyleSheet.create({
  btn: {
    paddingVertical: theme.spacing.md + 2,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  txt: { fontSize: theme.fontSizes.md, fontWeight: '600', letterSpacing: 0.2 },
});
