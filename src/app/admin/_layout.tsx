// app/admin/_layout.tsx
import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="dashboard" options={{ title: 'Admin Dashboard' }} />
      <Stack.Screen name="create-student" options={{ title: 'Tạo tài khoản sinh viên' }} />
      <Stack.Screen name="student-management" options={{ title: 'Danh sách tài khoản sinh viên' }} />
      <Stack.Screen name="courses" options={{ title: 'Quản lý môn học' }} />
      <Stack.Screen name="schedule" options={{ title: 'Quản lý lịch học' }} />
      <Stack.Screen name="FeedbackManagementScreen" options={{ title: 'Quản lý Góp ý' }} />
      <Stack.Screen name="mng_frameworkprogram" options={{ title: 'Quản lý Chương trình khung' }} />
      <Stack.Screen name="student-achievements" options={{ title: 'Quản lý thành tích' }} />
    </Stack>
  );
}