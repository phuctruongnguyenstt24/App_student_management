// app/_layout.tsx
import React, { useMemo, useEffect } from 'react';
import { Stack, router, useSegments } from 'expo-router';
import {
  Provider as PaperProvider,
  MD3LightTheme,
  MD3DarkTheme,
} from 'react-native-paper';
import { ActivityIndicator, View } from 'react-native';

import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { FieldsProvider } from '../contexts/FieldsContext';

// Component kiểm tra auth trước khi render
function AuthCheck({ children }: { children: React.ReactNode }) {
  const { user, token, isLoading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'login';
    
    console.log('🔍 AuthCheck - user:', !!user, 'token:', !!token, 'inAuthGroup:', inAuthGroup);

    // Nếu chưa đăng nhập và không ở trang auth -> chuyển đến login
    if ((!user || !token) && !inAuthGroup) {
      console.log('🔒 Chuyển đến login');
      router.replace('/login');
    } 
    // Nếu đã đăng nhập và đang ở trang auth -> chuyển đến trang chính
    else if (user && token && inAuthGroup) {
      const targetRoute = user.role === 'admin' ? '/admin/dashboard' : '/';
      console.log('✅ Chuyển đến', targetRoute);
      router.replace(targetRoute);
    }
  }, [user, token, isLoading, segments]);

  // Hiển thị loading khi đang kiểm tra
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return <>{children}</>;
}

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
      <AuthCheck>
        <Stack
          initialRouteName="index"
          screenOptions={{
            headerShown: false,
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
            name="index" 
            options={{ headerShown: false }} 
          />
          
          <Stack.Screen
            name="login"
            options={{ headerShown: false }}
          />

        </Stack>
      </AuthCheck>
    </PaperProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <FieldsProvider>
          <RootLayoutNav />
        </FieldsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}