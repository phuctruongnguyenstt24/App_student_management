import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from '../../a_styles/style_STU_achievement';
import { API_URL } from '../../config/api';

// Interfaces
interface Faculty { _id: string; name: string; code: string; }
interface Department { _id: string; name: string; code: string; facultyId: string; }

interface Course {
  _id: string;
  courseCode: string;
  courseName: string;
  credits: number;
  department: string; // Tên khoa
  description?: string;
  semester?: string; // Học kỳ (VD: "HK1", "HK2")
  course?: string; // Năm học (VD: "2023-2024")
  departmentIds?: string[]; // Danh sách ID ngành áp dụng
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

export default function StudentAchievements() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Dữ liệu từ API
  const [allRawStudents, setAllRawStudents] = useState<Student[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  // Bộ lọc
  const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<string | null>(null); // Lưu string "HK1", "HK2"
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);

  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [studentsData, setStudentsData] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [midtermScore, setMidtermScore] = useState('');
  const [finalScore, setFinalScore] = useState('');

  // Lấy danh sách năm học từ courses (giống courses.tsx)
  const getAcademicYearOptions = () => {
    const yearSet = new Set<string>();
    courses.forEach(course => {
      if (course.course) {
        yearSet.add(course.course);
      }
    });
    // Nếu không có dữ liệu từ courses, dùng mặc định
    if (yearSet.size === 0) {
      const currentYear = new Date().getFullYear();
      const options = [];
      for (let i = -3; i <= 3; i++) {
        const year = currentYear + i;
        options.push(`${year}-${year + 1}`);
      }
      return options;
    }
    return Array.from(yearSet).sort();
  };

  // Lấy danh sách học kỳ từ courses (giống courses.tsx)
  const semesterOptions = ['HK1', 'HK2', 'HK3'];

  const yearOptions = useMemo(() => getAcademicYearOptions(), [courses]);

  // Lọc môn học theo Khoa và học kỳ.
  // LƯU Ý: API /courses hiện tại trả về:
  //   - "department" là TÊN KHOA dạng string (vd "Khoa Công nghệ thông tin"),
  //     KHÔNG phải mảng ID ngành ("departmentIds") như code cũ giả định.
  //   - KHÔNG có field năm học ("course"), nên tạm thời không thể lọc theo năm học
  //     cho tới khi backend bổ sung field này.
  // Nếu code cũ lọc theo departmentIds/năm học, kết quả luôn rỗng vì 2 field
  // đó không tồn tại trong dữ liệu thật -> đây là nguyên nhân môn học biến mất.
  const filteredCourses = useMemo(() => {
    let filtered = courses;

    // Lọc theo Khoa (so khớp tên Khoa, vì API không có ID ngành liên kết với course)
    if (selectedFaculty) {
      filtered = filtered.filter(course => course.department === selectedFaculty.name);
    }

    // Lọc theo học kỳ
    if (selectedSemester) {
      filtered = filtered.filter(course => course.semester === selectedSemester);
    }

    // TODO: khi backend bổ sung field năm học cho course, thêm lại điều kiện:
    // if (selectedYear) filtered = filtered.filter(course => course.course === selectedYear);

    return filtered;
  }, [courses, selectedFaculty, selectedSemester]);

