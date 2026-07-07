// screens/StudentInfoScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
// import style từ globalStyles ==> đề dùng layout chung cho phần đầu app (đầu app đồng bộ ui với nhau)
import { styles as globalStyles } from '../../../a_styles/style_student_info';
import { API_URL } from '../../../config/api';
import { useAuth } from '../../../contexts/AuthContext';

export default function StudentInfoScreen() {
  const { user } = useAuth();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.studentId) {
      loadStudent();
    }
  }, [user]);

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

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <SafeAreaView style={globalStyles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#214D8A" />
          <Text style={{ marginTop: 10, color: '#214D8A' }}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={globalStyles.container}>
      <View style={globalStyles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name='arrow-back' size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={globalStyles.headerTitle}>Thông tin sinh viên</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={globalStyles.card}>
          <View style={globalStyles.avatarContainer}>
            <Image
              source={
                student?.avatar
                  ? { uri: student.avatar }
                  : require('../../../../assets/images/Nhan_imported_image/account_circle_withbackground.png')
              }
              style={globalStyles.avatar}
            />
          </View>

          <Text style={globalStyles.name}>{student?.fullName}</Text>
          <Text style={globalStyles.studentId}>MSSV: {student?.studentId}</Text>

          <View style={globalStyles.infoContainer}>
            {studentInfo.map((item, index) => (
              <View key={index} style={globalStyles.row}>
                <Text style={globalStyles.label}>{item.label}</Text>
                <Text style={globalStyles.value}>{item.value}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}