// src/ui/components/BrandLogo.tsx
import React from 'react';
import { Image, View, StyleSheet } from 'react-native';
import { theme } from '@/ui/theme';

const ICON_SOURCE = require('../../../assets/icon.png');

interface Props {
  size?: number;
  withShadow?: boolean;
}

export function BrandLogo({ size = 56, withShadow = true }: Props) {
  return (
    <View style={[
      withShadow && {
        shadowColor: theme.colors.accent,
        shadowOpacity: 0.25,
        shadowRadius: size / 4,
        shadowOffset: { width: 0, height: size / 8 },
        elevation: 4,
        borderRadius: size * 0.226,
      },
    ]}>
      <Image
        source={ICON_SOURCE}
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.226,
        }}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({});
