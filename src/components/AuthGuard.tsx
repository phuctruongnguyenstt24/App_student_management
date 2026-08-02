// components/AuthGuard.tsx
import { useEffect } from 'react';
import { router, useSegments } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { ActivityIndicator, View } from 'react-native';
import { ThemedView } from './themed-view';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading, token } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    // Kiểm tra xem có đang ở trong nhóm auth routes không
    const inAuthGroup = segments[0] === 'login' ;
    
    // Nếu chưa đăng nhập (không có user hoặc token) và không ở trang auth
    if ((!user || !token) && !inAuthGroup) {
      router.replace('/login');
    } 
    // Nếu đã đăng nhập và đang ở trang auth
    else if (user && token && inAuthGroup) {
      // Chuyển hướng dựa trên role
      const targetRoute = user.role === 'admin' ? '/admin/dashboard' : '/';
      router.replace(targetRoute);
    }
  }, [user, token, isLoading, segments]);

  // Hiển thị loading khi đang kiểm tra
  if (isLoading) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </ThemedView>
    );
  }

  return <>{children}</>;
}