import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  Button,
  Image,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles } from '../../../a_styles/style_student_info';
import { useAuth } from '../../../contexts/AuthContext';
import { API_URL } from '../../../utils/api';

export default function StudentInfoScreen() {
  const { user } = useAuth();

  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.studentId) {
      loadStudent();
    }
  }, [user]);

  //loadStudent từ database
  const loadStudent = async () => {
    try {
      setLoading(true);

      // 1. Get the token from AsyncStorage
      const token = await AsyncStorage.getItem('token');

      // 2. Query using user?.id (MongoDB ObjectId) and pass the Authorization header
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
      console.log('Student API:', data);

      if (data.success) {
        // 3. Extract the nested student object
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
    { label: 'Giới tính', value: student?.gender ?? '' }, // Note: gender is optional/not standard in User Schema
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

  const onPressUpdateStudent = () => {
    console.log('Button pressed!');
    //Gui yeu cau cap nhat thong tin len admin
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Đang tải...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Thông tin sinh viên</Text>

        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        <View style={styles.card}>
          <View style={styles.avatarContainer}>
            <Image
              source={{
                uri: student?.avatar || 'https://i.pravatar.cc/300',
              }}
              style={styles.avatar}
            />

            <TouchableOpacity style={styles.cameraButton}>
              <Ionicons
                name="camera-outline"
                size={18}
                color="#555"
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.name}>
            {student?.fullName}
          </Text>

          <Text style={styles.studentId}>
            MSSV: {student?.studentId}
          </Text>

          <View style={styles.infoContainer}>
            {studentInfo.map((item, index) => (
              <View key={index} style={styles.row}>
                <Text style={styles.label}>{item.label}</Text>

                <Text style={styles.value}>{item.value}</Text>
              </View>
            ))}
          </View>

          <Button
          onPress={onPressUpdateStudent}
          title="Cap Nhat Sinh Vien"
          color="#6d7c99"
          accessibilityLabel="Cap Nhat Sinh Vien"
          />

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}