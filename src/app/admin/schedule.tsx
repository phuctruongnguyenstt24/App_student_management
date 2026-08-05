// app/screens/ScheduleManagement.tsx
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Modal, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { styles } from '../../a_styles/style_schedule';
import { API_URL } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';

// Các Interface
interface Student { _id: string; fullName: string; studentId: string; class?: string; facultyId?: string; departmentId?: string; }
interface Faculty { _id: string; name: string; code: string; }
interface Department { _id: string; name: string; code: string; facultyId: string; }
interface Course { _id: string; courseCode: string; courseName: string; credits: number; }

interface Schedule {
  _id: string;
  courseId: Course | { _id: string; courseName: string; courseCode: string };
  lecturer: string;
  room: string;
  specificDate: string; 
  session: string; 
  startTime: string;
  endTime: string;
  semester: string;
  type: string;
  targetClass: string; 
  targetGroup: string; 
  studentIds?: string[];
}

interface Filters { facultyId: string; departmentId: string; class: string; }

interface FormData {
  courseId: string;
  lecturer: string;
  room: string;
  type: string;
  specificDate: Date;
  session: string;
  targetGroup: string;
  semester: string;
  selectedStudents: string[]; 
}

const ScheduleManagement = () => {
  const { user, token } = useAuth();
  
  const [data, setData] = useState({
    schedules: [] as Schedule[],
    courses: [] as Course[],
    faculties: [] as Faculty[],
    departments: [] as Department[],
    filteredDepartments: [] as Department[],
    classOptions: [] as string[],
    students: [] as Student[]
  });

  const [filters, setFilters] = useState<Filters>({ facultyId: '', departmentId: '', class: '' });
  const [expandedClasses, setExpandedClasses] = useState<string[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Giá trị khởi tạo mặc định của Form
  const initialFormState: FormData = {
    courseId: '', lecturer: '', room: '', type: 'theory',
    specificDate: new Date(),
    session: 'morning',
    targetGroup: 'all',
    semester: 'HK1 2026',
    selectedStudents: []
  };

  const [form, setForm] = useState<FormData>(initialFormState);
  const [modal, setModal] = useState<{ visible: boolean; editingId: string | null }>({ visible: false, editingId: null });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const updateForm = <K extends keyof FormData>(key: K, val: FormData[K]) => {
    setForm(prev => ({ ...prev, [key]: val }));
  };

  const parseLocalDate = (dateStr: string): Date => {
    if (!dateStr) return new Date();
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    }
    return new Date(dateStr);
  };

  const fetchAll = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      };

      const t = new Date().getTime();

      const [schedulesRes, studentsRes, coursesRes, facultiesRes, deptsRes] = await Promise.all([
        fetch(`${API_URL}/schedules?t=${t}`, { headers }),
        fetch(`${API_URL}/students/all?t=${t}`, { headers }),
        fetch(`${API_URL}/courses`, { headers }), 
        fetch(`${API_URL}/faculties`, { headers }),
        fetch(`${API_URL}/departments`, { headers })
      ]);

      const parseJSON = async (response: Response, apiName: string) => {
        const text = await response.text();
        try {
          return JSON.parse(text);
        } catch (error) {
          console.error(`🔴 Lỗi tại API [${apiName}]:`, text.substring(0, 300));
          throw new Error(`API ${apiName} bị lỗi. Vui lòng kiểm tra Terminal/Console.`);
        }
      };

      const schedules = await parseJSON(schedulesRes, 'Schedules');
      const students = await parseJSON(studentsRes, 'Students');
      const courses = await parseJSON(coursesRes, 'Courses');
      const faculties = await parseJSON(facultiesRes, 'Faculties');
      const depts = await parseJSON(deptsRes, 'Departments');

      const studentList: Student[] = students.success ? students.students : [];
      const classSet = new Set<string>();
      studentList.forEach(s => { if (s.class) classSet.add(s.class); });

      setData({
        schedules: schedules.success ? schedules.data : [],
        courses: courses.success ? courses.data : [],
        faculties: faculties.data || faculties.faculties || [],
        departments: depts.data || depts.departments || [],
        filteredDepartments: depts.data || depts.departments || [],
        classOptions: Array.from(classSet).sort(),
        students: studentList 
      });
    } catch (e: any) {
      console.error("Lỗi chi tiết khi gọi API fetchAll:", e);
      Alert.alert('Lỗi', `Không thể tải dữ liệu.\nChi tiết lỗi: ${e.message || e}`);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    const filteredDepts = filters.facultyId 
      ? data.departments.filter(d => d.facultyId === filters.facultyId)
      : data.departments;

    let validStudents = data.students;
    
    if (filters.facultyId) {
      validStudents = validStudents.filter(s => s.facultyId === filters.facultyId);
    }
    
    if (filters.departmentId) {
      validStudents = validStudents.filter(s => s.departmentId === filters.departmentId);
    }

    const classSet = new Set<string>();
    validStudents.forEach(s => { 
      if (s.class) classSet.add(s.class); 
    });
    
    const newClassOptions = Array.from(classSet).sort();

    setData(prev => ({ 
      ...prev, 
      filteredDepartments: filteredDepts,
      classOptions: newClassOptions
    }));

    setFilters(prev => ({
      ...prev,
      departmentId: filteredDepts.some(d => d._id === prev.departmentId) ? prev.departmentId : '',
      class: newClassOptions.includes(prev.class) ? prev.class : ''
    }));

  }, [filters.facultyId, filters.departmentId, data.departments, data.students]);

  useEffect(() => { if (token) fetchAll(); }, [token]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAll().finally(() => setRefreshing(false));
  }, [fetchAll]);

  const toggleClassAccordion = (className: string) => {
    setExpandedClasses(prev => 
      prev.includes(className) ? prev.filter(c => c !== className) : [...prev, className]
    );
  };

  const toggleStudentSelection = (studentId: string) => {
    const targetId = String(studentId);
    setForm(prev => {
      const exists = prev.selectedStudents.some(id => String(id) === targetId);
      return {
        ...prev,
        selectedStudents: exists
          ? prev.selectedStudents.filter(id => String(id) !== targetId)
          : [...prev.selectedStudents, targetId]
      };
    });
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) updateForm('specificDate', selectedDate);
  };

  const submitSchedule = async () => {
    // 💡 KIỂM TRA DỮ LIỆU ĐẦU VÀO ĐỂ TRÁNH LỖI BACKEND
    if (!filters.class) {
      return Alert.alert('Lỗi', 'Vui lòng chọn Lớp học ở bộ lọc bên ngoài trước khi thêm lịch!');
    }
    if (!form.courseId) return Alert.alert('Lỗi', 'Vui lòng chọn môn học!');
    if (!form.lecturer.trim()) return Alert.alert('Lỗi', 'Vui lòng nhập tên giảng viên!');
    if (!form.room.trim()) return Alert.alert('Lỗi', 'Vui lòng nhập phòng học!');
    
    // Kiểm tra phải chọn sinh viên nếu là lớp thực hành chia nhóm
    if (form.type === 'practice' && form.targetGroup !== 'all' && form.selectedStudents.length === 0) {
      return Alert.alert('Lỗi', 'Vui lòng chọn ít nhất 1 sinh viên cho nhóm thực hành!');
    }
    
    let startTime = '07:00', endTime = '11:00';
    if (form.session === 'afternoon') { startTime = '13:00'; endTime = '17:00'; }
    if (form.session === 'evening') { startTime = '18:00'; endTime = '21:00'; }

    try {
      const url = modal.editingId ? `${API_URL}/schedules/${modal.editingId}` : `${API_URL}/schedules`;

      const year = form.specificDate.getFullYear();
      const month = String(form.specificDate.getMonth() + 1).padStart(2, '0');
      const day = String(form.specificDate.getDate()).padStart(2, '0');
      const localDateString = `${year}-${month}-${day}`;
      
      const scheduleData = {
        courseId: form.courseId,
        lecturer: form.lecturer.trim(),
        room: form.room.trim(),
        specificDate: localDateString,
        session: form.session,
        startTime,
        endTime,
        semester: form.semester,
        type: form.type,
        targetClass: filters.class,
        targetGroup: form.type === 'practice' ? form.targetGroup : 'all',
        studentIds: form.type === 'practice' && form.targetGroup !== 'all' ? form.selectedStudents : []
      };

      const res = await fetch(url, {
        method: modal.editingId ? 'PUT' : 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleData)
      });

      const result = await res.json();
      if (result.success) {
        Alert.alert('Thành công', 'Đã lưu lịch học');
        setModal({ visible: false, editingId: null });
        setForm(initialFormState); // Reset form về mặc định
        
        await fetchAll();

        setExpandedClasses(prev => 
          prev.includes(filters.class) ? prev : [...prev, filters.class]
        );
        
      } else {
        let errorMsg = result.message || 'Có lỗi xảy ra khi tạo lịch';
        if (result.conflicts && Array.isArray(result.conflicts) && result.conflicts.length > 0) {
            errorMsg += '\n\nChi tiết:\n- ' + result.conflicts.join('\n- ');
        }
        Alert.alert('Lỗi tạo lịch', errorMsg);
      }
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể kết nối server. Vui lòng thử lại.');
    }
  };

  const handleEdit = (schedule: Schedule) => {
    const cId = typeof schedule.courseId === 'object' ? schedule.courseId._id : schedule.courseId;
    
    if (schedule.targetClass) {
      setFilters(prev => ({ ...prev, class: schedule.targetClass }));
    }

    const extractedStudentIds = Array.isArray(schedule.studentIds) 
      ? schedule.studentIds.map((st: any) => 
          typeof st === 'object' && st !== null ? String(st._id || st.id) : String(st)
        )
      : [];

    setForm({
      courseId: cId,
      lecturer: schedule.lecturer,
      room: schedule.room,
      type: schedule.type,
      specificDate: parseLocalDate(schedule.specificDate),
      session: schedule.session,
      targetGroup: schedule.targetGroup,
      semester: schedule.semester,
      selectedStudents: extractedStudentIds
    });
    
    setModal({ visible: true, editingId: schedule._id });
  };

  const handleDelete = (id: string) => {
    Alert.alert('Xác nhận', 'Bạn có chắc chắn muốn xóa lịch học này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await fetch(`${API_URL}/schedules/${id}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await res.json();
            
            if (result.success) {
              Alert.alert('Thành công', 'Đã xóa lịch học');
              fetchAll();
            } else {
              Alert.alert('Lỗi', result.message || 'Không thể xóa lịch học');
            }
          } catch (e) {
            Alert.alert('Lỗi', 'Không thể kết nối đến máy chủ');
          }
        }
      }
    ]);
  };

  const getSchedulesByClass = (className: string) => {
    return data.schedules.filter(s => s.targetClass === className);
  };

  const studentsInCurrentClass = data.students.filter(s => s.class === filters.class);

  const formatDateToVietnamese = (dateString: string) => {
    const date = parseLocalDate(dateString);
    const days = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const dayName = days[date.getDay()];
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dayName}, ngày ${dd} tháng ${mm} năm ${yyyy}`;
  };

  const renderFilterSection = () => (
    <View style={styles.filterContainer}>
      <Text style={styles.filterTitle}>1. Chọn đối tượng áp dụng:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        {[
          { key: 'facultyId' as const, label: 'Khoa', items: data.faculties },
          { key: 'departmentId' as const, label: 'Ngành', items: data.filteredDepartments },
          { key: 'class' as const, label: 'Lớp (*)', items: data.classOptions.map(c => ({ _id: c, name: c })) }
        ].map(({ key, label, items }) => (
          <View key={key} style={styles.filterGroup}>
            <Text style={styles.filterLabel}>{label}</Text>
            <View style={styles.filterPickerContainer}>
              <Picker
                selectedValue={filters[key]}
                onValueChange={(v: string) => setFilters(prev => ({ ...prev, [key]: v }))}
                style={styles.filterPicker}
              >
                <Picker.Item label={`-- Chọn --`} value="" />
                {items.map((item: any) => (
                  <Picker.Item key={item._id} label={item.name} value={item._id} />
                ))}
              </Picker>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
         <TouchableOpacity onPress={() => router.replace('/admin/dashboard' as any)}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quản lý lịch học</Text>
        
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => {
            if (!filters.class) return Alert.alert('Lưu ý', 'Vui lòng chọn Lớp học trước khi Thêm lịch');
            setForm(initialFormState); 
            setModal({ visible: true, editingId: null });
          }}
        >
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Thêm lịch</Text>
        </TouchableOpacity>
      </View>

      <View style={{ paddingHorizontal: 16 }}>
        {renderFilterSection()}
      </View>

     <FlatList
        data={filters.class ? [filters.class] : data.classOptions}
        keyExtractor={(item) => item}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContent}
        renderItem={({ item: className }) => {
          const isExpanded = expandedClasses.includes(className);
          const classSchedules = getSchedulesByClass(className);

          const groupedSchedules: { [key: string]: Schedule[] } = {};
          classSchedules.forEach(schedule => {
            if (!groupedSchedules[schedule.specificDate]) {
              groupedSchedules[schedule.specificDate] = [];
            }
            groupedSchedules[schedule.specificDate].push(schedule);
          });

          return (
            <View style={styles.accordionCard}>
              <TouchableOpacity 
                style={styles.accordionHeader}
                onPress={() => toggleClassAccordion(className)}
              >
                <Text style={styles.accordionTitle}>Lớp: {className}</Text>
                <View style={styles.accordionRight}>
                  <Text style={styles.accordionSubText}>{classSchedules.length} lịch học</Text>
                  <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color="#1890ff" />
                </View>
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.accordionBody}>
                  {classSchedules.length === 0 ? (
                    <Text style={styles.emptyText}>Chưa có lịch học nào</Text>
                  ) : (
                    Object.keys(groupedSchedules)
                      .sort()
                      .map(dateString => (
                        <View key={dateString} style={{ marginBottom: 16 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, paddingLeft: 4 }}>
                            <Ionicons name="calendar" size={18} color="#d9534f" style={{ marginRight: 6 }} />
                            <Text style={{ fontWeight: 'bold', color: '#d9534f', fontSize: 16 }}>
                              {formatDateToVietnamese(dateString)}
                            </Text>
                          </View>

                          {groupedSchedules[dateString].map(schedule => (
                            <View key={schedule._id} style={styles.scheduleCard}>
                              <View style={styles.cardHeader}>
                                  <Text style={styles.courseName}>
                                    {typeof schedule.courseId === 'object' 
                                      ? `${schedule.courseId.courseName} (${schedule.courseId.courseCode})` 
                                      : ''}
                                  </Text>
                                  <View style={[styles.typeBadge, { backgroundColor: schedule.type === 'practice' ? '#52c41a' : '#1890ff' }]}>
                                    <Text style={styles.typeText}>{schedule.type === 'practice' ? 'Thực hành' : 'Lý thuyết'}</Text>
                                  </View>
                              </View>
                              
                              <View style={styles.cardBody}>
                                  <View style={styles.infoRow}>
                                    <Ionicons name="time-outline" size={16} color="#666" />
                                    <Text style={styles.infoText}>Ca {schedule.session === 'morning' ? 'Sáng' : schedule.session === 'afternoon' ? 'Chiều' : 'Tối'} ({schedule.startTime} - {schedule.endTime})</Text>
                                  </View>
                                  
                                  <View style={styles.infoRow}>
                                    <Ionicons name="location-outline" size={16} color="#666" />
                                    <Text style={styles.infoText}>Phòng: {schedule.room} | GV: {schedule.lecturer}</Text>
                                  </View>
                                  
                                  {schedule.type === 'practice' && (
                                    <View style={styles.infoRow}>
                                      <Ionicons name="people-outline" size={16} color="#666" />
                                      <Text style={[styles.infoText, { color: '#f39c12' }]}>
                                        Nhóm học: {schedule.targetGroup === 'all' ? 'Cả lớp' : schedule.targetGroup === 'group1' ? 'Nhóm 1' : 'Nhóm 2'}
                                      </Text>
                                    </View>
                                  )}
                              </View>
                              <View style={styles.cardFooter}>
                                <Text style={styles.semesterText}>Học kỳ: {schedule.semester}</Text>
                                <View style={styles.cardActions}>
                                  <TouchableOpacity style={styles.editButton} onPress={() => handleEdit(schedule)}>
                                    <Ionicons name="create-outline" size={18} color="#1890ff" />
                                  </TouchableOpacity>
                                  <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(schedule._id)}>
                                    <Ionicons name="trash-outline" size={18} color="#ff4d4f" />
                                  </TouchableOpacity>
                                </View>
                              </View>
                            </View>
                          ))}
                        </View>
                    ))
                  )}
                </View>
              )}
            </View>
          );
        }}
      />

      <Modal visible={modal.visible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{modal.editingId ? 'Sửa lịch học' : `Thêm lịch cho lớp ${filters.class}`} </Text>
              <TouchableOpacity onPress={() => setModal({ visible: false, editingId: null })}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Môn học *</Text>
              <View style={styles.pickerContainer}>
                <Picker selectedValue={form.courseId} onValueChange={(v) => updateForm('courseId', v)} style={styles.picker}>
                  <Picker.Item label="Chọn môn học" value="" />
                  {data.courses.map(c => <Picker.Item key={c._id} label={`${c.courseName} - ${c.courseCode}`} value={c._id} />)}
                </Picker>
              </View>
            </View>
            
            {['lecturer', 'room'].map((f) => (
              <View key={f} style={styles.formGroup}>
                <Text style={styles.label}>{f === 'lecturer' ? 'Giảng viên' : 'Phòng học'} *</Text>
                <TextInput style={styles.input} value={form[f as keyof FormData] as string} onChangeText={(v) => updateForm(f as keyof FormData, v)} />
              </View>
            ))}

            <View style={styles.rowGroup}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Ngày học *</Text>
                <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
                  <Text>{form.specificDate.toLocaleDateString('vi-VN')}</Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={form.specificDate}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                  />
                )}
              </View>

              <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Ca học *</Text>
                <View style={styles.pickerContainer}>
                  <Picker selectedValue={form.session} onValueChange={(v) => updateForm('session', v)} style={styles.picker}>
                    <Picker.Item label="Sáng" value="morning" />
                    <Picker.Item label="Chiều" value="afternoon" />
                    <Picker.Item label="Tối" value="evening" />
                  </Picker>
                </View>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Loại lịch *</Text>
              <View style={styles.pickerContainer}>
                <Picker selectedValue={form.type} onValueChange={(v) => updateForm('type', v)} style={styles.picker}>
                  <Picker.Item label="Lý thuyết" value="theory" />
                  <Picker.Item label="Thực hành" value="practice" />
                </Picker>
              </View>
            </View>

            {form.type === 'practice' && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Chia nhóm thực hành *</Text>
                <View style={styles.pickerContainer}>
                  <Picker selectedValue={form.targetGroup} onValueChange={(v) => updateForm('targetGroup', v)} style={styles.picker}>
                    <Picker.Item label="Cả lớp" value="all" />
                    <Picker.Item label="Nhóm 1" value="group1" />
                    <Picker.Item label="Nhóm 2" value="group2" />
                  </Picker>
                </View>
              </View>
            )}

            {form.type === 'practice' && form.targetGroup !== 'all' && (
              <View style={styles.formGroup}>
                {/* 💡 BỔ SUNG: Nút Chọn tất cả giúp thao tác nhanh và tránh lỗi */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={styles.label}>
                    Chọn sinh viên cho {form.targetGroup === 'group1' ? 'Nhóm 1' : 'Nhóm 2'} *
                  </Text>
                  <TouchableOpacity onPress={() => {
                      if (form.selectedStudents.length === studentsInCurrentClass.length) {
                        updateForm('selectedStudents', []);
                      } else {
                        updateForm('selectedStudents', studentsInCurrentClass.map(s => String(s._id)));
                      }
                  }}>
                    <Text style={{ color: '#1890ff', fontWeight: 'bold' }}>
                      {form.selectedStudents.length === studentsInCurrentClass.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={{ maxHeight: 250, borderWidth: 1, borderColor: '#d9d9d9', borderRadius: 8, padding: 8, backgroundColor: '#fafafa' }}>
                  <ScrollView nestedScrollEnabled={true}>
                      {studentsInCurrentClass.length === 0 ? (
                        <Text style={{ color: '#999', fontStyle: 'italic', textAlign: 'center', padding: 10 }}>
                          Không có sinh viên nào trong lớp {filters.class}.
                        </Text>
                      ) : (
                        studentsInCurrentClass.map(student => {
                          const currentId = String(student._id); 
                          const isSelected = form.selectedStudents.some(id => String(id) === currentId);
                          
                          return (
                            <TouchableOpacity
                              key={student._id}
                              style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' }}
                              onPress={() => toggleStudentSelection(student._id)} 
                            >
                              <Ionicons 
                                name={isSelected ? "checkbox" : "square-outline"} 
                                size={24} 
                                color={isSelected ? "#1890ff" : "#ccc"} 
                              />
                              <Text style={{ marginLeft: 12, fontSize: 15, color: '#333' }}>
                                {student.studentId} - {student.fullName}
                              </Text>
                            </TouchableOpacity>
                          );
                        })
                      )}
                  </ScrollView>
                </View>
              </View>
            )}

          <TouchableOpacity style={[styles.button, styles.submitButton, { marginTop: 20 }]} onPress={submitSchedule}>
            <Text style={[styles.buttonText, styles.submitButtonText]}>
              {modal.editingId ? 'Lưu lịch học' : 'Tạo lịch học'}
            </Text>
          </TouchableOpacity>

          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

export default ScheduleManagement;