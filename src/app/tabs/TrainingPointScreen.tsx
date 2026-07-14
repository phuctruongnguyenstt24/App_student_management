import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { styles as globalStyles } from '../../a_styles/style_student_info';
import { API_URL } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';

export default function TrainingPointScreen() {
  const navigation = useNavigation();
  const { user } = useAuth(); 
  
  const [point, setPoint] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  
  // State cho phần chọn học kỳ
  const [semesters, setSemesters] = useState<any[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // 1. KHI VÀO MÀN HÌNH -> TẢI DANH SÁCH HỌC KỲ TRƯỚC
  useEffect(() => {
    fetchSemesters();
  }, []);

  // 2. KHI ĐÃ CÓ USER VÀ ĐÃ CHỌN HỌC KỲ -> GỌI API LẤY ĐIỂM
  useEffect(() => {
    const userId = user?._id || user?.id; 
    if (userId && selectedSemester) {
      fetchTrainingPoint(userId, selectedSemester);
    }
  }, [user, selectedSemester]);

  // HÀM LẤY DANH SÁCH HỌC KỲ (Dùng lại logic chống đạn từ Admin)
  const fetchSemesters = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/curriculum`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const text = await response.text();
      let data;
      try { data = JSON.parse(text); } catch (e) { return; }

      let semesterList = [];
      if (Array.isArray(data)) semesterList = data;
      else if (data?.data && Array.isArray(data.data)) semesterList = data.data;
      else if (data?.semesters && Array.isArray(data.semesters)) semesterList = data.semesters;
      else if (data?.curriculum && Array.isArray(data.curriculum)) semesterList = data.curriculum;

      if (semesterList.length > 0) {
        const validSemesters = semesterList.filter((s: any) => s && s.semesterNumber !== undefined);
        const sortedData = validSemesters.sort((a: any, b: any) => a.semesterNumber - b.semesterNumber);
        
        setSemesters(sortedData);
        setSelectedSemester(sortedData[0]); // Mặc định chọn học kỳ đầu tiên
      }
    } catch (error) {
      console.error("Lỗi tải học kỳ:", error);
    }
  };

  // HÀM LẤY ĐIỂM RÈN LUYỆN DỰA TRÊN HỌC KỲ ĐƯỢC CHỌN
  const fetchTrainingPoint = async (userId: string, semester: any) => {
    try {
      setLoading(true);
      setShowDropdown(false); // Ẩn dropdown khi bắt đầu tải
      const savedToken = await AsyncStorage.getItem('token');

      // ⚠️ LƯU Ý CHO BRO: Sửa lại API này cho đúng với Backend của bro nhé!
      // Ví dụ nếu BE của bro cần truyền query: ?semesterId=... hoặc /semester/...
      // Hiện tại mình đang giữ URL cũ của bro, bro cần check lại Backend viết route này thế nào
      const response = await fetch(`${API_URL}/students/${userId}`, { 
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${savedToken}`, 
          'Content-Type': 'application/json',
        }
      });
      
      const data = await response.json();
      
      if (data.success || response.ok) {
        const studentData = data.data || data.student || data.user || data;
        
        // ⚠️ GIẢ ĐỊNH: Nếu BE trả về 1 mảng điểm các kỳ, bro phải dùng hàm find/filter ở đây.
        // Còn nếu BE đã trả về đúng điểm của kỳ đó rồi thì xài luôn.
        setPoint(studentData?.trainingPoint || 0);
      } else {
        Alert.alert("Lỗi", "Không thể lấy điểm rèn luyện kỳ này");
      }
    } catch (error) {
      console.error("Lỗi network khi lấy điểm rèn luyện:", error);
    } finally {
      setLoading(false);
    }
  };

  const getClassification = (score: number) => {
    if (score >= 90) return { text: 'Xuất sắc', color: '#33C06B' };
    if (score >= 80) return { text: 'Tốt', color: '#4F6EF7' };
    if (score >= 65) return { text: 'Khá', color: '#F2B233' };
    if (score >= 50) return { text: 'Trung bình', color: '#F28C45' };
    return { text: 'Yếu', color: '#EF4B4B' };
  };

  return (
    <SafeAreaView style={globalStyles.container}>
      {/* Header */}
      <View style={globalStyles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={globalStyles.headerTitle}>Điểm rèn luyện</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={{ flex: 1 }}>
        {/* Bộ chọn học kỳ */}
        <View style={styles.semesterSelectorContainer}>
          <Text style={styles.semesterLabel}>Chọn học kỳ:</Text>
          <TouchableOpacity 
            style={styles.dropdownButton}
            onPress={() => setShowDropdown(!showDropdown)}
          >
            <Text style={styles.dropdownButtonText}>
              {selectedSemester ? `Học kỳ ${selectedSemester.semesterNumber}` : "Đang tải..."}
            </Text>
            <Ionicons name={showDropdown ? "chevron-up" : "chevron-down"} size={20} color="#333" />
          </TouchableOpacity>

          {/* Danh sách học kỳ thả xuống */}
          {showDropdown && semesters.length > 0 && (
            <View style={styles.dropdownList}>
              {semesters.map((sem, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.dropdownItem}
                  onPress={() => setSelectedSemester(sem)}
                >
                  <Text style={[
                    styles.dropdownItemText,
                    selectedSemester?.semesterNumber === sem.semesterNumber && { color: '#4F6EF7', fontWeight: 'bold' }
                  ]}>
                    Học kỳ {sem.semesterNumber}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={globalStyles.card}>
          <View style={styles.content}>
            <Text style={styles.title}>
              Tổng điểm của bạn ({selectedSemester ? `HK ${selectedSemester.semesterNumber}` : ''})
            </Text>
            
            {loading ? (
              <ActivityIndicator size="large" color="#4F6EF7" style={{ marginTop: 50, marginBottom: 50 }} />
            ) : (
              <View style={styles.scoreCircle}>
                <Text style={styles.scoreText}>{point !== null ? point : '-'}</Text>
                {point !== null && (
                  <Text style={[styles.classificationText, { color: getClassification(point).color }]}>
                    {getClassification(point).text}
                  </Text>
                )}
              </View>
            )}

            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={20} color="#666" />
              <Text style={styles.infoText}>
                Điểm rèn luyện được cập nhật bởi Ban quản trị khoa. Nếu có thắc mắc, vui lòng liên hệ cố vấn học tập.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // CSS cho Dropdown chọn học kỳ
  semesterSelectorContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
    zIndex: 10, // Để dropdown đè lên card bên dưới
  },
  semesterLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '600',
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  dropdownList: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginTop: 5,
    position: 'absolute',
    top: 70,
    left: 20,
    right: 20,
    zIndex: 100,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
  },
  // CSS cũ
  content: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
    marginBottom: 30,
    textAlign: 'center',
  },
  scoreCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 8,
    borderColor: '#4F6EF7',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    shadowColor: '#4F6EF7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  scoreText: {
    fontSize: 60,
    fontWeight: 'bold',
    color: '#333',
  },
  classificationText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 5,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    marginTop: 50,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  }
});