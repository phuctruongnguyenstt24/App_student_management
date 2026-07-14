// app/(tabs)/_layout.tsx
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#007AFF',
      }}
    >
      <Tabs.Screen
        name="HomeScreen"
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="ScheduleScreen"
        options={{
          title: 'Lịch học',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="AttendanceScreen"
        options={{
          title: 'Điểm danh',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="checkmark-circle-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="ProfileScreen"
        options={{
          title: 'Cá nhân',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          href: null,
        }}
      />

      {/* href: null, ==> ẩn tab NewsScreen khỏi tabBar */}
      <Tabs.Screen
        name="NewsScreen"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="screens-for-profile/StudentInfoScreen"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="screens-for-profile/ChangePasswordScreen"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="screens-for-profile/FeedbackScreen"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="screens-for-profile/TermsScreen"
        options={{
          href: null,
        }}
      />

      {/* 🚀 Code đã được gộp chuẩn: Giữ cả AllFeatures, Curriculum và TrainingPoint */}
      <Tabs.Screen
        name="AllFeaturesScreen"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="CurriculumStudentScreen"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="TrainingPointScreen"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}