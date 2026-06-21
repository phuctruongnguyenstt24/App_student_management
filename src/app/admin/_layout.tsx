// app/admin/_layout.tsx
import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack screenOptions={{headerShown:false}}>
      <Stack.Screen name="dashboard" options={{ title: 'Admin Dashboard' }} />
      
      <Stack.Screen name="create-student" options={{ title: 'Tạo tài khoản sinh viên' }} />
      <Stack.Screen name="courses" options={{ title: 'Quản lý môn học' }} />
    </Stack>
  );
}