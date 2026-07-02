import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router'; // ✅ Thêm useLocalSearchParams
import { styles } from '../../../a_styles/style_student_info';
import { API_URL } from '../../../config/api';
import { useAuth } from '../../../contexts/AuthContext';

export default function StudentInfoScreen() {
  const { user } = useAuth();

  // ✅ Lấy tham số 'view' xem người dùng đang muốn mở gì ('info' hay 'password')
  const { view } = useLocalSearchParams();

  // --- State cho Thông tin sinh viên ---
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // --- State cho Đổi mật khẩu ---
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (user?.studentId && view !== 'password') {
      loadStudent();
    }
  }, [user, view]);

  const loadStudent = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/students/${user?.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        setStudent(data.student);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert('Thông báo', 'Vui lòng điền đầy đủ thông tin!');
      return;
    }
    if (newPassword.length < 5) {
      Alert.alert('Thông báo', 'Mật khẩu mới phải có ít nhất 5 ký tự!');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu mới và xác nhận mật khẩu không khớp!');
      return;
    }

    try {
      setPasswordLoading(true);
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ oldPassword, newPassword })
      });
      const data = await response.json();

      if (response.ok && data.success) {
        Alert.alert('Thành công', 'Đổi mật khẩu thành công!');
        setOldPassword(''); setNewPassword(''); setConfirmPassword('');
        router.back();
      } else {
        Alert.alert('Lỗi', data.message || 'Đổi mật khẩu thất bại!');
      }
    } catch (error) {
      Alert.alert('Lỗi kết nối', 'Không thể kết nối đến server.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleback = () => {
    router.back();
  };

  const studentInfo = [
    { label: 'Trạng thái', value: student?.status === 'active' ? 'Đang học' : 'Nghỉ học' },
    { label: 'Họ và tên', value: student?.fullName ?? '' },
    { label: 'MSSV', value: student?.studentId ?? '' },
    { label: 'Giới tính', value: student?.gender ?? '' },
    { label: 'Ngày sinh', value: student?.dateOfBirth ?? '' },
    { label: 'Lớp', value: student?.class ?? '' },
    { label: 'Khoa', value: student?.facultyId?.name ?? '' },
    { label: 'Chuyên ngành', value: student?.departmentId?.name ?? '' },
  ];

  // ==========================================
  // GIAO DIỆN 1: NẾU TRUYỀN VÀO view='password'
  // ==========================================
  if (view === 'password') {
    return (
      <SafeAreaView style={localStyles.container}>
        <View style={localStyles.header}>
          <TouchableOpacity onPress={handleback}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={localStyles.headerTitle}>Đổi mật khẩu</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={localStyles.formContainer}>
          <TextInput
            style={localStyles.input}
            placeholder="Mật khẩu hiện tại"
            secureTextEntry
            value={oldPassword}
            onChangeText={setOldPassword}
            editable={!passwordLoading}
          />
          <TextInput
            style={localStyles.input}
            placeholder="Mật khẩu mới"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
            editable={!passwordLoading}
          />
          <TextInput
            style={localStyles.input}
            placeholder="Xác nhận mật khẩu mới"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            editable={!passwordLoading}
          />

          <TouchableOpacity
            style={[localStyles.button, passwordLoading && localStyles.buttonDisabled]}
            onPress={handleChangePassword}
            disabled={passwordLoading}
          >
            {passwordLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={localStyles.buttonText}>Xác nhận</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ==========================================
  // GIAO DIỆN 2: MẶC ĐỊNH LÀ XEM THÔNG TIN SINH VIÊN
  // ==========================================
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#214D8A" />
          <Text>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleback}>
          <Ionicons name='arrow-back' size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông tin sinh viên</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.avatarContainer}>
            <Image
              source={
                student?.avatar
                  ? { uri: student.avatar }
                  : require('../../../../assets/images/Nhan_imported_image/account_circle_withbackground.png')
              }
              style={styles.avatar}
            />
          </View>
          <Text style={styles.name}>{student?.fullName}</Text>
          <Text style={styles.studentId}>MSSV: {student?.studentId}</Text>

          <View style={styles.infoContainer}>
            {studentInfo.map((item, index) => (
              <View key={index} style={styles.row}>
                <Text style={styles.label}>{item.label}</Text>
                <Text style={styles.value}>{item.value}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// CSS dành riêng cho phần đổi mật khẩu
const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  formContainer: {
    padding: 16,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 15,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#4285F4',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#A0AEC0',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});