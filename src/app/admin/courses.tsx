// app/admin/courses.tsx
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { styles } from '../../a_styles/style_courses';
import { API_URL } from '../../config/api';
import { closeAttendanceSession, getAttendanceSessions, upsertAttendanceSession, type AttendanceSession } from '../../utils/attendanceStorage';

interface Course {
  _id: string;
  courseCode: string;
  courseName: string;
  credits: number;
  department: string;
  description?: string;
  semester?: string;
}

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

const localStyles = StyleSheet.create({
  attendancePanel: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  attendanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  attendanceTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  attendanceSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  closeButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  attendanceCourse: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2563eb',
    marginBottom: 4,
  },
  attendanceMeta: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  studentList: {
    marginTop: 6,
  },
  studentItem: {
    fontSize: 13,
    color: '#374151',
    marginBottom: 4,
  },
  sessionCard: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
    backgroundColor: '#f9fafb',
  },
  sessionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 20,
  },
  // History panel
  historyPanel: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  historySubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  historyCard: {
    borderWidth: 1,
    borderColor: '#d1fae5',
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
    backgroundColor: '#f0fdf4',
  },
  historyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  closedBadge: {
    backgroundColor: '#6b7280',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  closedBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  historyCourseName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  historyMeta: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
    marginBottom: 6,
  },
  presentCount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#16a34a',
    marginBottom: 4,
  },
});

