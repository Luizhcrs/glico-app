// src/ui/components/SwipeableMeasurementRow.tsx
//
// Linha de medição com swipe horizontal pra revelar ação de exclusão.
// Tap normal continua abrindo o sheet de edição.
//
import React, { useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { Trash2 } from 'lucide-react-native';
import { format } from 'date-fns';
import { theme } from '@/ui/theme';
import type { Measurement, GlucoseContext } from '@/domain/types';

const CONTEXT_LABEL: Record<GlucoseContext, string> = {
  fasting: 'Jejum',
  pre_meal: 'Pré-refeição',
  post_meal: 'Pós-refeição',
  bedtime: 'Antes de dormir',
  exercise: 'Exercício',
  hypo: 'Hipo',
  random: 'Aleatório',
};

interface Props {
  measurement: Measurement;
  valueColor: string;
  insulinHint?: string;
  isLast?: boolean;
  onPress: () => void;
  onDelete: () => void;
}

export function SwipeableMeasurementRow({
  measurement, valueColor, insulinHint, isLast, onPress, onDelete,
}: Props) {
  const ref = useRef<Swipeable>(null);

  const renderRightAction = (progress: Animated.AnimatedInterpolation<number>) => {
    const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1], extrapolate: 'clamp' });
    return (
      <Pressable
        onPress={() => { ref.current?.close(); onDelete(); }}
        style={styles.deleteAction}
      >
        <Animated.View style={{ transform: [{ scale }], alignItems: 'center', gap: 4 }}>
          <Trash2 size={20} color="#fff" strokeWidth={2.2} />
          <Text style={styles.deleteTxt}>Excluir</Text>
        </Animated.View>
      </Pressable>
    );
  };

  return (
    <Swipeable
      ref={ref}
      renderRightActions={renderRightAction}
      rightThreshold={48}
      onSwipeableWillOpen={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }}
      overshootRight={false}
      friction={1.6}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.row,
          !isLast && styles.rowBorder,
          pressed && { opacity: 0.6 },
        ]}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTime}>{format(new Date(measurement.measuredAt), 'HH:mm')}</Text>
          <Text style={styles.rowCtx}>
            {CONTEXT_LABEL[measurement.context]}
            {insulinHint ? ` · ${insulinHint}` : ''}
            {measurement.note ? ' · com nota' : ''}
          </Text>
        </View>
        <Text style={[styles.rowValue, { color: valueColor }]}>{measurement.valueMgdl}</Text>
      </Pressable>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: theme.spacing.md, paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border },
  rowTime: { color: theme.colors.text, fontSize: theme.fontSizes.md, fontFamily: theme.fonts.semibold },
  rowCtx: { color: theme.colors.textMuted, fontSize: theme.fontSizes.xs, fontFamily: theme.fonts.regular, marginTop: 2 },
  rowValue: { fontSize: theme.fontSizes.lg, fontFamily: theme.fonts.bold, fontVariant: ['tabular-nums'] },
  deleteAction: {
    backgroundColor: theme.colors.danger,
    width: 96,
    alignItems: 'center', justifyContent: 'center',
  },
  deleteTxt: { color: '#fff', fontFamily: theme.fonts.semibold, fontSize: theme.fontSizes.xs, letterSpacing: 0.4 },
});
