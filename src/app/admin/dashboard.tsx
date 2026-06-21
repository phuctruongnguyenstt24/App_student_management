// app/admin/dashboard.tsx
import { View, Text, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';
import { styles } from '../../a_styles/style_dashboard';
import { Ionicons } from '@expo/vector-icons';

export default function AdminDashboard() {
  const [userName, setUserName] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    const getUserInfo = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          setUserName(user.fullName || user.username || 'Admin');
        }
      } catch (error) {
        console.error('Error getting user info:', error);
      }
    };

    const getCurrentDate = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      };
      setCurrentDate(now.toLocaleDateString('vi-VN', options));
    };

    getUserInfo();
    getCurrentDate();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    router.replace('/login');
  };

  const toggleProfileMenu = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  return (
    <SafeAreaView style={styles.safeContainer} edges={['left','right']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Xin chào, {userName}</Text>
            <Text style={styles.dateText}>{currentDate}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.notificationButton}>
              <Ionicons name="notifications-outline" size={28} color="#333" />
              <View style={styles.notificationBadge}>
                <Text style={styles.badgeText}>3</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleProfileMenu}>
              <Ionicons name="person-circle-outline" size={40} color="#4A90E2" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Body - Main Content */}
        <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
          <View style={styles.sectionHeader}>
            <Ionicons name="grid-outline" size={24} color="#4A90E2" />
            <Text style={styles.sectionTitle}>Trang chủ</Text>
          </View>

          <View style={styles.menuGrid}>
            <TouchableOpacity 
              style={styles.menuCard}
              onPress={() => router.push('/admin/create-student')}
            >
              <View style={styles.menuIconWrapper}>
                <Ionicons name="person-add-outline" size={32} color="#4A90E2" />
              </View>
              <Text style={styles.menuTitle}>Tạo tài khoản</Text>
              <Text style={styles.menuDesc}>Tạo tài khoản mới cho sinh viên</Text>
            </TouchableOpacity>

       

            <TouchableOpacity 
              style={styles.menuCard}
              onPress={() => router.push('/admin/courses')}
            >
              <View style={styles.menuIconWrapper}>
                <Ionicons name="book-outline" size={32} color="#4A90E2" />
              </View>
              <Text style={styles.menuTitle}>Quản lý môn học</Text>
              <Text style={styles.menuDesc}>Thêm, sửa, xóa môn học</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuCard}
              onPress={() => router.push('/admin/schedule')}
            >
              <View style={styles.menuIconWrapper}>
                <Ionicons name="calendar-outline" size={32} color="#4A90E2" />
              </View>
              <Text style={styles.menuTitle}>Quản lý lịch học</Text>
              <Text style={styles.menuDesc}>Xếp lịch học cho sinh viên</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Profile Menu Popup */}
        {showProfileMenu && (
          <TouchableOpacity 
            style={styles.overlay} 
            activeOpacity={1} 
            onPress={toggleProfileMenu}
          >
            <View style={styles.profileMenu}>
              <View style={styles.profileHeader}>
                <Ionicons name="person-circle-outline" size={60} color="#4A90E2" />
                <View>
                  <Text style={styles.profileName}>{userName}</Text>
                  <Text style={styles.profileRole}>Quản trị viên</Text>
                </View>
              </View>
              
              <TouchableOpacity style={styles.menuItem}>
                <Ionicons name="person-outline" size={22} color="#333" />
                <Text style={styles.menuItemText}>Thông tin cá nhân</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.menuItem}>
                <Ionicons name="settings-outline" size={22} color="#333" />
                <Text style={styles.menuItemText}>Tùy chỉnh</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.menuItem}>
                <Ionicons name="lock-closed-outline" size={22} color="#333" />
                <Text style={styles.menuItemText}>Đổi mật khẩu</Text>
              </TouchableOpacity>
              
              <View style={styles.divider} />
              
              <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={22} color="#dc3545" />
                <Text style={[styles.menuItemText, styles.logoutText]}>Đăng xuất</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.footerItem} onPress={() => router.push('/admin/dashboard')}>
            <Ionicons name="home" size={28} color="#4A90E2" />
            <Text style={[styles.footerLabel, styles.footerLabelActive]}>Trang chủ</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.footerItem} onPress={toggleProfileMenu}>
            <Ionicons name="person-outline" size={28} color="#888" />
            <Text style={styles.footerLabel}>Cá nhân</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}