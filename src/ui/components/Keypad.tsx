// src/ui/components/Keypad.tsx
import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { theme } from '@/ui/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface KeyProps {
  k: string;
  onPress: (k: string) => void;
}

function Key({ k, onPress }: KeyProps) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const isAction = k === '✓' || k === '⌫';
  return (
    <AnimatedPressable
      style={[styles.key, isAction && styles.keyAction, animStyle]}
      onPressIn={() => {
        scale.value = withSpring(0.92, { damping: 15, stiffness: 360 });
        Haptics.selectionAsync().catch(() => {});
      }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 12, stiffness: 200 }); }}
      onPress={() => onPress(k)}
    >
      <Text style={[styles.txt, isAction && styles.txtAction]}>{k}</Text>
    </AnimatedPressable>
  );
}

export function Keypad({
  value, onChange, onConfirm, maxLength = 3,
}: {
  value: string;
  onChange: (next: string) => void;
  onConfirm: () => void;
  maxLength?: number;
}) {
  const press = (k: string) => {
    if (k === '⌫') return onChange(value.slice(0, -1));
    if (k === '✓') return onConfirm();
    if (value.length >= maxLength) return;
    onChange(value + k);
  };
  const keys = ['1','2','3','4','5','6','7','8','9','⌫','0','✓'];
  return (
    <View style={styles.grid}>
      {keys.map((k) => <Key key={k} k={k} onPress={press} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, justifyContent: 'center' },
  key: {
    width: '31%',
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  keyAction: { backgroundColor: theme.colors.cardBg },
  txt: { fontSize: theme.fontSizes.xl, fontWeight: '500', color: theme.colors.text },
  txtAction: { color: theme.colors.accent, fontWeight: '600' },
});
