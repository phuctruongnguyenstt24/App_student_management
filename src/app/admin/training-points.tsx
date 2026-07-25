import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL } from '../../config/api';

// Interfaces giống trang mng_frameworkprogram
interface Faculty {
  _id: string;
  name: string;
  code: string;
}

interface Department {
  _id: string;
  name: string;
  code: string;
  facultyId: string;
}

interface Semester {
  _id: string;
  semesterNumber: number;
  academicYear?: string;
}

interface Student {
  _id: string;
  id?: string;
  fullName: string;
  studentId: string;
  class: string;
  facultyId: string;
  departmentId?: string;
  trainingPoint?: number;
}

export default function AdminTrainingPointsScreen() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  // State quản lý Học kỳ
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<Semester | null>(null);
  const [showSemesterModal, setShowSemesterModal] = useState(false);

  // State quản lý Khoa - Lấy từ API giống trang framework
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [selectedFacultyId, setSelectedFacultyId] = useState<string | null>(null);
  const [showFacultyModal, setShowFacultyModal] = useState(false);

  // State quản lý Ngành - Lấy từ API giống trang framework
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);

  // State quản lý Lớp
  const [selectedClassStr, setSelectedClassStr] = useState<string | null>(null);
  const [showClassModal, setShowClassModal] = useState(false);

  // 1. LẤY DANH SÁCH HỌC KỲ - Giống trang framework
  const fetchSemesters = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/curriculum`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      let semesterList: Semester[] = [];
      if (result.success && result.data) {
        // Lấy danh sách semester từ curriculum data
        const curriculumData = result.data;
        if (Array.isArray(curriculumData)) {
          // Trích xuất semester unique từ curriculum
          const semesterMap = new Map();
          curriculumData.forEach((item: any) => {
            if (item.semester && !semesterMap.has(item.semester)) {
              semesterMap.set(item.semester, {
                _id: item._id,
                semesterNumber: parseInt(item.semester.replace('HK', '')),
                academicYear: item.academicYear
              });
            }
          });
          semesterList = Array.from(semesterMap.values());
        }
      }
      
      // Nếu không có dữ liệu từ curriculum, tạo mặc định
      if (semesterList.length === 0) {
        semesterList = [
          { _id: '1', semesterNumber: 1 },
          { _id: '2', semesterNumber: 2 },
          { _id: '3', semesterNumber: 3 }
        ];
      }
      
      // Sắp xếp theo số học kỳ
      const sortedData = semesterList.sort((a, b) => a.semesterNumber - b.semesterNumber);
      setSemesters(sortedData);
      if (sortedData.length > 0) {
        setSelectedSemester(sortedData[0]);
      }
    } catch (error) {
      console.error('Lỗi tải học kỳ:', error);
      // Fallback: tạo semester mặc định
      const defaultSemesters = [
        { _id: '1', semesterNumber: 1 },
        { _id: '2', semesterNumber: 2 },
        { _id: '3', semesterNumber: 3 }
      ];
      setSemesters(defaultSemesters);
      setSelectedSemester(defaultSemesters[0]);
    }
  };

  // 2. LẤY DANH SÁCH KHOA - Giống trang framework
  const fetchFaculties = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/faculties`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      
      let facultyList: Faculty[] = [];
      if (result.success && result.faculties) {
        facultyList = result.faculties;
      } else if (Array.isArray(result)) {
        facultyList = result;
      } else if (result.data && Array.isArray(result.data)) {
        facultyList = result.data;
      }

      setFaculties(facultyList);
      if (facultyList.length > 0) {
        setSelectedFacultyId(facultyList[0]._id);
      }
    } catch (error) {
      console.error('Lỗi tải khoa:', error);
      setFaculties([]);
    }
  };

  // 3. LẤY DANH SÁCH NGÀNH - Giống trang framework
  const fetchDepartments = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/departments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      
      let departmentList: Department[] = [];
      if (result.success && result.departments) {
        departmentList = result.departments;
      } else if (Array.isArray(result)) {
        departmentList = result;
      } else if (result.data && Array.isArray(result.data)) {
        departmentList = result.data;
      }

      setDepartments(departmentList);
      if (departmentList.length > 0) {
        setSelectedDepartmentId(departmentList[0]._id);
      }
    } catch (error) {
      console.error('Lỗi tải ngành:', error);
      setDepartments([]);
    }
  };

  // 4. LẤY DANH SÁCH SINH VIÊN - Có filter theo khoa, ngành, học kỳ
  const fetchStudentsByFilters = async () => {
    if (!selectedSemester) return;
    
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      
      // Xây dựng query params
      const params = new URLSearchParams();
      params.append('semesterNumber', selectedSemester.semesterNumber.toString());
      if (selectedFacultyId) params.append('facultyId', selectedFacultyId);
      if (selectedDepartmentId) params.append('departmentId', selectedDepartmentId);
      
      const response = await fetch(`${API_URL}/students/all?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const result = await response.json();
      
      if (result.success || result.students) {
        const studentList = result.students || result.data || [];
        setStudents(studentList);
        
        // Tự động chọn lớp đầu tiên nếu có
        if (studentList.length > 0) {
          const classes = [...new Set(studentList.map((s: any) => s.class).filter((c: string) => c && c.trim() !== ''))];
          if (classes.length > 0 && !selectedClassStr) {
            const firstClass = classes[0];
            if (firstClass && typeof firstClass === 'string') {
              setSelectedClassStr(firstClass);
            } else {
              setSelectedClassStr(String(firstClass ?? ''));
            }
          }
        }
      } else {
        Alert.alert('Thất bại', result.message || 'Không thể lấy dữ liệu sinh viên');
        setStudents([]);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Mất kết nối tới server');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  // Khởi tạo data ban đầu
  useEffect(() => {
    fetchSemesters();
    fetchFaculties();
    fetchDepartments();
  }, []);

  // Khi học kỳ, khoa, ngành thay đổi -> Tải lại danh sách sinh viên
  useEffect(() => {
    if (selectedSemester) {
      fetchStudentsByFilters();
    }
  }, [selectedSemester, selectedFacultyId, selectedDepartmentId]);

  // Lấy danh sách Lớp từ sinh viên đã lọc
  const availableClasses = useMemo(() => {
    const classSet = new Set(students.map(s => s.class).filter(c => c && c.trim() !== ''));
    return Array.from(classSet).sort();
  }, [students]);

  // Tự động chọn Lớp đầu tiên khi danh sách thay đổi
  useEffect(() => {
    if (availableClasses.length > 0) {
      if (!selectedClassStr || !availableClasses.includes(selectedClassStr)) {
        setSelectedClassStr(availableClasses[0]);
      }
    } else {
      setSelectedClassStr(null);
    }
  }, [availableClasses]);

  // Danh sách sinh viên cuối cùng - Lọc theo lớp
  const filteredStudents = useMemo(() => {
    if (!selectedClassStr) return students;
    return students.filter(s => s.class === selectedClassStr);
  }, [students, selectedClassStr]);

  // Xử lý khi đổi Khoa
  const handleSelectFaculty = (facultyId: string) => {
    setSelectedFacultyId(facultyId);
    setShowFacultyModal(false);
    // Reset ngành khi đổi khoa
    const deptInFaculty = departments.filter(d => d.facultyId === facultyId);
    if (deptInFaculty.length > 0) {
      setSelectedDepartmentId(deptInFaculty[0]._id);
    } else {
      setSelectedDepartmentId(null);
    }
  };

  // Xử lý khi đổi Ngành
  const handleSelectDepartment = (departmentId: string) => {
    setSelectedDepartmentId(departmentId);
    setShowDepartmentModal(false);
  };

  const changeLocalPoint = (id: string, value: string) => {
    const point = parseInt(value) || 0;
    setStudents(prev => prev.map(s => 
      (s._id === id || s.id === id) ? { ...s, trainingPoint: point } : s
    ));
  };

  // Lưu điểm xuống backend
  const savePoint = async (id: string, point: number) => {
    if (!selectedSemester) {
      return Alert.alert('Lỗi', 'Vui lòng chọn học kỳ!');
    }
    if (point < 0 || point > 100) {
      return Alert.alert('Cảnh báo', 'Điểm rèn luyện từ 0 đến 100!');
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
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chấm Điểm Rèn Luyện</Text>
        <TouchableOpacity onPress={fetchStudentsByFilters}>
          <Ionicons name="refresh" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Chọn Học Kỳ */}
      <View style={styles.semesterContainer}>
        <Text style={styles.semesterLabel}>Học kỳ:</Text>
        <TouchableOpacity style={styles.semesterSelector} onPress={() => setShowSemesterModal(true)}>
          <Text style={styles.semesterSelectorText}>
            {selectedSemester ? `Học kỳ ${selectedSemester.semesterNumber}` : "Đang tải..."}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#555" />
        </TouchableOpacity>
      </View>

      {/* Bộ lọc Khoa, Ngành, Lớp */}
      <View style={styles.filterContainer}>
        {/* Lọc Khoa */}
        <TouchableOpacity style={styles.filterBox} onPress={() => setShowFacultyModal(true)}>
          <Text style={styles.filterLabel}>Khoa:</Text>
          <Text style={styles.filterValue} numberOfLines={1}>
            {selectedFacultyId 
              ? faculties.find(f => f._id === selectedFacultyId)?.name || 'Chọn Khoa'
              : 'Chọn Khoa'}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#777" />
        </TouchableOpacity>

        {/* Lọc Ngành */}
        <TouchableOpacity 
          style={styles.filterBox} 
          onPress={() => setShowDepartmentModal(true)}
          disabled={!selectedFacultyId}
        >
          <Text style={styles.filterLabel}>Ngành:</Text>
          <Text style={styles.filterValue} numberOfLines={1}>
            {selectedDepartmentId 
              ? departments.find(d => d._id === selectedDepartmentId)?.name || 'Chọn Ngành'
              : 'Chọn Ngành'}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#777" />
        </TouchableOpacity>

        {/* Lọc Lớp */}
        <TouchableOpacity 
          style={styles.filterBox} 
          onPress={() => setShowClassModal(true)}
          disabled={availableClasses.length === 0}
        >
          <Text style={styles.filterLabel}>Lớp:</Text>
          <Text style={styles.filterValue} numberOfLines={1}>
            {selectedClassStr ? selectedClassStr : 'Chọn Lớp'}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#777" />
        </TouchableOpacity>
      </View>

      {/* Danh sách sinh viên */}
      {loading ? (
        <ActivityIndicator size="large" color="#4CAF50" style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={filteredStudents}
          keyExtractor={(item) => item._id || item.id || ''}
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
                  onChangeText={(val) => changeLocalPoint(item._id || item.id || '', val)}
                  maxLength={3}
                />
                <TouchableOpacity 
                  style={styles.btnSave} 
                  onPress={() => savePoint(item._id || item.id || '', item.trainingPoint || 0)}
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
            <Text style={styles.emptyText}>
              {students.length === 0 
                ? 'Chưa có dữ liệu sinh viên với bộ lọc này' 
                : 'Không có sinh viên trong lớp này'}
            </Text>
          }
        />
      )}

      {/* Modal Chọn Học Kỳ */}
      <Modal visible={showSemesterModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Chọn học kỳ</Text>
            <FlatList
              data={semesters}
              keyExtractor={(item) => item._id || item.semesterNumber.toString()}
              renderItem={({item}) => (
                <TouchableOpacity 
                  style={[styles.modalItem, selectedSemester?.semesterNumber === item.semesterNumber && styles.modalItemSelected]}
                  onPress={() => {
                    setSelectedSemester(item);
                    setShowSemesterModal(false);
                  }}
                >
                  <Text style={[styles.modalItemText, selectedSemester?.semesterNumber === item.semesterNumber && styles.modalItemTextSelected]}>
                    Học kỳ {item.semesterNumber} {item.academicYear ? `(${item.academicYear})` : ''}
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

      {/* Modal Chọn Khoa */}
      <Modal visible={showFacultyModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Chọn Khoa</Text>
            <FlatList
              data={faculties}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[styles.modalItem, selectedFacultyId === item._id && styles.modalItemSelected]}
                  onPress={() => handleSelectFaculty(item._id)}
                >
                  <Text style={[styles.modalItemText, selectedFacultyId === item._id && styles.modalItemTextSelected]}>
                    {item.name} ({item.code})
                  </Text>
                  {selectedFacultyId === item._id && (
                    <Ionicons name="checkmark" size={20} color="#4CAF50" />
                  )}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowFacultyModal(false)}>
              <Text style={styles.modalCloseText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Chọn Ngành */}
      <Modal visible={showDepartmentModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Chọn Ngành</Text>
            <FlatList
              data={departments.filter(d => d.facultyId === selectedFacultyId)}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[styles.modalItem, selectedDepartmentId === item._id && styles.modalItemSelected]}
                  onPress={() => handleSelectDepartment(item._id)}
                >
                  <Text style={[styles.modalItemText, selectedDepartmentId === item._id && styles.modalItemTextSelected]}>
                    {item.name} ({item.code})
                  </Text>
                  {selectedDepartmentId === item._id && (
                    <Ionicons name="checkmark" size={20} color="#4CAF50" />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={{textAlign: 'center', marginTop: 10, color: '#888'}}>
                  {selectedFacultyId ? 'Chưa có ngành nào' : 'Vui lòng chọn khoa trước'}
                </Text>
              }
            />
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowDepartmentModal(false)}>
              <Text style={styles.modalCloseText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Chọn Lớp */}
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
                  {selectedClassStr === item && (
                    <Ionicons name="checkmark" size={20} color="#4CAF50" />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={{textAlign: 'center', marginTop: 10, color: '#888'}}>
                  Không có lớp nào
                </Text>
              }
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
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    padding: 16, 
    backgroundColor: '#fff', 
    alignItems: 'center', 
    borderBottomWidth: 1, 
    borderBottomColor: '#eee' 
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  
  semesterContainer: { 
    flexDirection: 'row', 
    paddingHorizontal: 16, 
    paddingTop: 12, 
    paddingBottom: 6, 
    backgroundColor: '#fff', 
    alignItems: 'center'
  },
  semesterLabel: { 
    fontSize: 14, 
    color: '#555', 
    marginRight: 10, 
    fontWeight: '500', 
    width: 55 
  },
  semesterSelector: { 
    flex: 1, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: '#f0f4f8', 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: '#d0d7de' 
  },
  semesterSelectorText: { 
    fontSize: 15, 
    fontWeight: '600', 
    color: '#333' 
  },

  filterContainer: { 
    flexDirection: 'row', 
    paddingHorizontal: 16, 
    paddingBottom: 12, 
    backgroundColor: '#fff', 
    gap: 8, 
    borderBottomWidth: 1, 
    borderBottomColor: '#eee',
    flexWrap: 'wrap'
  },
  filterBox: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#f9f9f9', 
    paddingHorizontal: 10, 
    paddingVertical: 8, 
    borderRadius: 6, 
    borderWidth: 1, 
    borderColor: '#e0e0e0',
    minWidth: 100
  },
  filterLabel: { 
    fontSize: 12, 
    color: '#666', 
    marginRight: 4,
    fontWeight: '500'
  },
  filterValue: { 
    flex: 1, 
    fontSize: 12, 
    fontWeight: '600', 
    color: '#333' 
  },
  
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  modalContent: { 
    width: '85%', 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 20, 
    maxHeight: '60%' 
  },
  modalTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginBottom: 15, 
    textAlign: 'center' 
  },
  modalItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingVertical: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: '#eee' 
  },
  modalItemSelected: { 
    backgroundColor: '#e8f5e9', 
    borderRadius: 4 
  },
  modalItemText: { 
    fontSize: 15, 
    color: '#333' 
  },
  modalItemTextSelected: { 
    color: '#4CAF50', 
    fontWeight: 'bold' 
  },
  modalCloseBtn: { 
    marginTop: 16, 
    padding: 12, 
    backgroundColor: '#f0f0f0', 
    borderRadius: 8, 
    alignItems: 'center' 
  },
  modalCloseText: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#555' 
  },

  studentCard: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    backgroundColor: '#fff', 
    padding: 16, 
    borderRadius: 8, 
    marginBottom: 12, 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#eee' 
  },
  nameText: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#333' 
  },
  subText: { 
    fontSize: 13, 
    color: '#777', 
    marginTop: 2 
  },
  scoreAction: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  inputScore: { 
    borderBottomWidth: 1, 
    borderColor: '#4CAF50', 
    width: 50, 
    textAlign: 'center', 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginRight: 12, 
    paddingVertical: 2 
  },
  btnSave: { 
    backgroundColor: '#4CAF50', 
    padding: 8, 
    borderRadius: 6 
  },
  emptyText: { 
    textAlign: 'center', 
    marginTop: 30, 
    color: '#888', 
    fontSize: 15 
  }
});