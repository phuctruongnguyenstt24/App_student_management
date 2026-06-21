// app/_layout.tsx - Simplified version (no NavigationThemeProvider)
import React from 'react';
import { Stack } from 'expo-router';
import { Provider as PaperProvider, DefaultTheme, MD3DarkTheme } from 'react-native-paper';
import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';

function RootLayoutNav() {
  const { theme } = useTheme();
  const paperTheme = theme === 'dark' ? MD3DarkTheme : DefaultTheme;

  return (
    <PaperProvider theme={paperTheme}>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: paperTheme.colors.surface,
          },
          headerTitleStyle: {
            color: paperTheme.colors.onSurface,
          },
          headerTintColor: paperTheme.colors.primary,
          contentStyle: {
            backgroundColor: paperTheme.colors.background,
          },
        }}
      >
        <Stack.Screen name="login" options={{ headerShown: false }} />
       
      </Stack>
    </PaperProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </ThemeProvider>
  );
}