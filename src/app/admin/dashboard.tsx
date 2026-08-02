// app/admin/dashboard.tsx
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from '../../a_styles/style_dashboard';

export default function AdminDashboard() {
  const { user, logout } = useAuth(); // Lấy hàm logout từ AuthContext
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    const getUserInfo = () => {
      if (user) {
        setUserName(user.fullName || user.username || 'Admin');
        setUserRole(user.role || 'admin');
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

    const checkRole = () => {
      if (!user) {
        router.replace('/login');
        return;
      }

      if (user.role !== 'admin') {
        router.replace('/login');
      }
    };

    getUserInfo();
    getCurrentDate();
    checkRole();
  }, [user]); // Thêm user vào dependency

  // Hàm xử lý đăng xuất
  const handleLogout = async () => {
    try {
      await logout(); // Sử dụng hàm logout từ AuthContext
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toggleProfileMenu = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  // Lấy avatar từ user
  const avatar = user?.avatar || 'https://via.placeholder.com/40';

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top', 'right']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{userName.toLocaleUpperCase()} - {userRole.toUpperCase()}</Text>
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
              <Image
                source={{ uri: avatar }}
                style={styles.avatar}
              />
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
              onPress={() => router.push('/admin/admin-management' as any)}
            >
              <View style={styles.menuIconWrapper}>
                <Ionicons name="person-outline" size={32} color="#e6250c" />
              </View>
              <Text style={styles.menuTitle}>Quản lí tài khoản Admin</Text>
              <Text style={styles.menuDesc}>Tạo tài khoản Admin</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuCard}
              onPress={() => router.push('/admin/faculties' as any)}
            >
              <View style={styles.menuIconWrapper}>
                <Ionicons name="school-outline" size={32} color="#0a3ee8" />
              </View>
              <Text style={styles.menuTitle}>Quản lý Khoa và Ngành</Text>
              <Text style={styles.menuDesc}>Thêm, sửa, xóa khoa và ngành</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuCard}
              onPress={() => router.push('/admin/courses')}
            >
              <View style={styles.menuIconWrapper}>
                <Ionicons name="book-outline" size={32} color="#f92408" />
              </View>
              <Text style={styles.menuTitle}>Quản lý môn học</Text>
              <Text style={styles.menuDesc}>Thêm, sửa, xóa môn học</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuCard}
              onPress={() => router.push('/admin/create-student')}
            >
              <View style={styles.menuIconWrapper}>
                <Ionicons name="person-add-outline" size={32} color="#2fba42" />
              </View>
              <Text style={styles.menuTitle}>Tạo tài khoản sinh viên</Text>
              <Text style={styles.menuDesc}>Tạo tài khoản mới cho sinh viên</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuCard}
              onPress={() => router.push('/admin/attendance-history' as any)}
            >
              <View style={styles.menuIconWrapper}>
                <Ionicons name="checkmark-done-circle" size={32} color="#24cd37" />
              </View>
              <Text style={styles.menuTitle}>Điểm danh môn học</Text>
              <Text style={styles.menuDesc}>Xem lịch sử điểm danh môn học</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuCard}
              onPress={() => router.push('/admin/student-management')}
            >
              <View style={styles.menuIconWrapper}>
                <Ionicons name="list-circle" size={32} color="#4A90E2" />
              </View>
              <Text style={styles.menuTitle}>Danh sách tài khoản sinh viên</Text>
              <Text style={styles.menuDesc}>Xem và quản lý tài khoản sinh viên</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuCard}
              onPress={() => router.push('/admin/schedule')}
            >
              <View style={styles.menuIconWrapper}>
                <Ionicons name="calendar-outline" size={32} color="#ef6b0c" />
              </View>
              <Text style={styles.menuTitle}>Quản lý lịch học</Text>
              <Text style={styles.menuDesc}>Xếp lịch học cho sinh viên</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuCard}
              onPress={() => router.push('/admin/FeedbackManagementScreen')}
            >
              <View style={styles.menuIconWrapper}>
                <Ionicons name="chatbox-ellipses" size={32} color="#16d6e0" />
              </View>
              <Text style={styles.menuTitle}>Quản lý Góp ý</Text>
              <Text style={styles.menuDesc}>Góp ý sinh viên</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuCard}
              onPress={() => router.push('/admin/mng_frameworkprogram' as any)}
            >
              <View style={styles.menuIconWrapper}>
                <Ionicons name="library-outline" size={32} color="#16d6e0" />
              </View>
              <Text style={styles.menuTitle}>Quản lý chương trình khung</Text>
              <Text style={styles.menuDesc}>Chương trình khung</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuCard}
              onPress={() => router.push('/admin/training-points')}
            >
              <View style={styles.menuIconWrapper}>
                <Ionicons name="ribbon-outline" size={32} color="#9b59b6" />
              </View>
              <Text style={styles.menuTitle}>Điểm rèn luyện</Text>
              <Text style={styles.menuDesc}>Chấm điểm cho sinh viên</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuCard}
              onPress={() => router.push({ pathname: '/admin/student-achievements' as any })}
            >
              <View style={styles.menuIconWrapper}>
                <Ionicons name="trophy-outline" size={32} color="#f5a623" />
              </View>
              <Text style={styles.menuTitle}>Quản lý thành tích</Text>
              <Text style={styles.menuDesc}>Nhập điểm và xem xếp loại sinh viên</Text>
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
                <Image
                  source={{ uri: avatar }}
                  style={styles.avatar}
                />
                <View>
                  <Text style={styles.profileName}>{userName}</Text>
                  <Text style={styles.profileRole}>Quản trị viên</Text>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.menuItem} 
                onPress={() => router.push('/admin/AdminProfileScreen' as any)}
              >
                <Ionicons name="person-outline" size={22} color="#333" />
                <Text style={styles.menuItemText}>Thông tin cá nhân</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.menuItem} 
                onPress={() => router.push('/admin/AD_ChangePasswordScreen' as any)}
              >
                <Ionicons name="lock-closed-outline" size={22} color="#333" />
                <Text style={styles.menuItemText}>Đổi mật khẩu</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.menuItem, styles.logoutItem]} 
                onPress={handleLogout}
              >
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