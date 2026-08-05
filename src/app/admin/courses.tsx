// app/admin/courses.tsx
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ActivityIndicator, Chip } from 'react-native-paper';
import { styles } from '../../a_styles/style_courses';
import { API_URL } from '../../config/api';
import { upsertAttendanceSession, type AttendanceSession } from '../../utils/attendanceStorage';
import { Picker } from '@react-native-picker/picker';

interface Course {
  _id: string;
  courseCode: string;
  courseName: string;
  credits: number;
  department: string; // Tên khoa
  description?: string;
  semester?: string;
  course?: string; // Năm học
  departmentIds?: string[]; // Danh sách ID ngành áp dụng
}

interface Faculty {
  _id: string;
  name: string;
  code: string; // Mã khoa
}

interface Department {
  _id: string;
  name: string;
  code: string;
  facultyId: string; // ID của khoa
}

interface FilterOptions {
  code: string; // Mã khoa
  facultyId: string; // Mã ngành (dùng _id của Department)
  semester: string; // Học kỳ
  course: string; // Năm học
}

export default function CoursesScreen() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter states
  const [filters, setFilters] = useState<FilterOptions>({
    code: '',
    facultyId: '',
    semester: '',
    course: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  // Form states
  const [courseCode, setCourseCode] = useState('');
  const [courseName, setCourseName] = useState('');
  const [credits, setCredits] = useState('');
  const [department, setDepartment] = useState(''); // Tên khoa
  const [description, setDescription] = useState('');
  const [semester, setSemester] = useState('');
  const [courseYear, setCourseYear] = useState(''); // Năm học
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]); // Danh sách ID ngành

  // Academic year options
  const getAcademicYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const options = [];
    for (let i = -3; i <= 3; i++) {
      const year = currentYear + i;
      options.push(`${year}-${year + 1}`);
    }
    return options;
  };

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

      if (coursesData.success) {
        const normalizedCourses = coursesData.data.map((course: any) => ({
          ...course,
          departmentIds: course.departmentIds || [],
          semester: course.semester || '',
          course: course.course || '',
        }));
        setCourses(normalizedCourses);
        setFilteredCourses(normalizedCourses);
      }
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
  }, []);

  useEffect(() => {
    applyFilters();
  }, [courses, filters]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  // Apply filters
  const applyFilters = () => {
    let filtered = [...courses];

    // Lọc theo mã khoa (code)
    if (filters.code) {
      // Tìm khoa theo code
      const faculty = faculties.find(f => f.code === filters.code);
      if (faculty) {
        // Lấy tất cả ngành thuộc khoa này
        const deptIds = departments
          .filter(d => d.facultyId === faculty._id)
          .map(d => d._id);
        
        filtered = filtered.filter(c => {
          // Kiểm tra nếu môn học thuộc khoa này (department là tên khoa)
          if (c.department === faculty.name) return true;
          // Hoặc môn học có ngành thuộc khoa này
          if (c.departmentIds && c.departmentIds.length > 0) {
            return c.departmentIds.some(deptId => deptIds.includes(deptId));
          }
          return false;
        });
      }
    }

    // Lọc theo ngành (facultyId là _id của Department)
    if (filters.facultyId) {
      filtered = filtered.filter(c => 
        c.departmentIds && c.departmentIds.length > 0 && 
        c.departmentIds.includes(filters.facultyId)
      );
    }

    // Lọc theo học kỳ
    if (filters.semester) {
      filtered = filtered.filter(c => c.semester === filters.semester);
    }

    // Lọc theo năm học (course)
    if (filters.course) {
      filtered = filtered.filter(c => c.course === filters.course);
    }

    setFilteredCourses(filtered);
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      code: '',
      facultyId: '',
      semester: '',
      course: '',
    });
  };

  // Reset forms
  const resetCourseForm = () => {
    setCourseCode(''); 
    setCourseName(''); 
    setCredits('');
    setDepartment(''); 
    setDescription(''); 
    setSemester('');
    setCourseYear(''); 
    setSelectedDepartments([]);
    setEditingCourse(null);
  };

  const handleRequestAttendance = async (course: Course) => {
    const session: AttendanceSession = {
      id: `${course._id}-${Date.now()}`,
      courseId: course._id,
      courseCode: course.courseCode,
      courseName: course.courseName,
      department: course.department || '',
      requestedAt: new Date().toISOString(),
      requestedBy: 'Admin',
      status: 'active',
      presentStudents: [],
    };

    await upsertAttendanceSession(session);
    Alert.alert('Thành công', `Đã mở buổi điểm danh cho ${course.courseCode} - ${course.courseName}`);
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
      
      const courseData = {
        courseCode: courseCode.trim(),
        courseName: courseName.trim(),
        credits: Number(credits),
        department: department.trim(),
        description: description.trim(),
        semester: semester.trim(),
        course: courseYear.trim(),
        departmentIds: selectedDepartments,
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

  // Toggle department selection
  const toggleDepartment = (deptId: string) => {
    setSelectedDepartments(prev => {
      if (prev.includes(deptId)) {
        return prev.filter(id => id !== deptId);
      } else {
        return [...prev, deptId];
      }
    });
  };

  // Get semester options
  const semesterOptions = ['HK1', 'HK2', 'HK3'];
  const academicYearOptions = getAcademicYearOptions();

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
          <Ionicons name="arrow-back" size={28} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quản lý Môn học</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setShowFilters(!showFilters)} style={styles.filterButton}>
            <Ionicons name="filter" size={24} color="#4A90E2" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { resetCourseForm(); setModalVisible(true); }} style={styles.addButton}>
            <Ionicons name="add-circle" size={28} color="#4A90E2" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Section */}
      {showFilters && (
        <View style={styles.filterContainer}>
          <View style={styles.filterRow}>
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Mã Khoa</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={filters.code}
                  onValueChange={(value) => {
                    setFilters(prev => ({ ...prev, code: value }));
                  }}
                  style={styles.picker}
                >
                  <Picker.Item label="Tất cả khoa" value="" />
                  {faculties.map(f => (
                    <Picker.Item key={f._id} label={`${f.code} - ${f.name}`} value={f.code} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Mã Ngành</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={filters.facultyId}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, facultyId: value }))}
                  style={styles.picker}
                >
                  <Picker.Item label="Tất cả ngành" value="" />
                  {departments
                    .filter(d => !filters.code || faculties.find(f => f.code === filters.code)?._id === d.facultyId)
                    .map(d => (
                      <Picker.Item key={d._id} label={`${d.code} - ${d.name}`} value={d._id} />
                    ))}
                </Picker>
              </View>
            </View>
          </View>

          <View style={styles.filterRow}>
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Học kỳ</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={filters.semester}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, semester: value }))}
                  style={styles.picker}
                >
                  <Picker.Item label="Tất cả" value="" />
                  {semesterOptions.map(s => (
                    <Picker.Item key={s} label={s} value={s} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Năm học</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={filters.course}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, course: value }))}
                  style={styles.picker}
                >
                  <Picker.Item label="Tất cả" value="" />
                  {academicYearOptions.map(year => (
                    <Picker.Item key={year} label={year} value={year} />
                  ))}
                </Picker>
              </View>
            </View>
          </View>

          <View style={styles.filterActions}>
            <TouchableOpacity style={styles.clearFilterButton} onPress={resetFilters}>
              <Text style={styles.clearFilterText}>Xóa bộ lọc</Text>
            </TouchableOpacity>
            <Text style={styles.filterResultText}>
              {filteredCourses.length} / {courses.length} môn
            </Text>
          </View>
        </View>
      )}

      <ScrollView
        style={styles.body}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📖 Danh sách môn học</Text>
            <Text style={styles.courseCount}>{filteredCourses.length} môn</Text>
          </View>

          {filteredCourses.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="book-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>Không tìm thấy môn học</Text>
              <Text style={styles.emptySubText}>
                {courses.length > 0 ? 'Thử điều chỉnh bộ lọc' : 'Nhấn + để thêm môn học'}
              </Text>
            </View>
          ) : (
            <View>
              {filteredCourses.map((course) => {
                // Tìm khoa theo tên
                const faculty = faculties.find(f => f.name === course.department);
                return (
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
                          setCourseYear(course.course || '');
                          setSelectedDepartments(course.departmentIds || []);
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
                        <Ionicons name="star-outline" size={14} color="#666" />
                        <Text style={styles.infoText}>{course.credits} TC</Text>
                      </View>
                      {faculty && (
                        <View style={styles.infoItem}>
                          <Ionicons name="business-outline" size={14} color="#666" />
                          <Text style={styles.infoText}>{faculty.code}</Text>
                        </View>
                      )}
                      {course.semester && (
                        <View style={styles.infoItem}>
                          <Ionicons name="calendar-outline" size={14} color="#666" />
                          <Text style={styles.infoText}>{course.semester}</Text>
                        </View>
                      )}
                      {course.course && (
                        <View style={styles.infoItem}>
                          <Ionicons name="time-outline" size={14} color="#666" />
                          <Text style={styles.infoText}>{course.course}</Text>
                        </View>
                      )}
                    </View>
                    {course.departmentIds && course.departmentIds.length > 0 && (
                      <View style={styles.departmentsContainer}>
                        <Text style={styles.departmentsLabel}>Áp dụng cho:</Text>
                        <View style={styles.departmentChips}>
                          {course.departmentIds.map(deptId => {
                            const dept = departments.find(d => d._id === deptId);
                            return dept ? (
                              <Chip key={deptId} style={styles.deptChip} textStyle={styles.deptChipText}>
                                {dept.code}
                              </Chip>
                            ) : null;
                          })}
                        </View>
                      </View>
                    )}
                    {course.description && (
                      <Text style={styles.courseDescription} numberOfLines={2}>{course.description}</Text>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

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
              
              {/* Khoa Select */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Khoa/Bộ môn quản lý</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={department}
                    onValueChange={setDepartment}
                    style={styles.picker}
                  >
                    <Picker.Item label="Chọn khoa" value="" />
                    {faculties.map(f => (
                      <Picker.Item key={f._id} label={`${f.code} - ${f.name}`} value={f.name} />
                    ))}
                  </Picker>
                </View>
              </View>

              {/* Ngành áp dụng */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Ngành áp dụng</Text>
                <Text style={styles.formHint}>Chọn một hoặc nhiều ngành</Text>
                <ScrollView style={styles.departmentSelector}>
                  {departments
                    .filter(d => {
                      if (!department) return true;
                      const faculty = faculties.find(f => f.name === department);
                      return faculty ? d.facultyId === faculty._id : true;
                    })
                    .map(dept => (
                      <TouchableOpacity
                        key={dept._id}
                        style={[
                          styles.deptSelectorItem,
                          selectedDepartments.includes(dept._id) && styles.deptSelectorItemSelected
                        ]}
                        onPress={() => toggleDepartment(dept._id)}
                      >
                        <Text style={[
                          styles.deptSelectorText,
                          selectedDepartments.includes(dept._id) && styles.deptSelectorTextSelected
                        ]}>
                          {dept.code} - {dept.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  {departments.filter(d => {
                    if (!department) return true;
                    const faculty = faculties.find(f => f.name === department);
                    return faculty ? d.facultyId === faculty._id : true;
                  }).length === 0 && (
                    <Text style={styles.noDeptText}>Chưa có ngành trong khoa này</Text>
                  )}
                </ScrollView>
              </View>

              {/* Học kỳ Select */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Học kỳ</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={semester}
                    onValueChange={setSemester}
                    style={styles.picker}
                  >
                    <Picker.Item label="Chọn học kỳ" value="" />
                    {semesterOptions.map(s => (
                      <Picker.Item key={s} label={s} value={s} />
                    ))}
                  </Picker>
                </View>
              </View>

              {/* Năm học Select */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Năm học</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={courseYear}
                    onValueChange={setCourseYear}
                    style={styles.picker}
                  >
                    <Picker.Item label="Chọn năm học" value="" />
                    {academicYearOptions.map(year => (
                      <Picker.Item key={year} label={year} value={year} />
                    ))}
                  </Picker>
                </View>
              </View>

              <TextInput 
                style={[styles.input, styles.textArea, { marginTop: 12 }]} 
                placeholder="Mô tả" 
                value={description} 
                onChangeText={setDescription} 
                multiline 
                numberOfLines={3} 
              />
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