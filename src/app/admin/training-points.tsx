import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL } from '../../config/api';

export default function AdminTrainingPointsScreen() {
  const router = useRouter();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  // State quản lý Học kỳ
  const [semesters, setSemesters] = useState<any[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<any>(null);
  const [showSemesterModal, setShowSemesterModal] = useState(false);

  // 1. GỌI API LẤY DANH SÁCH HỌC KỲ (Dựa theo chương trình khung)
 // 1. GỌI API LẤY DANH SÁCH HỌC KỲ
  const fetchSemesters = async () => {
    try {
      console.log("🚀 Đang gọi API lấy danh sách học kỳ...");
      const token = await AsyncStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/curriculum`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Đọc dữ liệu thô để debug
      const text = await response.text();
      console.log("📦 Dữ liệu thô từ /curriculum:", text);

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.log("❌ Lỗi parse JSON. Server trả về HTML hoặc lỗi mạng.");
        Alert.alert("Lỗi", "Định dạng dữ liệu từ server không hợp lệ!");
        return;
      }

      // Xử lý linh hoạt: Backend trả về Mảng trực tiếp, hoặc Object chứa data/semesters
      let semesterList = [];
      if (Array.isArray(data)) {
        semesterList = data; // Trả về thẳng mảng: [...]
      } else if (data && data.data && Array.isArray(data.data)) {
        semesterList = data.data; // Trả về dạng: { success: true, data: [...] }
      } else if (data && data.semesters && Array.isArray(data.semesters)) {
        semesterList = data.semesters; // Trả về dạng: { success: true, semesters: [...] }
      } else if (data && data.curriculum && Array.isArray(data.curriculum)) {
        semesterList = data.curriculum; // Trả về dạng: { curriculum: [...] }
      }

      if (semesterList.length > 0) {
        // Lọc ra các học kỳ hợp lệ và sắp xếp
        const validSemesters = semesterList.filter((s: any) => s && s.semesterNumber !== undefined);
        const sortedData = validSemesters.sort((a: any, b: any) => a.semesterNumber - b.semesterNumber);
        
        setSemesters(sortedData);
        setSelectedSemester(sortedData[0]); // Chọn ngay học kỳ đầu tiên
        console.log("✅ Đã load xong học kỳ:", sortedData[0].semesterNumber);
      } else {
        console.log("⚠️ Không tìm thấy mảng học kỳ nào bên trong dữ liệu!");
        Alert.alert("Thông báo", "Chưa có học kỳ nào trong hệ thống, vui lòng thêm bên Quản lý khung!");
        setSemesters([]);
        setSelectedSemester(null);
      }
    } catch (error) {
      console.error("Lỗi tải học kỳ:", error);
      Alert.alert("Lỗi", "Không thể kết nối đến máy chủ");
    }
  };

  // 2. LẤY DANH SÁCH SINH VIÊN THEO HỌC KỲ
  const fetchStudentsBySemester = async () => {
    if (!selectedSemester) return;
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      // Gắn semesterNumber lên URL để lấy đúng điểm kỳ đó
      const response = await fetch(`${API_URL}/students/all?semesterNumber=${selectedSemester.semesterNumber}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success || data.students) {
        setStudents(data.students || data); // Xử lý linh hoạt theo cách Backend trả về
      } else {
        Alert.alert('Thất bại', data.message || 'Không thể lấy dữ liệu sinh viên');
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Mất kết nối tới server Backend');
    } finally {
      setLoading(false);
    }
  };

  // Load danh sách học kỳ khi mở màn hình
  useEffect(() => {
    fetchSemesters();
  }, []);

  // Đổi học kỳ -> Tải lại danh sách sinh viên
  useEffect(() => {
    fetchStudentsBySemester();
  }, [selectedSemester]);

  const changeLocalPoint = (id: string, value: string) => {
    const point = parseInt(value) || 0;
    setStudents(prev => prev.map(s => (s._id === id || s.id === id) ? { ...s, trainingPoint: point } : s));
  };

  // 3. LƯU ĐIỂM XUỐNG BACKEND
  const savePoint = async (id: string, point: number) => {
    if (!selectedSemester) {
      Alert.alert('Lỗi', 'Vui lòng chọn học kỳ trước khi chấm điểm!');
      return;
    }
    if (point < 0 || point > 100) {
      Alert.alert('Lỗi', 'Điểm rèn luyện phải nằm trong khoảng 0 - 100');
      return;
    }
    try {
      setSubmittingId(id);
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/students/${id}/training-point`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        // Bắn kèm semesterNumber xuống cho Backend cập nhật đúng kỳ
        body: JSON.stringify({ 
            trainingPoint: point,
            semesterNumber: selectedSemester.semesterNumber 
        })
      });
      const data = await response.json();
      
      if (response.ok || data.success) {
        Alert.alert('Thành công', `Đã lưu điểm rèn luyện Học kỳ ${selectedSemester.semesterNumber}!`);
      } else {
        Alert.alert('Lỗi', data.message || 'Cập nhật thất bại');
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể lưu điểm');
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
            if(router.canGoBack()) router.replace('/admin/dashboard' as any);
        }}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chấm Điểm Rèn Luyện</Text>
        <TouchableOpacity onPress={fetchStudentsBySemester}>
          <Ionicons name="refresh" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* COMPONENT CHỌN HỌC KỲ */}
      <View style={styles.semesterContainer}>
        <Text style={styles.semesterLabel}>Học kỳ đang chấm:</Text>
        <TouchableOpacity 
            style={styles.semesterSelector} 
            onPress={() => setShowSemesterModal(true)}
        >
            <Text style={styles.semesterSelectorText}>
                {selectedSemester ? `Học kỳ ${selectedSemester.semesterNumber}` : "Đang tải..."}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#555" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4CAF50" style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={students}
          keyExtractor={(item) => item._id || item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View style={styles.studentCard}>
              <View>
                <Text style={styles.nameText}>{item.fullName}</Text>
                <Text style={styles.subText}>MSSV: {item.studentId || 'Chưa cập nhật'}</Text>
                <Text style={styles.subText}>Lớp: {item.class || 'Trống'}</Text>
              </View>
              <View style={styles.scoreAction}>
                <TextInput
                  style={styles.inputScore}
                  keyboardType="numeric"
                  value={(item.trainingPoint ?? 0).toString()}
                  onChangeText={(val) => changeLocalPoint(item._id || item.id, val)}
                  maxLength={3}
                />
                <TouchableOpacity 
                  style={styles.btnSave} 
                  onPress={() => savePoint(item._id || item.id, item.trainingPoint || 0)}
                  disabled={submittingId === (item._id || item.id)}
                >
                  {submittingId === (item._id || item.id) ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Chưa có dữ liệu sinh viên trong kỳ này</Text>
          }
        />
      )}

      {/* MODAL DANH SÁCH HỌC KỲ */}
      <Modal visible={showSemesterModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Chọn học kỳ</Text>
                <FlatList
                    data={semesters}
                    keyExtractor={(item) => (item._id || item.id || item.semesterNumber).toString()}
                    renderItem={({item}) => (
                        <TouchableOpacity 
                            style={[
                                styles.modalItem,
                                selectedSemester?.semesterNumber === item.semesterNumber && styles.modalItemSelected
                            ]}
                            onPress={() => {
                                setSelectedSemester(item);
                                setShowSemesterModal(false);
                            }}
                        >
                            <Text style={[
                                styles.modalItemText,
                                selectedSemester?.semesterNumber === item.semesterNumber && styles.modalItemTextSelected
                            ]}>
                                Học kỳ {item.semesterNumber}
                            </Text>
                            {selectedSemester?.semesterNumber === item.semesterNumber && (
                                <Ionicons name="checkmark" size={20} color="#4CAF50" />
                            )}
                        </TouchableOpacity>
                    )}
                />
                <TouchableOpacity 
                    style={styles.modalCloseBtn}
                    onPress={() => setShowSemesterModal(false)}
                >
                    <Text style={styles.modalCloseText}>Đóng</Text>
                </TouchableOpacity>
            </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  
  semesterContainer: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#eee'},
  semesterLabel: { fontSize: 15, color: '#555', marginRight: 10, fontWeight: '500' },
  semesterSelector: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f0f4f8', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#d0d7de' },
  semesterSelectorText: { fontSize: 15, fontWeight: '600', color: '#333' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', backgroundColor: '#fff', borderRadius: 12, padding: 20, maxHeight: '60%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  modalItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalItemSelected: { backgroundColor: '#e8f5e9' },
  modalItemText: { fontSize: 16, color: '#333' },
  modalItemTextSelected: { color: '#4CAF50', fontWeight: 'bold' },
  modalCloseBtn: { marginTop: 20, padding: 12, backgroundColor: '#f0f0f0', borderRadius: 8, alignItems: 'center' },
  modalCloseText: { fontSize: 16, fontWeight: '600', color: '#555' },
  emptyText: { textAlign: 'center', marginTop: 30, color: '#888', fontSize: 15 },

  studentCard: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', padding: 16, borderRadius: 8, marginBottom: 12, alignItems: 'center', borderWidth: 1, borderColor: '#eee' },
  nameText: { fontSize: 16, fontWeight: '600', color: '#333' },
  subText: { fontSize: 13, color: '#777', marginTop: 2 },
  scoreAction: { flexDirection: 'row', alignItems: 'center' },
  inputScore: { borderBottomWidth: 1, borderColor: '#4CAF50', width: 50, textAlign: 'center', fontSize: 18, fontWeight: 'bold', marginRight: 12, paddingVertical: 2 },
  btnSave: { backgroundColor: '#4CAF50', padding: 8, borderRadius: 6 }
}); 