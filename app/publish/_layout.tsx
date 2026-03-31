import { Stack } from 'expo-router';
import { useThemeColors } from '../../hooks/useThemeColors';

export default function PublishLayout() {
  const tc = useThemeColors();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: tc.bg },
      }}
    />
  );
}