  // Load dữ liệu ban đầu
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      // Fetch dữ liệu giống courses.tsx
      const [facultiesRes, studentsRes, deptRes, coursesRes] = await Promise.all([
        fetch(`${API_URL}/faculties`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/students/all`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/departments`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/courses`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const facData = await facultiesRes.json();
      const stdData = await studentsRes.json();
      const deptData = await deptRes.json();
      const coursesData = await coursesRes.json();

      // Xử lý Khoa
      if (facData.success) setFaculties(facData.faculties || []);
      
      // Xử lý Ngành
      if (deptData.success) setDepartments(deptData.departments || []);
      
      // Xử lý Sinh viên
      if (stdData.success) setAllRawStudents(stdData.students || []);

      // Xử lý Môn học - chuẩn hóa dữ liệu giống courses.tsx
      if (coursesData.success) {
        // DEBUG: kiểm tra cấu trúc thật của course trả về từ API
        // so sánh field departmentIds / semester / course với điều kiện filter bên dưới
        console.log('coursesData.data.length =', coursesData.data?.length);
        console.log('RAW COURSE SAMPLE:', JSON.stringify(coursesData.data?.[0], null, 2));

        const normalizedCourses = coursesData.data.map((course: any) => ({
          ...course,
          departmentIds: course.departmentIds || [],
          semester: course.semester || '',
          course: course.course || '',
        }));
        setCourses(normalizedCourses);
      } else {
        console.log('coursesData KHÔNG success:', JSON.stringify(coursesData));
      }

      // Set Khoa mặc định (dùng facData trực tiếp thay vì state "faculties" vì
      // setFaculties() chưa kịp cập nhật state trong cùng lần chạy hàm này)
      if (facData.success && facData.faculties?.length > 0) {
        setSelectedFaculty(facData.faculties[0]);
      }

      // Học kỳ và năm học sẽ được set mặc định bằng các useEffect riêng
      // (dựa trên filteredCourses/availableClasses) ở dưới, không set ở đây
      // vì "yearOptions" / "filteredCourses" đọc tại đây vẫn là giá trị cũ (stale).

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

  // Cập nhật selectedCourse khi filteredCourses thay đổi
  useEffect(() => {
    if (filteredCourses.length > 0) {
      if (!selectedCourse || !filteredCourses.some(c => c._id === selectedCourse._id)) {
        setSelectedCourse(filteredCourses[0]);
      }
    } else {
      setSelectedCourse(null);
    }
  }, [filteredCourses]);

  // Tự động chọn lớp đầu tiên khi có dữ liệu
  useEffect(() => {
    if (availableClasses.length > 0) {
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
      // Sử dụng semester từ Course hoặc tạo từ selectedSemester
      const semesterCode = selectedCourse?.semester || `${selectedSemester}-${selectedYear}`;

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
      // Sử dụng semester từ Course hoặc tạo từ selectedSemester
      const semesterCode = selectedCourse?.semester || `${selectedSemester}-${selectedYear}`;

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
          setSelectedCourse(null);
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
          setSelectedCourse(null);
        };
        break;
      case 'year':
        title = 'Chọn Năm học';
        data = yearOptions;
        renderItem = (item) => item;
        isSelected = (item) => selectedYear === item;
        onSelect = (item) => {
          setSelectedYear(item);
          setSelectedCourse(null); // Reset course khi đổi năm
        };
        break;
      case 'semester':
        title = 'Chọn Học kỳ';
        data = semesterOptions;
        renderItem = (item) => item;
        isSelected = (item) => selectedSemester === item;
        onSelect = (item) => {
          setSelectedSemester(item);
          setSelectedCourse(null); // Reset course khi đổi học kỳ
        };
        break;
      case 'course':
        title = 'Chọn Môn học';
        data = filteredCourses;
        renderItem = (item) => `${item.courseCode} - ${item.courseName} (${item.credits} TC)`;
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
            <Text style={styles.filterLabel}>Năm học</Text>
            <Text style={styles.filterValue}>{selectedYear || 'Chọn'}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterBox, !selectedYear && styles.disabledBox]} 
            onPress={() => selectedYear && setActiveFilter('semester')}
          >
            <Text style={styles.filterLabel}>Học kỳ</Text>
            <Text style={styles.filterValue}>{selectedSemester || 'Chọn'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filterRow}>
          <TouchableOpacity 
            style={[styles.filterBox, !selectedSemester && styles.disabledBox]} 
            onPress={() => selectedSemester && setActiveFilter('course')}
          >
            <Text style={styles.filterLabel}>Môn học</Text>
            <Text style={styles.filterValue} numberOfLines={1}>
              {selectedCourse ? ` ${selectedCourse.courseName}` : 'Chọn'}
            </Text>
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
            <Text style={styles.courseText}>
              Mã môn: {selectedCourse?.courseCode} | {selectedCourse?.credits} tín chỉ
              {selectedCourse?.semester && ` | HK: ${selectedCourse.semester}`}
              {selectedCourse?.course && ` | NH: ${selectedCourse.course}`}
            </Text>

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