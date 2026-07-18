import * as Device from 'expo-device';
import { Platform, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

export default function HomeScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header với nút đăng nhập */}
        <ThemedView style={styles.header}>
          <ThemedView style={styles.logoContainer}>
            <Ionicons name="school-outline" size={32} color="#007AFF" />
            <ThemedText type="subtitle" style={styles.logoText}>SLMS</ThemedText>
          </ThemedView>
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => router.push('/login')}
          >
            <Ionicons name="log-in-outline" size={20} color="#fff" />
            <ThemedText style={styles.loginText}>Đăng nhập</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        {/* Hero Section */}
        <ThemedView style={styles.heroSection}>
          <ThemedView style={styles.iconCircle}>
            <Ionicons name="rocket-outline" size={48} color="#007AFF" />
          </ThemedView>
          <ThemedText type="title" style={styles.title}>
            Chào mừng đến với SLMS
          </ThemedText>
          <ThemedText type="subtitle" style={styles.subtitle}>
            Hệ thống quản lý học tập thông minh
          </ThemedText>
          <ThemedText style={styles.description}>
            Nền tảng học tập hiện đại, giúp bạn quản lý khóa học, 
            theo dõi tiến độ và đạt được mục tiêu học tập
          </ThemedText>
        </ThemedView>

        {/* Features Grid */}
        <ThemedView type="backgroundElement" style={styles.featuresGrid}>
          <ThemedView style={styles.featureCard}>
            <ThemedView style={styles.featureIcon}>
              <Ionicons name="book-outline" size={28} color="#007AFF" />
            </ThemedView>
            <ThemedText type="defaultSemiBold" style={styles.featureTitle}>
              Khóa học
            </ThemedText>
            <ThemedText type="small" style={styles.featureDesc}>
              15+ khóa học đang diễn ra
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.featureCard}>
            <ThemedView style={styles.featureIcon}>
              <Ionicons name="trending-up-outline" size={28} color="#34C759" />
            </ThemedView>
            <ThemedText type="defaultSemiBold" style={styles.featureTitle}>
              Tiến độ
            </ThemedText>
            <ThemedText type="small" style={styles.featureDesc}>
              85% hoàn thành trung bình
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.featureCard}>
            <ThemedView style={styles.featureIcon}>
              <Ionicons name="clipboard-outline" size={28} color="#FF9500" />
            </ThemedView>
            <ThemedText type="defaultSemiBold" style={styles.featureTitle}>
              Bài tập
            </ThemedText>
            <ThemedText type="small" style={styles.featureDesc}>
              5 bài tập chờ nộp
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.featureCard}>
            <ThemedView style={styles.featureIcon}>
              <Ionicons name="people-outline" size={28} color="#AF52DE" />
            </ThemedView>
            <ThemedText type="defaultSemiBold" style={styles.featureTitle}>
              Cộng đồng
            </ThemedText>
            <ThemedText type="small" style={styles.featureDesc}>
              120+ học viên đang học
            </ThemedText>
          </ThemedView>
        </ThemedView>

        {/* Quick Actions */}
        <ThemedView style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="search-outline" size={22} color="#007AFF" />
            <ThemedText style={styles.actionText}>Tìm kiếm</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="notifications-outline" size={22} color="#007AFF" />
            <ThemedText style={styles.actionText}>Thông báo</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="calendar-outline" size={22} color="#007AFF" />
            <ThemedText style={styles.actionText}>Lịch học</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        {/* Footer */}
        <ThemedView style={styles.footer}>
          <ThemedText type="small" style={styles.footerText}>
            © 2026 SLMS. All rights reserved.
          </ThemedText>
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingVertical: Spacing.two,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#007AFF',
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  loginText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
    paddingVertical: Spacing.four,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 18,
    opacity: 0.8,
  },
  description: {
    textAlign: 'center',
    fontSize: 14,
    opacity: 0.7,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    alignSelf: 'stretch',
    padding: Spacing.three,
    borderRadius: Spacing.four,
    justifyContent: 'space-between',
  },
  featureCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    padding: 16,
    borderRadius: 12,
    gap: 6,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  featureDesc: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignSelf: 'stretch',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  actionText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  footer: {
    paddingVertical: Spacing.two,
    width: '100%',
    alignItems: 'center',
  },
  footerText: {
    opacity: 0.5,
    fontSize: 12,
  },
});