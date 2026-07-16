import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
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

  // State quản lý Khoa và Lớp (Đã bỏ ALL, dùng null làm mặc định)
  const [faculties, setFaculties] = useState<any[]>([]);
  const [selectedFacultyId, setSelectedFacultyId] = useState<string | null>(null);
  const [showFacultyModal, setShowFacultyModal] = useState(false);

  const [selectedClassStr, setSelectedClassStr] = useState<string | null>(null);
  const [showClassModal, setShowClassModal] = useState(false);

  // 1. GỌI API LẤY DANH SÁCH HỌC KỲ
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
      try {
        data = JSON.parse(text);
      } catch (e) {
        Alert.alert("Lỗi", "Định dạng dữ liệu từ server không hợp lệ!");
        return;
      }

      let semesterList = [];
      if (Array.isArray(data)) semesterList = data;
      else if (data && data.data && Array.isArray(data.data)) semesterList = data.data;
      else if (data && data.semesters && Array.isArray(data.semesters)) semesterList = data.semesters;
      else if (data && data.curriculum && Array.isArray(data.curriculum)) semesterList = data.curriculum;

      if (semesterList.length > 0) {
        const validSemesters = semesterList.filter((s: any) => s && s.semesterNumber !== undefined);
        const sortedData = validSemesters.sort((a: any, b: any) => a.semesterNumber - b.semesterNumber);
        
        setSemesters(sortedData);
        setSelectedSemester(sortedData[0]);
      } else {
        Alert.alert("Thông báo", "Chưa có học kỳ nào trong hệ thống!");
      }
    } catch (error) {
      Alert.alert("Lỗi", "Không thể kết nối đến máy chủ");
    }
  };

 // 1.5. GỌI API LẤY DANH SÁCH KHOA
  const fetchFaculties = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/faculties`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      let facultyList = [];
      if (Array.isArray(data)) {
        facultyList = data;
      } else if (data && data.data && Array.isArray(data.data)) {
        facultyList = data.data;
      } else if (data && data.faculties && Array.isArray(data.faculties)) {
        facultyList = data.faculties;
      }

      setFaculties(facultyList);
      // Tự động chọn khoa đầu tiên nếu có
      if (facultyList.length > 0) {
        setSelectedFacultyId(facultyList[0]._id);
      }
    } catch (error) {
      console.log("Lỗi tải danh sách khoa:", error);
      setFaculties([]);
    }
  };

  // 2. LẤY DANH SÁCH SINH VIÊN THEO HỌC KỲ
  const fetchStudentsBySemester = async () => {
    if (!selectedSemester) return;
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/students/all?semesterNumber=${selectedSemester.semesterNumber}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success || data.students) {
        setStudents(data.students || data);
      } else {
        Alert.alert('Thất bại', data.message || 'Không thể lấy dữ liệu sinh viên');
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Mất kết nối tới server Backend');
    } finally {
      setLoading(false);
    }
  };

  // Khởi tạo data ban đầu
  useEffect(() => {
    fetchSemesters();
    fetchFaculties();
  }, []);

  // Đổi học kỳ -> Tải lại danh sách sinh viên
  useEffect(() => {
    fetchStudentsBySemester();
  }, [selectedSemester]);

  // --- LOGIC LỌC DỮ LIỆU ---
  // Lấy danh sách Lớp từ những sinh viên thuộc Khoa đang chọn
  const availableClasses = useMemo(() => {
    if (!selectedFacultyId) return [];
    const baseStudents = students.filter(s => s.facultyId === selectedFacultyId);
    const classSet = new Set(baseStudents.map(s => s.class).filter(c => c && c.trim() !== ''));
    return Array.from(classSet).sort();
  }, [students, selectedFacultyId]);

  // Tự động chọn Lớp đầu tiên khi đổi Khoa hoặc khi danh sách Lớp thay đổi
  useEffect(() => {
    if (availableClasses.length > 0) {
        if (!selectedClassStr || !availableClasses.includes(selectedClassStr)) {
            setSelectedClassStr(availableClasses[0]); // Chọn lớp đầu tiên
        }
    } else {
        setSelectedClassStr(null); // Không có lớp nào
    }
  }, [availableClasses]);

  // Danh sách sinh viên cuối cùng được hiển thị ra màn hình (Lọc khắt khe theo Khoa và Lớp đã chọn)
  const filteredStudents = useMemo(() => {
    if (!selectedFacultyId || !selectedClassStr) return []; // Ẩn nếu chưa chọn Khoa hoặc Lớp
    return students.filter(s => s.facultyId === selectedFacultyId && s.class === selectedClassStr);
  }, [students, selectedFacultyId, selectedClassStr]);

  // Xử lý khi đổi Khoa
  const handleSelectFaculty = (facultyId: string) => {
    setSelectedFacultyId(facultyId);
    setShowFacultyModal(false);
    // Lớp sẽ tự động được set lại nhờ useEffect bên trên
  };

  const changeLocalPoint = (id: string, value: string) => {
    const point = parseInt(value) || 0;
    setStudents(prev => prev.map(s => (s._id === id || s.id === id) ? { ...s, trainingPoint: point } : s));
  };

  // 3. LƯU ĐIỂM XUỐNG BACKEND
  const savePoint = async (id: string, point: number) => {
    if (!selectedSemester) return Alert.alert('Lỗi', 'Vui lòng chọn học kỳ!');
    if (point <= 0 || point > 100) return Alert.alert('Cảnh báo', 'Điểm rèn luyện từ 1 đến 100!');

    try {
      setSubmittingId(id);
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/students/${id}/training-point`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
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
        <Text style={styles.semesterLabel}>Học kỳ:</Text>
        <TouchableOpacity style={styles.semesterSelector} onPress={() => setShowSemesterModal(true)}>
            <Text style={styles.semesterSelectorText}>
                {selectedSemester ? `Học kỳ ${selectedSemester.semesterNumber}` : "Đang tải..."}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#555" />
        </TouchableOpacity>
      </View>

      {/* BỘ LỌC KHOA & LỚP */}
      <View style={styles.filterContainer}>
        {/* Lọc Khoa */}
        <TouchableOpacity style={styles.filterBox} onPress={() => setShowFacultyModal(true)}>
          <Text style={styles.filterLabel}>Khoa:</Text>
          <Text style={styles.filterValue} numberOfLines={1}>
            {selectedFacultyId 
              ? faculties.find(f => f._id === selectedFacultyId)?.name || 'Đang tải...' 
              : 'Chọn Khoa'}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#777" />
        </TouchableOpacity>

        {/* Lọc Lớp */}
        <TouchableOpacity style={styles.filterBox} onPress={() => setShowClassModal(true)}>
          <Text style={styles.filterLabel}>Lớp:</Text>
          <Text style={styles.filterValue} numberOfLines={1}>
            {selectedClassStr ? selectedClassStr : 'Chọn Lớp'}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#777" />
        </TouchableOpacity>
      </View>

      {/* DANH SÁCH SINH VIÊN (ĐÃ LỌC) */}
      {loading ? (
        <ActivityIndicator size="large" color="#4CAF50" style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={filteredStudents}
          keyExtractor={(item) => item._id || item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View style={styles.studentCard}>
              <View style={{ flex: 1 }}>
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
            <Text style={styles.emptyText}>Chưa có dữ liệu sinh viên trong lớp này</Text>
          }
        />
      )}

      {/* ---------------- MODALS ---------------- */}
      
      {/* 1. Modal Chọn Học Kỳ */}
      <Modal visible={showSemesterModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Chọn học kỳ</Text>
                <FlatList
                    data={semesters}
                    keyExtractor={(item) => (item._id || item.id || item.semesterNumber).toString()}
                    renderItem={({item}) => (
                        <TouchableOpacity 
                            style={[styles.modalItem, selectedSemester?.semesterNumber === item.semesterNumber && styles.modalItemSelected]}
                            onPress={() => {
                                setSelectedSemester(item);
                                setShowSemesterModal(false);
                            }}
                        >
                            <Text style={[styles.modalItemText, selectedSemester?.semesterNumber === item.semesterNumber && styles.modalItemTextSelected]}>
                                Học kỳ {item.semesterNumber}
                            </Text>
                            {selectedSemester?.semesterNumber === item.semesterNumber && (
                                <Ionicons name="checkmark" size={20} color="#4CAF50" />
                            )}
                        </TouchableOpacity>
                    )}
                />
                <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowSemesterModal(false)}>
                    <Text style={styles.modalCloseText}>Đóng</Text>
                </TouchableOpacity>
            </View>
        </View>
      </Modal>

      {/* 2. Modal Chọn Khoa (Đã bỏ Tất cả) */}
      <Modal visible={showFacultyModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Chọn Khoa</Text>
                    <FlatList
                        data={Array.isArray(faculties) ? faculties : []}
                        keyExtractor={(item) => item._id}
                        renderItem={({ item }) => (
                        <TouchableOpacity 
                            style={[styles.modalItem, selectedFacultyId === item._id && styles.modalItemSelected]}
                            onPress={() => handleSelectFaculty(item._id)}
                        >
                            <Text style={[styles.modalItemText, selectedFacultyId === item._id && styles.modalItemTextSelected]}>
                                {item.name}
                            </Text>
                            {selectedFacultyId === item._id && <Ionicons name="checkmark" size={20} color="#4CAF50" />}
                        </TouchableOpacity>
                    )}
                />
                <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowFacultyModal(false)}>
                    <Text style={styles.modalCloseText}>Đóng</Text>
                </TouchableOpacity>
            </View>
        </View>
      </Modal>

      {/* 3. Modal Chọn Lớp (Đã bỏ Tất cả) */}
      <Modal visible={showClassModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Chọn Lớp</Text>
                <FlatList
                    data={availableClasses}
                    keyExtractor={(item) => item}
                    renderItem={({item}) => (
                        <TouchableOpacity 
                            style={[styles.modalItem, selectedClassStr === item && styles.modalItemSelected]}
                            onPress={() => {
                                setSelectedClassStr(item);
                                setShowClassModal(false);
                            }}
                        >
                            <Text style={[styles.modalItemText, selectedClassStr === item && styles.modalItemTextSelected]}>
                                {item}
                            </Text>
                            {selectedClassStr === item && <Ionicons name="checkmark" size={20} color="#4CAF50" />}
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={<Text style={{textAlign: 'center', marginTop: 10, color: '#888'}}>Không có lớp nào</Text>}
                />
                <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowClassModal(false)}>
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
  
  semesterContainer: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6, backgroundColor: '#fff', alignItems: 'center'},
  semesterLabel: { fontSize: 14, color: '#555', marginRight: 10, fontWeight: '500', width: 55 },
  semesterSelector: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f0f4f8', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#d0d7de' },
  semesterSelectorText: { fontSize: 15, fontWeight: '600', color: '#333' },

  // Giao diện Bộ lọc mới
  filterContainer: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 12, backgroundColor: '#fff', gap: 10, borderBottomWidth: 1, borderBottomColor: '#eee'},
  filterBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: '#e0e0e0' },
  filterLabel: { fontSize: 13, color: '#666', marginRight: 4 },
  filterValue: { flex: 1, fontSize: 13, fontWeight: '600', color: '#333' },
  
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