export default function CoursesScreen() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [attendanceSessions, setAttendanceSessions] = useState<AttendanceSession[]>([]);

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [facultyModal, setFacultyModal] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null);
  const [deptModal, setDeptModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [selectedFacultyId, setSelectedFacultyId] = useState('');

  // Form states
  const [courseCode, setCourseCode] = useState('');
  const [courseName, setCourseName] = useState('');
  const [credits, setCredits] = useState('');
  const [department, setDepartment] = useState('');
  const [description, setDescription] = useState('');
  const [semester, setSemester] = useState('');
  const [facultyName, setFacultyName] = useState('');
  const [facultyCode, setFacultyCode] = useState('');
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');

  const refreshAttendance = useCallback(async () => {
    const sessions = await getAttendanceSessions();
    setAttendanceSessions(sessions);
  }, []);

  // Fetch data
  const fetchData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) { router.replace('/login'); return; }

      const [coursesRes, facultiesRes, deptsRes] = await Promise.all([
        fetch(`${API_URL}/courses`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/faculties`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/departments`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const coursesData = await coursesRes.json();
      const facultiesData = await facultiesRes.json();
      const deptsData = await deptsRes.json();

      if (coursesData.success) setCourses(coursesData.data || []);
      if (facultiesData.success) setFaculties(facultiesData.faculties || []);
      if (deptsData.success) setDepartments(deptsData.departments || []);
    } catch (error) {
      console.error('Fetch error:', error);
      Alert.alert('Lỗi', 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    refreshAttendance();
  }, [refreshAttendance]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
    refreshAttendance();
  }, [refreshAttendance]);

  // Reset forms
  const resetCourseForm = () => {
    setCourseCode(''); setCourseName(''); setCredits('');
    setDepartment(''); setDescription(''); setSemester('');
    setEditingCourse(null);
  };

  const resetFacultyForm = () => {
    setFacultyName(''); setFacultyCode(''); setEditingFaculty(null);
  };

  const resetDeptForm = () => {
    setDeptName(''); setDeptCode(''); setEditingDept(null); setSelectedFacultyId('');
  };

  const handleRequestAttendance = async (course: Course) => {
    const session: AttendanceSession = {
      id: `${course._id}-${Date.now()}`,
      courseId: course._id,
      courseCode: course.courseCode,
      courseName: course.courseName,
      department: course.department,
      requestedAt: new Date().toISOString(),
      requestedBy: 'Admin',
      status: 'active',
      presentStudents: [],
    };

    const nextSessions = await upsertAttendanceSession(session);
    setAttendanceSessions(nextSessions);
    Alert.alert('Thành công', `Đã mở buổi điểm danh cho ${course.courseCode} - ${course.courseName}`);
  };

  const handleCloseAttendance = async (sessionId: string) => {
    const nextSessions = await closeAttendanceSession(sessionId);
    setAttendanceSessions(nextSessions);
  };

  // ============= COURSE CRUD =============
  const handleSaveCourse = async () => {
    if (!courseCode.trim() || !courseName.trim() || !credits.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin bắt buộc (Mã môn, Tên môn, Số tín chỉ)');
      return;
    }
    if (isNaN(Number(credits)) || Number(credits) <= 0) {
      Alert.alert('Lỗi', 'Số tín chỉ phải là số nguyên dương');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');

      // Debug: decode token payload (base64 middle part)
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          console.log('[Course] Token payload:', payload);
        } catch (e) {
          console.log('[Course] Could not decode token');
        }
      } else {
        console.log('[Course] No token found!');
      }

      const courseData = {
        courseCode: courseCode.trim(),
        courseName: courseName.trim(),
        credits: Number(credits),
        department: department.trim(),
        description: description.trim(),
        semester: semester.trim(),
      };

      const url = editingCourse ? `${API_URL}/courses/${editingCourse._id}` : `${API_URL}/courses`;
      const method = editingCourse ? 'PUT' : 'POST';

      console.log(`[Course] ${method} ${url}`, courseData);

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(courseData),
      });

      const data = await response.json();
      console.log('[Course] Response:', data);

      if (data.success) {
        Alert.alert('Thành công', editingCourse ? 'Cập nhật thành công' : 'Thêm thành công');
        setModalVisible(false);
        resetCourseForm();
        fetchData();
      } else {
        Alert.alert('Lỗi', data.message || 'Không thể lưu môn học');
      }
    } catch (error) {
      console.error('[Course] Save error:', error);
      Alert.alert('Lỗi', 'Không thể kết nối đến server');
    }
  };

  const handleDeleteCourse = (course: Course) => {
    Alert.alert('Xác nhận', `Xóa "${course.courseName}"?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa', style: 'destructive',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch(`${API_URL}/courses/${course._id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (data.success) {
              Alert.alert('Thành công', 'Xóa thành công');
              fetchData();
            } else {
              Alert.alert('Lỗi', data.message);
            }
          } catch (error) {
            Alert.alert('Lỗi', 'Không thể kết nối đến server');
          }
        },
      },
    ]);
  };

  // ============= FACULTY CRUD =============
  const handleSaveFaculty = async () => {
    if (!facultyName.trim() || !facultyCode.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên và mã khoa');
      return;
    }
    try {
      const token = await AsyncStorage.getItem('token');
      const url = editingFaculty ? `${API_URL}/faculties/${editingFaculty._id}` : `${API_URL}/faculties`;
      const response = await fetch(url, {
        method: editingFaculty ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: facultyName.trim(), code: facultyCode.trim().toUpperCase() }),
      });
      const data = await response.json();
      if (data.success) {
        Alert.alert('Thành công', editingFaculty ? 'Cập nhật khoa thành công' : 'Thêm khoa thành công');
        setFacultyModal(false);
        resetFacultyForm();
        fetchData();
      } else {
        Alert.alert('Lỗi', data.message);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể kết nối đến server');
    }
  };

  const handleDeleteFaculty = (faculty: Faculty) => {
    const hasDepartments = departments.some(d => d.facultyId === faculty._id);
    if (hasDepartments) {
      Alert.alert('Không thể xóa', 'Khoa này đang có ngành. Vui lòng xóa ngành trước.');
      return;
    }
    Alert.alert('Xác nhận', `Xóa khoa "${faculty.name}"?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa', style: 'destructive',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch(`${API_URL}/faculties/${faculty._id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (data.success) {
              Alert.alert('Thành công', 'Xóa khoa thành công');
              fetchData();
            } else {
              Alert.alert('Lỗi', data.message);
            }
          } catch (error) {
            Alert.alert('Lỗi', 'Không thể kết nối đến server');
          }
        },
      },
    ]);
  };

  // ============= DEPARTMENT CRUD =============
  const handleSaveDepartment = async () => {
    if (!deptName.trim() || !deptCode.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên và mã ngành');
      return;
    }
    if (!selectedFacultyId) {
      Alert.alert('Lỗi', 'Vui lòng chọn khoa');
      return;
    }
    try {
      const token = await AsyncStorage.getItem('token');
      const url = editingDept ? `${API_URL}/departments/${editingDept._id}` : `${API_URL}/departments`;
      const response = await fetch(url, {
        method: editingDept ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: deptName.trim(), code: deptCode.trim().toUpperCase(), facultyId: selectedFacultyId }),
      });
      const data = await response.json();
      if (data.success) {
        Alert.alert('Thành công', editingDept ? 'Cập nhật ngành thành công' : 'Thêm ngành thành công');
        setDeptModal(false);
        resetDeptForm();
        fetchData();
      } else {
        Alert.alert('Lỗi', data.message);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể kết nối đến server');
    }
  };

  const handleDeleteDepartment = (dept: Department) => {
    Alert.alert('Xác nhận', `Xóa ngành "${dept.name}"?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa', style: 'destructive',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch(`${API_URL}/departments/${dept._id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (data.success) {
              Alert.alert('Thành công', 'Xóa ngành thành công');
              fetchData();
            } else {
              Alert.alert('Lỗi', data.message);
            }
          } catch (error) {
            Alert.alert('Lỗi', 'Không thể kết nối đến server');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quản lý môn học</Text>
        <TouchableOpacity onPress={() => { resetCourseForm(); setModalVisible(true); }} style={styles.addButton}>
          <Ionicons name="add-circle" size={28} color="#4A90E2" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.body}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Khoa & Ngành */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📚 Khoa & Ngành</Text>
            <TouchableOpacity
              style={styles.addFacultyButton}
              onPress={() => { resetFacultyForm(); setFacultyModal(true); }}
            >
              <Ionicons name="add-circle" size={22} color="#4A90E2" />
              <Text style={styles.addFacultyText}>Thêm Khoa</Text>
            </TouchableOpacity>
          </View>

          {faculties.map((faculty) => (
            <View key={faculty._id} style={styles.facultyCard}>
              <View style={styles.facultyHeader}>
                <View style={styles.facultyInfo}>
                  {/* Dòng trên */}
                  <View style={styles.facultyTop}>
                    <View style={styles.codeChip}>
                      <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>{faculty.code}</Text>
                    </View>

                    <View style={styles.facultyActions}>
                      <TouchableOpacity
                        onPress={() => {
                          setEditingFaculty(faculty);
                          setFacultyCode(faculty.code);
                          setFacultyName(faculty.name);
                          setFacultyModal(true);
                        }}
                      >
                        <Ionicons
                          name="pencil-outline"
                          size={18}
                          color="#4A90E2"
                        />
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleDeleteFaculty(faculty)}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={18}
                          color="#dc3545"
                        />
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => {
                          resetDeptForm();
                          setSelectedFacultyId(faculty._id);
                          setDeptModal(true);
                        }}
                      >
                        <Ionicons
                          name="add-circle-outline"
                          size={20}
                          color="#28a745"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Dòng dưới */}
                  <Text style={styles.facultyName}>
                    {faculty.name}
                  </Text>
                </View>
              </View>

              <View style={styles.departmentList}>
                {departments
                  .filter(d => d.facultyId === faculty._id)
                  .map((dept) => (
                    <View key={dept._id} style={styles.departmentItem}>
                      <View style={styles.departmentInfo}>
                        <Text><Ionicons
                          name="bookmark-outline"
                          size={14}
                          color="#666"
                        /></Text>
                        <Text style={styles.departmentName}>
                          {dept.name}
                        </Text>
                        <View style={styles.smallChip}>
                          <Text style={{ fontSize: 11, color: '#555' }}>{dept.code}</Text>
                        </View>
                      </View>

                      <View style={styles.deptActions}>
                        <TouchableOpacity
                          onPress={() => {
                            setEditingDept(dept);
                            setDeptName(dept.name);
                            setDeptCode(dept.code);
                            setSelectedFacultyId(dept.facultyId);
                            setDeptModal(true);
                          }}
                        >
                          <Ionicons
                            name="pencil-outline"
                            size={16}
                            color="#4A90E2"
                          />
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() =>
                            handleDeleteDepartment(dept)
                          }
                        >
                          <Ionicons
                            name="trash-outline"
                            size={16}
                            color="#dc3545"
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}

                {departments.filter(
                  d => d.facultyId === faculty._id
                ).length === 0 && (
                    <Text style={styles.noDepartmentText}>
                      Chưa có ngành
                    </Text>
                  )}
              </View>
            </View>
          ))}
        </View>

        <View style={localStyles.attendancePanel}>
          <View style={localStyles.attendanceHeader}>
            <View>
              <Text style={localStyles.attendanceTitle}>Điểm danh đang mở</Text>
              <Text style={localStyles.attendanceSubtitle}>
                {attendanceSessions.filter((session) => session.status === 'active').length > 0
                  ? `${attendanceSessions.filter((session) => session.status === 'active').length} môn đang điểm danh`
                  : 'Chưa có buổi điểm danh nào đang mở'}
              </Text>
            </View>
          </View>

          {attendanceSessions.filter((session) => session.status === 'active').length > 0 ? (
            attendanceSessions
              .filter((session) => session.status === 'active')
              .map((session) => (
                <View key={session.id} style={localStyles.sessionCard}>
                  <View style={localStyles.sessionRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={localStyles.attendanceCourse}>{session.courseName}</Text>
                      <Text style={localStyles.attendanceMeta}>{session.courseCode} • {session.department || '---'}</Text>
                      <Text style={localStyles.attendanceMeta}>Đã điểm danh: {session.presentStudents.length} sinh viên</Text>
                    </View>
                    <TouchableOpacity style={localStyles.closeButton} onPress={() => handleCloseAttendance(session.id)}>
                      <Text style={localStyles.closeButtonText}>Đóng</Text>
                    </TouchableOpacity>
                  </View>
                  {session.presentStudents.length > 0 ? (
                    <View style={localStyles.studentList}>
                      {session.presentStudents.map((student, index) => (
                        <Text key={`${student.studentId}-${index}`} style={localStyles.studentItem}>{index + 1}. {student.fullName}</Text>
                      ))}
                    </View>
                  ) : (
                    <Text style={localStyles.emptyText}>Chưa có sinh viên nào điểm danh</Text>
                  )}
                </View>
              ))
          ) : (
            <Text style={localStyles.emptyText}>Hãy bấm nút xác nhận trên từng môn để mở điểm danh cho nhiều môn cùng lúc.</Text>
          )}
        </View>

        {/* Lịch sử điểm danh (các buổi đã đóng) */}
        {attendanceSessions.filter((s) => s.status === 'closed').length > 0 && (
          <View style={localStyles.historyPanel}>
            <Text style={localStyles.historyTitle}>📋 Lịch sử điểm danh</Text>
            <Text style={localStyles.historySubtitle}>
              {attendanceSessions.filter((s) => s.status === 'closed').length} buổi đã kết thúc
            </Text>
            {attendanceSessions
              .filter((s) => s.status === 'closed')
              .map((session) => (
                <View key={session.id} style={localStyles.historyCard}>
                  <View style={localStyles.historyCardHeader}>
                    <Text style={localStyles.historyCourseName}>{session.courseName}</Text>
                    <View style={localStyles.closedBadge}>
                      <Text style={localStyles.closedBadgeText}>Đã đóng</Text>
                    </View>
                  </View>
                  <Text style={localStyles.historyMeta}>
                    {session.courseCode} • {session.department || '---'} •{' '}
                    {new Date(session.requestedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  <Text style={localStyles.presentCount}>
                    ✓ {session.presentStudents.length} sinh viên đã điểm danh
                  </Text>
                  {session.presentStudents.length > 0 ? (
                    <View style={localStyles.studentList}>
                      {session.presentStudents.map((student, index) => (
                        <Text key={`${student.studentId}-${index}`} style={localStyles.studentItem}>
                          {index + 1}. {student.fullName}
                          {student.studentId ? ` (${student.studentId})` : ''}
                        </Text>
                      ))}
                    </View>
                  ) : (
                    <Text style={localStyles.emptyText}>Không có sinh viên nào điểm danh trong buổi này</Text>
                  )}
                </View>
              ))}
          </View>
        )}

        {/* Danh sách môn học */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📖 Môn học</Text>
            <Text style={styles.courseCount}>{courses.length} môn</Text>
          </View>

          {courses.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text><Ionicons name="book-outline" size={64} color="#ccc" /></Text>
              <Text style={styles.emptyText}>Chưa có môn học</Text>
              <Text style={styles.emptySubText}>Nhấn + để thêm</Text>
            </View>
          ) : (
            <View>
              {courses.map((course) => (
                <View key={course._id} style={styles.courseCard}>
                  <View style={styles.courseHeader}>
                    <View style={styles.courseCodeContainer}>
                      <Text style={styles.courseCode}>{course.courseCode}</Text>
                    </View>
                    <View style={styles.courseActions}>
                      <TouchableOpacity onPress={() => handleRequestAttendance(course)}>
                        <Ionicons name="checkmark-done-outline" size={20} color="#16a34a" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => {
                        setEditingCourse(course);
                        setCourseCode(course.courseCode);
                        setCourseName(course.courseName);
                        setCredits(course.credits.toString());
                        setDepartment(course.department || '');
                        setDescription(course.description || '');
                        setSemester(course.semester || '');
                        setModalVisible(true);
                      }}>
                        <Ionicons name="pencil-outline" size={20} color="#4A90E2" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeleteCourse(course)}>
                        <Ionicons name="trash-outline" size={20} color="#dc3545" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text style={styles.courseName}>{course.courseName}</Text>
                  <View style={styles.courseInfo}>
                    <View style={styles.infoItem}>
                      <Text><Ionicons name="star-outline" size={14} color="#666" /></Text>
                      <Text style={styles.infoText}>{course.credits} TC</Text>
                    </View>
                    {course.department ? (
                      <View style={styles.infoItem}>
                        <Text><Ionicons name="business-outline" size={14} color="#666" /></Text>
                        <Text style={styles.infoText}>{course.department}</Text>
                      </View>
                    ) : null}
                  </View>
                  {course.description && (
                    <Text style={styles.courseDescription} numberOfLines={2}>{course.description}</Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal Khoa */}
      <Modal visible={facultyModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingFaculty ? 'Sửa Khoa' : 'Thêm Khoa'}</Text>
              <TouchableOpacity onPress={() => { setFacultyModal(false); resetFacultyForm(); }}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <TextInput style={styles.input} placeholder="Tên khoa" value={facultyName} onChangeText={setFacultyName} />
              <TextInput style={[styles.input, { marginTop: 12 }]} placeholder="Mã khoa" value={facultyCode} onChangeText={setFacultyCode} autoCapitalize="characters" />
            </View>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => { setFacultyModal(false); resetFacultyForm(); }}>
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleSaveFaculty}>
                <Text style={styles.saveButtonText}>{editingFaculty ? 'Cập nhật' : 'Thêm'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Ngành */}
      <Modal visible={deptModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingDept ? 'Sửa Ngành' : 'Thêm Ngành'}</Text>
              <TouchableOpacity onPress={() => { setDeptModal(false); resetDeptForm(); }}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <TextInput style={styles.input} placeholder="Tên ngành" value={deptName} onChangeText={setDeptName} />
              <TextInput style={[styles.input, { marginTop: 12 }]} placeholder="Mã ngành" value={deptCode} onChangeText={setDeptCode} autoCapitalize="characters" />
              <View style={styles.facultyPicker}>
                <Text style={styles.label}>Thuộc khoa</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll}>
                  {faculties.map(f => (
                    <TouchableOpacity
                      key={f._id}
                      style={[styles.pickerItem, selectedFacultyId === f._id && styles.pickerItemSelected]}
                      onPress={() => setSelectedFacultyId(f._id)}
                    >
                      <Text style={[styles.pickerText, selectedFacultyId === f._id && styles.pickerTextSelected]}>{f.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => { setDeptModal(false); resetDeptForm(); }}>
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleSaveDepartment}>
                <Text style={styles.saveButtonText}>{editingDept ? 'Cập nhật' : 'Thêm'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Môn học */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingCourse ? 'Sửa Môn học' : 'Thêm Môn học'}</Text>
              <TouchableOpacity onPress={() => { setModalVisible(false); resetCourseForm(); }}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <TextInput style={styles.input} placeholder="Mã môn học *" value={courseCode} onChangeText={setCourseCode} />
              <TextInput style={[styles.input, { marginTop: 12 }]} placeholder="Tên môn học *" value={courseName} onChangeText={setCourseName} />
              <TextInput style={[styles.input, { marginTop: 12 }]} placeholder="Số tín chỉ *" value={credits} onChangeText={setCredits} keyboardType="numeric" />
              <TextInput style={[styles.input, { marginTop: 12 }]} placeholder="Khoa/Bộ môn" value={department} onChangeText={setDepartment} />
              <TextInput style={[styles.input, { marginTop: 12 }]} placeholder="Học kỳ" value={semester} onChangeText={setSemester} />
              <TextInput style={[styles.input, styles.textArea, { marginTop: 12 }]} placeholder="Mô tả" value={description} onChangeText={setDescription} multiline numberOfLines={3} />
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => { setModalVisible(false); resetCourseForm(); }}>
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleSaveCourse}>
                <Text style={styles.saveButtonText}>{editingCourse ? 'Cập nhật' : 'Thêm'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}