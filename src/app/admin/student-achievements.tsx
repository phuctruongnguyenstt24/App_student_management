import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL } from '../../config/api';

// Interfaces
interface Faculty { _id: string; name: string; code: string; }
interface Department { _id: string; name: string; code: string; facultyId: string; }
interface Semester { _id: string; semesterNumber: number; academicYear?: string; }
interface Course { _id: string; courseCode: string; courseName: string; credits: number; }
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

export default function StudentAchievements() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Dữ liệu từ API
  const [allRawStudents, setAllRawStudents] = useState<Student[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  // Bộ lọc
  const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<Semester | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);

  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [studentsData, setStudentsData] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [midtermScore, setMidtermScore] = useState('');
  const [finalScore, setFinalScore] = useState('');

  const yearOptions = ['2023', '2024', '2025', '2026'];

  // Load dữ liệu ban đầu
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const [facultiesRes, studentsRes, curriculumRes, deptRes, coursesRes] = await Promise.all([
        fetch(`${API_URL}/faculties`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/students/all`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/curriculum`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/departments`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/courses`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const facData = await facultiesRes.json();
      const stdData = await studentsRes.json();
      const curData = await curriculumRes.json();
      const deptData = await deptRes.json();
      const coursesData = await coursesRes.json();

      // Xử lý Khoa
      if (facData.success) setFaculties(facData.faculties || []);
      
      // Xử lý Ngành
      if (deptData.success) setDepartments(deptData.departments || []);
      
      // Xử lý Sinh viên
      if (stdData.success) setAllRawStudents(stdData.students || []);

      // Xử lý Môn học
      if (coursesData.success) setCourses(coursesData.data || []);

      // Xử lý Học kỳ
      let semesterList: Semester[] = [];
      const curriculumData = curData.success ? curData.data : curData;
      if (Array.isArray(curriculumData)) {
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
      
      if (semesterList.length === 0) {
        semesterList = [
          { _id: '1', semesterNumber: 1 },
          { _id: '2', semesterNumber: 2 },
          { _id: '3', semesterNumber: 3 }
        ];
      }
      
      setSemesters(semesterList.sort((a, b) => a.semesterNumber - b.semesterNumber));
      
      // Set mặc định
      if (faculties.length > 0) setSelectedFaculty(faculties[0]);
      if (semesterList.length > 0) setSelectedSemester(semesterList[0]);
      if (yearOptions.length > 0) setSelectedYear(yearOptions[0]);
      if (courses.length > 0) setSelectedCourse(courses[0]);

    } catch (error) {
      Alert.alert("Lỗi", "Không thể tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  // Lọc Ngành theo Khoa
  const filteredDepartments = useMemo(() => {
    if (!selectedFaculty) return [];
    return departments.filter(d => d.facultyId === selectedFaculty._id);
  }, [departments, selectedFaculty]);

  // Lọc Sinh viên theo Khoa và Ngành
  const filteredStudentsByFacultyDept = useMemo(() => {
    let result = allRawStudents;
    if (selectedFaculty) {
      result = result.filter(s => s.facultyId === selectedFaculty._id);
    }
    if (selectedDepartment) {
      result = result.filter(s => s.departmentId === selectedDepartment._id);
    }
    return result;
  }, [allRawStudents, selectedFaculty, selectedDepartment]);

  // Lấy danh sách lớp từ sinh viên đã lọc theo Khoa + Ngành
  const availableClasses = useMemo(() => {
    const classSet = new Set(
      filteredStudentsByFacultyDept
        .map(s => s.class)
        .filter(c => c && c.trim() !== '')
    );
    return Array.from(classSet).sort();
  }, [filteredStudentsByFacultyDept]);

  // Tự động chọn lớp đầu tiên khi có dữ liệu
  useEffect(() => {
    if (availableClasses.length > 0) {
      // Nếu chưa có lớp hoặc lớp đang chọn không có trong danh sách mới
      if (!selectedClass || !availableClasses.includes(selectedClass)) {
        setSelectedClass(availableClasses[0]);
      }
    } else {
      setSelectedClass(null);
    }
  }, [availableClasses]);

  // Load điểm khi có đủ filter
  useEffect(() => {
    if (selectedFaculty && selectedDepartment && selectedYear && selectedSemester && selectedCourse && selectedClass) {
      loadGradesAndMerge();
    }
  }, [selectedFaculty, selectedDepartment, selectedYear, selectedSemester, selectedCourse, selectedClass]);

  const loadGradesAndMerge = async () => {
    if (!selectedClass) return;
    
    setLoading(true);
    try {
      const targetStudents = allRawStudents.filter(s => s.class === selectedClass);
      if (targetStudents.length === 0) {
        setStudentsData([]);
        setLoading(false);
        return;
      }

      const token = await AsyncStorage.getItem('token');
      const semesterCode = `HK${selectedSemester?.semesterNumber}-${selectedYear}`;

      const res = await fetch(`${API_URL}/grades/admin?semester=${semesterCode}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const gradesResult = await res.json();
      const rawGrades = gradesResult.success ? (gradesResult.data || []) : [];

      const processedStudents = targetStudents.map((student: Student) => {
        const foundGrade = rawGrades.find((g: any) =>
          (g.student?.studentId === student.studentId || g.student?._id === student._id) &&
          (g.course?.courseCode === selectedCourse?.courseCode || g.courseCode === selectedCourse?.courseCode)
        );
        return foundGrade 
          ? { ...foundGrade, student } 
          : { 
              _id: `empty_${student._id}`, 
              student, 
              midtermScore: null, 
              finalScore: null,
              course: { courseCode: selectedCourse?.courseCode, courseName: selectedCourse?.courseName }
            };
      });

      setStudentsData(processedStudents);
    } catch (error) {
      console.error("Lỗi trộn điểm:", error);
      Alert.alert("Lỗi", "Không thể tải điểm");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGrade = async () => {
    if (!selectedStudent || !selectedCourse || !selectedSemester || !selectedYear) {
      Alert.alert("Lỗi", "Vui lòng chọn đầy đủ thông tin");
      return;
    }

    const mScore = midtermScore.trim() !== '' ? Number(midtermScore) : null;
    const fScore = finalScore.trim() !== '' ? Number(finalScore) : null;

    if ((mScore !== null && (isNaN(mScore) || mScore < 0 || mScore > 10)) ||
        (fScore !== null && (isNaN(fScore) || fScore < 0 || fScore > 10))) {
      Alert.alert("Lỗi", "Điểm hệ 10 phải từ 0 đến 10");
      return;
    }

    try {
      setSubmittingId(selectedStudent.studentId);
      const token = await AsyncStorage.getItem('token');
      const semesterCode = `HK${selectedSemester.semesterNumber}-${selectedYear}`;

      // Optimistic UI
      setStudentsData(prevData => prevData.map(item => {
        if (item.student?.studentId === selectedStudent.studentId) {
          return { ...item, midtermScore: mScore, finalScore: fScore };
        }
        return item;
      }));

      const res = await fetch(`${API_URL}/grades/admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          studentCode: selectedStudent.studentId,
          courseCode: selectedCourse.courseCode,
          semester: semesterCode,
          midtermScore: mScore,
          finalScore: fScore
        })
      });
      
      const result = await res.json();
      if (result.success || res.ok) {
        Alert.alert("Thành công", `Đã lưu điểm cho ${selectedStudent.fullName}!`);
        setModalVisible(false);
        // Load lại dữ liệu để đồng bộ
        loadGradesAndMerge();
      } else {
        Alert.alert("Lỗi", result.message || "Lưu thất bại");
        loadGradesAndMerge();
      }
    } catch (error) {
      Alert.alert("Lỗi", "Không thể lưu điểm");
      loadGradesAndMerge();
    } finally {
      setSubmittingId(null);
    }
  };

  // Render modal chọn filter
  const renderFilterModal = () => {
    let data: any[] = [];
    let title = '';
    let renderItem = (item: any) => '';
    let onSelect = (item: any) => {};
    let isSelected = (item: any) => false;

    switch (activeFilter) {
      case 'faculty':
        title = 'Chọn Khoa';
        data = faculties;
        renderItem = (item) => item.name;
        isSelected = (item) => selectedFaculty?._id === item._id;
        onSelect = (item) => { 
          setSelectedFaculty(item); 
          setSelectedDepartment(null); 
          setSelectedClass(null); 
        };
        break;
      case 'department':
        title = 'Chọn Ngành';
        data = filteredDepartments;
        renderItem = (item) => item.name;
        isSelected = (item) => selectedDepartment?._id === item._id;
        onSelect = (item) => { 
          setSelectedDepartment(item); 
          setSelectedClass(null); 
        };
        break;
      case 'year':
        title = 'Chọn Năm';
        data = yearOptions;
        renderItem = (item) => item;
        isSelected = (item) => selectedYear === item;
        onSelect = (item) => setSelectedYear(item);
        break;
      case 'semester':
        title = 'Chọn Học kỳ';
        data = semesters;
        renderItem = (item) => `HK${item.semesterNumber}`;
        isSelected = (item) => selectedSemester?.semesterNumber === item.semesterNumber;
        onSelect = (item) => { setSelectedSemester(item); };
        break;
      case 'course':
        title = 'Chọn Môn học';
        data = courses;
        renderItem = (item) => `${item.courseCode} - ${item.courseName}`;
        isSelected = (item) => selectedCourse?._id === item._id;
        onSelect = (item) => setSelectedCourse(item);
        break;
      case 'class':
        title = 'Chọn Lớp';
        data = availableClasses;
        renderItem = (item) => item;
        isSelected = (item) => selectedClass === item;
        onSelect = (item) => setSelectedClass(item);
        break;
      default: return null;
    }

    return (
      <Modal visible={activeFilter !== null} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{title}</Text>
            <FlatList
              data={data}
              keyExtractor={(item, idx) => item._id || item.code || item.toString() + idx}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, isSelected(item) && styles.modalItemSelected]}
                  onPress={() => { onSelect(item); setActiveFilter(null); }}
                >
                  <Text style={[styles.modalItemText, isSelected(item) && styles.modalItemTextSelected]}>
                    {renderItem(item)}
                  </Text>
                  {isSelected(item) && <Ionicons name="checkmark" size={20} color="#4CAF50" />}
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.emptyText}>Không có dữ liệu</Text>}
            />
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setActiveFilter(null)}>
              <Text style={styles.modalCloseText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nhập Điểm</Text>
        <TouchableOpacity onPress={loadGradesAndMerge}>
          <Ionicons name="refresh" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Bộ lọc */}
      <View style={styles.filtersContainer}>
        <View style={styles.filterRow}>
          <TouchableOpacity style={styles.filterBox} onPress={() => setActiveFilter('faculty')}>
            <Text style={styles.filterLabel}>Khoa</Text>
            <Text style={styles.filterValue}>{selectedFaculty?.name || 'Chọn'}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterBox, !selectedFaculty && styles.disabledBox]} 
            onPress={() => selectedFaculty && setActiveFilter('department')}
          >
            <Text style={styles.filterLabel}>Ngành</Text>
            <Text style={styles.filterValue}>{selectedDepartment?.name || 'Chọn'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filterRow}>
          <TouchableOpacity 
            style={[styles.filterBox, !selectedDepartment && styles.disabledBox]} 
            onPress={() => selectedDepartment && setActiveFilter('year')}
          >
            <Text style={styles.filterLabel}>Năm</Text>
            <Text style={styles.filterValue}>{selectedYear || 'Chọn'}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterBox, !selectedYear && styles.disabledBox]} 
            onPress={() => selectedYear && setActiveFilter('semester')}
          >
            <Text style={styles.filterLabel}>Học kỳ</Text>
            <Text style={styles.filterValue}>{selectedSemester ? `HK${selectedSemester.semesterNumber}` : 'Chọn'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filterRow}>
          <TouchableOpacity 
            style={[styles.filterBox, !selectedSemester && styles.disabledBox]} 
            onPress={() => selectedSemester && setActiveFilter('course')}
          >
            <Text style={styles.filterLabel}>Môn học</Text>
            <Text style={styles.filterValue} numberOfLines={1}>{selectedCourse?.courseName || 'Chọn'}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterBox, !selectedCourse && styles.disabledBox]} 
            onPress={() => selectedCourse && setActiveFilter('class')}
          >
            <Text style={styles.filterLabel}>Lớp</Text>
            <Text style={styles.filterValue}>
              {selectedClass || (availableClasses.length > 0 ? 'Chọn lớp' : 'Không có lớp')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Danh sách sinh viên */}
      {loading ? (
        <ActivityIndicator size="large" color="#2563EB" style={{ flex: 1 }} />
      ) : !selectedClass ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="funnel-outline" size={60} color="#ccc" />
          <Text style={styles.emptyText}>
            {availableClasses.length === 0 
              ? 'Không có lớp nào trong ngành này' 
              : 'Chọn lớp để xem danh sách sinh viên'}
          </Text>
        </View>
      ) : studentsData.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="people-outline" size={60} color="#ccc" />
          <Text style={styles.emptyText}>Không có sinh viên trong lớp {selectedClass}</Text>
        </View>
      ) : (
        <FlatList
          data={studentsData}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View style={styles.studentCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.nameText}>{item.student?.fullName}</Text>
                <Text style={styles.subText}>MSSV: {item.student?.studentId}</Text>
                <Text style={styles.scoreText}>
                  GK: <Text style={{ fontWeight: 'bold' }}>{item.midtermScore ?? '-'}</Text> |
                  CK: <Text style={{ fontWeight: 'bold' }}>{item.finalScore ?? '-'}</Text>
                </Text>
              </View>
              <TouchableOpacity
                style={styles.btnInput}
                onPress={() => {
                  setSelectedStudent(item.student);
                  setMidtermScore(item.midtermScore != null ? item.midtermScore.toString() : '');
                  setFinalScore(item.finalScore != null ? item.finalScore.toString() : '');
                  setModalVisible(true);
                }}
              >
                <Ionicons name="pencil" size={20} color="#fff" />
                <Text style={styles.btnInputText}>Nhập</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {renderFilterModal()}

      {/* Modal nhập điểm */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlayBs} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <View style={styles.modalContentBs}>
            <View style={styles.dragHandle} />
            <Text style={styles.modalTitleBs}>Nhập điểm</Text>
            <Text style={styles.studentSubtitle}>{selectedStudent?.fullName} - {selectedStudent?.studentId}</Text>
            <Text style={styles.courseText}>{selectedCourse?.courseName}</Text>

            <View style={styles.scoreInputRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.labelBs}>Giữa kỳ</Text>
                <TextInput 
                  style={styles.inputBs} 
                  keyboardType="numeric" 
                  placeholder="0-10" 
                  value={midtermScore} 
                  onChangeText={setMidtermScore} 
                />
              </View>
              <View style={{ width: 16 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.labelBs}>Cuối kỳ</Text>
                <TextInput 
                  style={styles.inputBs} 
                  keyboardType="numeric" 
                  placeholder="0-10" 
                  value={finalScore} 
                  onChangeText={setFinalScore} 
                />
              </View>
            </View>

            <TouchableOpacity 
              style={styles.btnSaveBs} 
              onPress={handleSaveGrade} 
              disabled={!!submittingId}
            >
              {submittingId ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={20} color="#fff" />
                  <Text style={styles.btnSaveTextBs}>Lưu điểm</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f9' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111' },

  filtersContainer: { padding: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  filterRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  filterBox: { flex: 1, backgroundColor: '#f8f9fa', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#dcdfe3', marginHorizontal: 4 },
  disabledBox: { backgroundColor: '#eef0f2', opacity: 0.6 },
  filterLabel: { fontSize: 10, color: '#666', fontWeight: 'bold', textTransform: 'uppercase' },
  filterValue: { fontSize: 13, color: '#333', fontWeight: '600', marginTop: 2 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#fff', borderRadius: 12, padding: 20, maxHeight: '70%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  modalItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalItemSelected: { backgroundColor: '#e8f5e9' },
  modalItemText: { fontSize: 15, color: '#333' },
  modalItemTextSelected: { color: '#4CAF50', fontWeight: 'bold' },
  modalCloseBtn: { marginTop: 20, padding: 12, backgroundColor: '#f0f0f0', borderRadius: 8, alignItems: 'center' },
  modalCloseText: { fontSize: 16, fontWeight: '600', color: '#555' },

  studentCard: { flexDirection: 'row', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 2, alignItems: 'center' },
  nameText: { fontSize: 16, fontWeight: 'bold', color: '#222' },
  subText: { fontSize: 13, color: '#666', marginTop: 2 },
  scoreText: { fontSize: 12, color: '#555', marginTop: 4 },
  btnInput: { flexDirection: 'row', backgroundColor: '#2563EB', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  btnInputText: { color: '#fff', fontWeight: 'bold', marginLeft: 6 },
  emptyText: { textAlign: 'center', marginTop: 16, color: '#888', fontSize: 14 },

  modalOverlayBs: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContentBs: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  dragHandle: { width: 40, height: 5, backgroundColor: '#ccc', borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
  modalTitleBs: { fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
  studentSubtitle: { fontSize: 15, color: '#666', textAlign: 'center', marginBottom: 8 },
  courseText: { fontSize: 15, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  scoreInputRow: { flexDirection: 'row', marginBottom: 24 },
  labelBs: { fontSize: 12, fontWeight: 'bold', color: '#666', marginBottom: 6 },
  inputBs: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ccc', borderRadius: 10, padding: 14, fontSize: 16 },
  btnSaveBs: { backgroundColor: '#2563EB', paddingVertical: 16, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  btnSaveTextBs: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});