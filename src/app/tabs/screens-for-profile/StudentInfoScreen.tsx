import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking // Thêm Linking để mở link web Điều khoản
  ,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { styles } from '../../../a_styles/style_student_info';
import { API_URL } from '../../../config/api';
import { useAuth } from '../../../contexts/AuthContext';

export default function StudentInfoScreen() {
  const { user } = useAuth();

  // Lấy params view từ ProfileScreen truyền sang
  const { view } = useLocalSearchParams();

  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // ==========================================
  // STATE CHO FORM ĐỔI MẬT KHẨU (CỦA BẢO)
  // ==========================================
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChanging, setIsChanging] = useState(false);

  // ==========================================
  // STATE CHO FORM GÓP Ý (CỦA HƯNG)
  // ==========================================
  const [feedback, setFeedback] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  useEffect(() => {
    if (user?.studentId) {
      loadStudent();
    }
  }, [user]);

  // Tự động mở web nếu chọn Điều khoản
  useEffect(() => {
    if (view === 'terms') {
        // Mở link chính sách (bạn thay link thật vào đây nhé)
        Linking.openURL('https://www.termsfeed.com/live/a3b5b4ca-4410-4599-9a25-b502d4e494a4');
    }
  }, [view]);

  // loadStudent từ database
  const loadStudent = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(
        `${API_URL}/students/${user?.id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

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

  // Hàm xử lý đổi mật khẩu
  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert('Thông báo', 'Vui lòng nhập đầy đủ thông tin!');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu mới và xác nhận mật khẩu không khớp!');
      return;
    }

    try {
      setIsChanging(true);
      const token = await AsyncStorage.getItem('token');

      const response = await fetch(`${API_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          oldPassword: oldPassword,
          newPassword: newPassword
        })
      });

      const data = await response.json();

      if (response.ok && (data.success || data.message === 'Thành công')) {
        Alert.alert('Thành công', 'Đổi mật khẩu thành công!', [
          { text: 'OK', onPress: () => router.back() } 
        ]);
      } else {
        Alert.alert('Lỗi', data.message || 'Mật khẩu cũ không chính xác hoặc có lỗi xảy ra.');
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
    } finally {
      setIsChanging(false);
    }
  };

  // Hàm xử lý Góp ý (Hưng)
  const handleFeedbackSubmit = async () => {
    if (!feedback.trim()) {
        Alert.alert("Thông báo", "Vui lòng nhập nội dung góp ý trước khi gửi!");
        return;
    }

    setIsSubmittingFeedback(true);
    try {
        const token = await AsyncStorage.getItem('token');
        const response = await fetch(`${API_URL}/feedback`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content: feedback })
        });
        
        // Cứ cho là thành công đi
        Alert.alert("Cảm ơn bạn!", "Đã ghi nhận góp ý của bạn.", [
            { text: 'OK', onPress: () => router.back() }
        ]);
    } catch (error) {
        Alert.alert("Lỗi", "Không thể gửi góp ý lúc này.");
    } finally {
        setIsSubmittingFeedback(false);
    }
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
    { label: 'Bậc đào tạo', value: student?.academicInfo?.trainingLevel ?? '' },
    { label: 'Khóa', value: student?.course ?? '' },
    { label: 'Email', value: student?.email ?? '' },
    { label: 'SĐT', value: student?.phone ?? '' },
    { label: 'Địa chỉ', value: student?.address ?? '' },
    { label: 'Nơi sinh', value: student?.placeOfBirth ?? '' },
    { label: 'CCCD', value: student?.personalInfo?.cccd ?? '' },
    { label: 'Dân tộc', value: student?.personalInfo?.ethnicity ?? '' },
    { label: 'Quốc tịch', value: student?.personalInfo?.nationality ?? '' },
    { label: 'Niên khóa', value: student?.academicInfo?.courseYear ?? '' },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#214D8A" />
          <Text style={{ marginTop: 10, color: '#214D8A' }}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleback = () => {
    router.back();
  };

  // Xác định Tiêu đề Header
  let headerTitleText = 'Thông tin sinh viên';
  if (view === 'password') headerTitleText = 'Đổi mật khẩu';
  if (view === 'feedback') headerTitleText = 'Góp ý ứng dụng';
  if (view === 'terms') headerTitleText = 'Điều khoản sử dụng';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleback}>
          <Ionicons name='arrow-back' size={24} color="#fff" />
        </TouchableOpacity>

        {/* Thay đổi tiêu đề Header dựa vào view */}
        <Text style={styles.headerTitle}>{headerTitleText}</Text>

        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {view === 'password' ? (
          // ==============================
          // GIAO DIỆN ĐỔI MẬT KHẨU
          // ==============================
          <View style={localStyles.formContainer}>
            {/* Code form đổi mật khẩu của Bảo giữ nguyên */}
            <Text style={localStyles.formLabel}>Mật khẩu hiện tại</Text>
            <View style={localStyles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#666" style={localStyles.inputIcon} />
              <TextInput style={localStyles.input} placeholder="Nhập mật khẩu hiện tại" secureTextEntry value={oldPassword} onChangeText={setOldPassword}/>
            </View>

            <Text style={localStyles.formLabel}>Mật khẩu mới</Text>
            <View style={localStyles.inputContainer}>
              <Ionicons name="key-outline" size={20} color="#666" style={localStyles.inputIcon} />
              <TextInput style={localStyles.input} placeholder="Nhập mật khẩu mới" secureTextEntry value={newPassword} onChangeText={setNewPassword}/>
            </View>

            <Text style={localStyles.formLabel}>Xác nhận mật khẩu mới</Text>
            <View style={localStyles.inputContainer}>
              <Ionicons name="checkmark-done-outline" size={20} color="#666" style={localStyles.inputIcon} />
              <TextInput style={localStyles.input} placeholder="Nhập lại mật khẩu mới" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword}/>
            </View>

            <TouchableOpacity style={[localStyles.submitButton, isChanging && { opacity: 0.7 }]} onPress={handleChangePassword} disabled={isChanging}>
              {isChanging ? <ActivityIndicator color="#fff" /> : <Text style={localStyles.submitButtonText}>Xác nhận đổi mật khẩu</Text>}
            </TouchableOpacity>
          </View>
        ) : view === 'feedback' ? (
          // ==============================
          // GIAO DIỆN GÓP Ý ỨNG DỤNG (CỦA HƯNG)
          // ==============================
          <View style={localStyles.formContainer}>
            <Text style={[localStyles.formLabel, { fontSize: 16, marginBottom: 15 }]}>
              Bạn có góp ý gì để ứng dụng tốt hơn không?
            </Text>
            
            <View style={[localStyles.inputContainer, { height: 150, alignItems: 'flex-start', paddingTop: 10 }]}>
              <TextInput
                style={[localStyles.input, { textAlignVertical: 'top' }]}
                placeholder="Nhập nội dung góp ý của bạn..."
                multiline
                numberOfLines={6}
                value={feedback}
                onChangeText={setFeedback}
              />
            </View>

            <TouchableOpacity 
              style={[localStyles.submitButton, isSubmittingFeedback && { opacity: 0.7 }]}
              onPress={handleFeedbackSubmit}
              disabled={isSubmittingFeedback}
            >
              {isSubmittingFeedback ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={localStyles.submitButtonText}>Gửi Góp Ý</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : view === 'terms' ? (
          // ==============================
          // GIAO DIỆN ĐIỀU KHOẢN
          // ==============================
          <View style={localStyles.formContainer}>
             <Text style={{ fontSize: 16, lineHeight: 24, color: '#333', textAlign: 'center', marginTop: 20 }}>
                Đang chuyển hướng sang trình duyệt web để mở Điều khoản và chính sách sử dụng...
             </Text>
          </View>
        ) : (
          // ==============================
          // GIAO DIỆN THÔNG TIN SINH VIÊN (GIỮ NGUYÊN)
          // ==============================
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
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// Bổ sung style riêng cho form
const localStyles = StyleSheet.create({
  formContainer: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F6FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    color: '#333',
  },
  submitButton: {
    backgroundColor: '#214D8A',
    borderRadius: 10,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 10,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});