// app/admin/_layout.tsx
import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack>
      <Stack.Screen name="dashboard" options={{ title: 'Admin Dashboard' }} />
      <Stack.Screen name="students" options={{ title: 'Quản lý sinh viên' }} />
      <Stack.Screen name="create-student" options={{ title: 'Tạo tài khoản sinh viên' }} />
      <Stack.Screen name="courses" options={{ title: 'Quản lý môn học' }} />
    </Stack>
  );
}