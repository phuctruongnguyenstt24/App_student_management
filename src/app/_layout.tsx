import React, { useMemo } from 'react';
import { Stack } from 'expo-router';
import {
  Provider as PaperProvider,
  MD3LightTheme,
  MD3DarkTheme,
} from 'react-native-paper';

import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';

function RootLayoutNav() {
  const { theme } = useTheme();

  const paperTheme = useMemo(() => {
    return theme === 'dark'
      ? {
          ...MD3DarkTheme,
          colors: {
            ...MD3DarkTheme.colors,
            primary: '#4a90e2',
          },
        }
      : {
          ...MD3LightTheme,
          colors: {
            ...MD3LightTheme.colors,
            primary: '#4a90e2',
          },
        };
  }, [theme]);

  return (
    <PaperProvider theme={paperTheme}>
      <Stack
        screenOptions={{
          headerShown:false,
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
        <Stack.Screen
          name="login"
          options={{ headerShown: false }}
        />
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