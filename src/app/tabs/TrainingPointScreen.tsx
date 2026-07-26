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
  
  const [semesters, setSemesters] = useState<any[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    fetchSemesters();
  }, []);

  useEffect(() => {
    const userId = user?._id || user?.id; 
    if (userId && selectedSemester) {
      fetchTrainingPoint(userId, selectedSemester);
    }
  }, [user, selectedSemester]);

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
      let result;
      try { 
        result = JSON.parse(text); 
      } catch (e) { 
        console.log("Dữ liệu trả về không phải JSON");
        setLoading(false); 
        return; 
      }

      let semesterList: any[] = [];
      
      // Tìm nguồn dữ liệu trả về từ API
      const dataSource = result?.data || result?.curriculum || result?.semesters || (Array.isArray(result) ? result : []);
      
      // Áp dụng logic lọc và chuyển đổi giống hệt trang Admin
      if (Array.isArray(dataSource)) {
        const semesterMap = new Map();
        dataSource.forEach((item: any) => {
          // Trường hợp API trả về chuỗi như "HK1", "HK2"
          if (item.semester && !semesterMap.has(item.semester)) {
            semesterMap.set(item.semester, {
              _id: item._id,
              semesterNumber: parseInt(item.semester.replace('HK', '')),
              academicYear: item.academicYear
            });
          } 
          // Trường hợp API trả về sẵn semesterNumber
          else if (item.semesterNumber !== undefined && !semesterMap.has(item.semesterNumber)) {
            semesterMap.set(item.semesterNumber, item);
          }
        });
        semesterList = Array.from(semesterMap.values());
      }

      if (semesterList.length > 0) {
        // Sắp xếp học kỳ từ nhỏ đến lớn
        const sortedData = semesterList.sort((a: any, b: any) => a.semesterNumber - b.semesterNumber);
        
        setSemesters(sortedData);
        setSelectedSemester(sortedData[0]); 
      } else {
        setSemesters([]);
      }
    } catch (error) {
      console.error("Lỗi tải học kỳ:", error);
    } finally {
      // Đảm bảo luôn tắt loading
      setLoading(false);
    }
  };

  const fetchTrainingPoint = async (userId: string, semester: any) => {
    try {
      setLoading(true); // Bật loading lại riêng cho phần lấy điểm
      setShowDropdown(false);
      const savedToken = await AsyncStorage.getItem('token');

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
        let currentSemesterPoint = null; 

        if (studentData?.trainingPoints && Array.isArray(studentData.trainingPoints)) {
          const found = studentData.trainingPoints.find(
            (tp: any) => Number(tp.semesterNumber) === Number(semester.semesterNumber)
          );
          if (found) {
            currentSemesterPoint = found.trainingPoint !== undefined ? found.trainingPoint : found.point; 
          }
        } else if (studentData?.trainingPoint !== undefined) {
          currentSemesterPoint = studentData.trainingPoint; 
        }

        setPoint(currentSemesterPoint);
      } else {
        Alert.alert("Lỗi", "Không thể lấy điểm rèn luyện kỳ này");
      }
    } catch (error) {
      console.error("Lỗi network khi lấy điểm:", error);
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
      <View style={globalStyles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={globalStyles.headerTitle}>Điểm rèn luyện</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={{ flex: 1 }}>
        <View style={styles.semesterSelectorContainer}>
          <Text style={styles.semesterLabel}>Chọn học kỳ:</Text>
          <TouchableOpacity 
            style={styles.dropdownButton}
            onPress={() => setShowDropdown(!showDropdown)}
            disabled={semesters.length === 0}
          >
            <Text style={styles.dropdownButtonText}>
              {selectedSemester ? `Học kỳ ${selectedSemester.semesterNumber}` : (semesters.length === 0 && !loading ? "Không có dữ liệu" : "Đang tải...")}
            </Text>
            <Ionicons name={showDropdown ? "chevron-up" : "chevron-down"} size={20} color="#333" />
          </TouchableOpacity>

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
                {point !== null ? (
                  <>
                    <Text style={styles.scoreText}>{point}</Text>
                    <Text style={[styles.classificationText, { color: getClassification(point).color }]}>
                      {getClassification(point).text}
                    </Text>
                  </>
                ) : (
                  <Text style={{ fontSize: 18, color: '#888', fontWeight: 'bold', textAlign: 'center' }}>
                    Chưa có{"\n"}dữ liệu
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
  semesterSelectorContainer: { paddingHorizontal: 20, marginTop: 20, marginBottom: 10, zIndex: 10 },
  semesterLabel: { fontSize: 14, color: '#666', marginBottom: 8, fontWeight: '600' },
  dropdownButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 15, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd' },
  dropdownButtonText: { fontSize: 16, color: '#333', fontWeight: '500' },
  dropdownList: { backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#ddd', marginTop: 5, position: 'absolute', top: 70, left: 20, right: 20, zIndex: 100, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  dropdownItem: { paddingVertical: 12, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  dropdownItemText: { fontSize: 16, color: '#333' },
  content: { padding: 20, alignItems: 'center' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 10, marginBottom: 30, textAlign: 'center' },
  scoreCircle: { width: 200, height: 200, borderRadius: 100, borderWidth: 8, borderColor: '#4F6EF7', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', shadowColor: '#4F6EF7', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 8 },
  scoreText: { fontSize: 60, fontWeight: 'bold', color: '#333' },
  classificationText: { fontSize: 20, fontWeight: 'bold', marginTop: 5 },
  infoBox: { flexDirection: 'row', backgroundColor: '#f8f9fa', padding: 15, borderRadius: 10, marginTop: 125, alignItems: 'center' },
  infoText: { flex: 1, marginLeft: 10, fontSize: 14, color: '#666', lineHeight: 20 }
});