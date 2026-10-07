import { DarkTheme, Stack, ThemeProvider } from 'expo-router';

export default function TabLayout() {
  return (
    <ThemeProvider value={DarkTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ headerShown: true, headerTitle: "Android TVs" }} />
        <Stack.Screen name="remote" />
      </Stack>
    </ThemeProvider>
  );
}
