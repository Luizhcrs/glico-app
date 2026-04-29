// app/onboarding/_layout.tsx
import { Stack } from 'expo-router';
import { theme } from '@/ui/theme';
export default function OnboardingLayout() {
  return <Stack screenOptions={{
    headerShown: false,
    contentStyle: { backgroundColor: theme.colors.bg },
  }} />;
}
