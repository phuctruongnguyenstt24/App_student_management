// app/screens/ScheduleManagement.tsx
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { styles } from '../../a_styles/style_schedule';
import { API_URL } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';

// Types
interface Student {
  _id: string;
  username: string;
  fullName: string;
  studentId: string;
  facultyId?: string;
  departmentId?: string;
  class?: string;
  email: string;
  phone?: string;
  role: string;
  isActive: boolean;
  isFirstLogin: boolean;
  status: string;
  gender: string;
  dateOfBirth?: string;
  placeOfBirth?: string;
  address?: string;
  course?: string;
}

interface Faculty { _id: string; name: string; code: string; }
interface Department { _id: string; name: string; code: string; facultyId: string; }
interface Course { _id: string; courseCode: string; courseName: string; credits: number; }
interface Schedule {
  _id: string;
  courseId: Course | { _id: string; courseName: string; courseCode: string };
  lecturer: string;
  room: string;
  dayOfWeek: number[]; // Mảng các ngày
  startTime: string;
  endTime: string;
  semester: string;
  semesterNumber?: number;
  type: string;
  status: string;
  studentIds?: string[];
  isGroupSchedule?: boolean;
}

interface Filters {
  facultyId: string;
  departmentId: string;
  class: string;
}

interface FormData {
  courseId: string;
  lecturer: string;
  room: string;
  type: string;
  days: string[]; // Mảng các ngày đã chọn
  startTime: string;
  endTime: string;
  semester: string;
  semesterNumber: string;
  status: string;
  isGroup: boolean;
  studentIds: string[];
  search: string;
}

interface AppData {
  schedules: Schedule[];
  students: Student[];
  filteredStudents: Student[];
  courses: Course[];
  faculties: Faculty[];
  departments: Department[];
  filteredDepartments: Department[];
  classOptions: string[];
}

const ScheduleManagement = () => {
  const { user, token } = useAuth();
  
  const [data, setData] = useState<AppData>({
    schedules: [],
    students: [],
    filteredStudents: [],
    courses: [],
    faculties: [],
    departments: [],
    filteredDepartments: [],
    classOptions: []
  });

  const [filters, setFilters] = useState<Filters>({ facultyId: '', departmentId: '', class: '' });
  
  const [form, setForm] = useState<FormData>({
    courseId: '', lecturer: '', room: '', type: 'theory',
    days: ['3'], // Mặc định chọn thứ 3
    startTime: '06:00', endTime: '10:00',
    semester: 'HK1 2026',
    semesterNumber: '1',
    status: 'active', isGroup: false,
    studentIds: [], search: ''
  });

  const [modal, setModal] = useState<{ visible: boolean; editingId: string | null }>({ 
    visible: false, 
    editingId: null 
  });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([3]);
  const [conflictCheck, setConflictCheck] = useState<{
    hasConflict: boolean;
    conflicts: string[];
  }>({ hasConflict: false, conflicts: [] });

  const updateForm = <K extends keyof FormData>(key: K, val: FormData[K]) => {
    setForm(prev => ({ ...prev, [key]: val }));
    if (key === 'room' || key === 'startTime' || key === 'endTime' || key === 'lecturer') {
      setConflictCheck({ hasConflict: false, conflicts: [] });
    }
  };

  const updateData = <K extends keyof AppData>(key: K, val: AppData[K]) => {
    setData(prev => ({ ...prev, [key]: val }));
  };

  const toggleDay = (day: number) => {
    setSelectedDays(prev => {
      if (prev.includes(day)) {
        return prev.filter(d => d !== day);
      } else {
        return [...prev, day].sort();
      }
    });
    setConflictCheck({ hasConflict: false, conflicts: [] });
  };

  // Hàm kiểm tra xung đột lịch
  const checkScheduleConflicts = useCallback(async () => {
    if (!form.room.trim() || !form.lecturer.trim() || selectedDays.length === 0) {
      return;
    }

    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const conflicts: string[] = [];
      
      const res = await fetch(`${API_URL}/schedules`, { headers });
      const result = await res.json();
      const existingSchedules: Schedule[] = result.success ? result.data : [];

      const schedulesToCheck = modal.editingId 
        ? existingSchedules.filter(s => s._id !== modal.editingId)
        : existingSchedules;

      // Kiểm tra cho từng ngày đã chọn
      for (const day of selectedDays) {
        // Kiểm tra phòng học
        const roomConflicts = schedulesToCheck.filter(s => 
          s.room === form.room.trim() &&
          s.dayOfWeek.includes(day) &&
          isTimeOverlapping(s.startTime, s.endTime, form.startTime, form.endTime)
        );

        if (roomConflicts.length > 0) {
          const conflictInfo = roomConflicts.map(s => {
            const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
            const courseName = typeof s.courseId === 'object' ? s.courseId.courseName : 'Khóa học';
            return `Phòng ${s.room}: ${courseName} (${days[day]} ${s.startTime}-${s.endTime})`;
          }).join('\n');
          conflicts.push(`⚠️ Xung đột phòng học ngày ${day === 0 ? 'CN' : `T${day}`}:\n${conflictInfo}`);
        }

        // Kiểm tra giảng viên
        const lecturerConflicts = schedulesToCheck.filter(s => 
          s.lecturer === form.lecturer.trim() &&
          s.dayOfWeek.includes(day) &&
          isTimeOverlapping(s.startTime, s.endTime, form.startTime, form.endTime)
        );

        if (lecturerConflicts.length > 0) {
          const conflictInfo = lecturerConflicts.map(s => {
            const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
            const courseName = typeof s.courseId === 'object' ? s.courseId.courseName : 'Khóa học';
            return `${courseName} (${days[day]} ${s.startTime}-${s.endTime}) tại phòng ${s.room}`;
          }).join('\n');
          conflicts.push(`⚠️ Giảng viên bận ngày ${day === 0 ? 'CN' : `T${day}`}:\n${conflictInfo}`);
        }
      }

      if (conflicts.length > 0) {
        setConflictCheck({ hasConflict: true, conflicts });
      } else {
        setConflictCheck({ hasConflict: false, conflicts: ['✅ Không có xung đột'] });
      }
    } catch (error) {
      console.error('Error checking conflicts:', error);
    }
  }, [form.room, form.lecturer, form.startTime, form.endTime, selectedDays, token, modal.editingId]);

  const isTimeOverlapping = (start1: string, end1: string, start2: string, end2: string) => {
    const s1 = parseInt(start1.replace(':', ''));
    const e1 = parseInt(end1.replace(':', ''));
    const s2 = parseInt(start2.replace(':', ''));
    const e2 = parseInt(end2.replace(':', ''));
    return (s1 < e2 && s2 < e1);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (form.room.trim() && form.lecturer.trim() && selectedDays.length > 0) {
        checkScheduleConflicts();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [form.room, form.lecturer, form.startTime, form.endTime, selectedDays, checkScheduleConflicts]);

  const fetchAll = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const [schedulesRes, studentsRes, coursesRes, facultiesRes, deptsRes] = await Promise.all([
        fetch(`${API_URL}/schedules`, { headers }),
        fetch(`${API_URL}/students/all`, { headers }),
        fetch(`${API_URL}/courses`, { headers }),
        fetch(`${API_URL}/faculties`, { headers }),
        fetch(`${API_URL}/departments`, { headers })
      ]);

      const schedules = await schedulesRes.json();
      const students = await studentsRes.json();
      const courses = await coursesRes.json();
      const faculties = await facultiesRes.json();
      const depts = await deptsRes.json();

      const studentList: Student[] = students.success ? students.students : [];
      const classSet = new Set<string>();
      studentList.forEach((s: Student) => {
        if (s.class) classSet.add(s.class);
      });

      const facultyList: Faculty[] = Array.isArray(faculties) ? faculties : (faculties.data || faculties.faculties || []);
      const deptList: Department[] = Array.isArray(depts) ? depts : (depts.data || depts.departments || []);

      setData({
        schedules: schedules.success ? schedules.data : [],
        students: studentList,
        filteredStudents: studentList,
        courses: courses.success ? courses.data : [],
        faculties: facultyList,
        departments: deptList,
        filteredDepartments: deptList,
        classOptions: Array.from(classSet).sort()
      });
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể tải dữ liệu');
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    let filtered: Student[] = [...data.students];
    const { facultyId, departmentId, class: cls } = filters;
    const search = form.search.trim().toLowerCase();
    
    if (search) {
      filtered = filtered.filter((s: Student) => 
        s.fullName.toLowerCase().includes(search) || 
        s.studentId.toLowerCase().includes(search) ||
        s.username.toLowerCase().includes(search) ||
        s.email.toLowerCase().includes(search)
      );
    }
    if (facultyId) filtered = filtered.filter((s: Student) => s.facultyId === facultyId);
    if (departmentId) filtered = filtered.filter((s: Student) => s.departmentId === departmentId);
    if (cls) filtered = filtered.filter((s: Student) => s.class === cls);
    
    updateData('filteredStudents', filtered);
  }, [form.search, filters, data.students]);

  useEffect(() => {
    const filtered = filters.facultyId 
      ? data.departments.filter((d: Department) => d.facultyId === filters.facultyId)
      : data.departments;
    updateData('filteredDepartments', filtered);
    if (filters.departmentId && !filtered.some((d: Department) => d._id === filters.departmentId)) {
      setFilters(prev => ({ ...prev, departmentId: '' }));
    }
  }, [filters.facultyId, data.departments]);

  useEffect(() => { if (token) fetchAll(); }, [token]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAll().finally(() => setRefreshing(false));
  }, [fetchAll]);

  const resetFilters = () => {
    setFilters({ facultyId: '', departmentId: '', class: '' });
    updateData('filteredStudents', data.students);
    updateForm('search', '');
  };

  const toggleStudent = (id: string) => {
    const ids = form.studentIds.includes(id) 
      ? form.studentIds.filter((s: string) => s !== id) 
      : [...form.studentIds, id];
    updateForm('studentIds', ids);
  };

  const toggleSelectAll = () => {
    const ids = data.filteredStudents.map((s: Student) => s._id);
    updateForm('studentIds', ids.every((id: string) => form.studentIds.includes(id)) ? [] : ids);
  };

  const handleSubmit = async () => {
    if (!form.courseId || !form.lecturer.trim() || !form.room.trim()) {
      return Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
    }
    if (selectedDays.length === 0) {
      return Alert.alert('Lỗi', 'Vui lòng chọn ít nhất 1 ngày trong tuần');
    }
    if (form.startTime >= form.endTime) {
      return Alert.alert('Lỗi', 'Thời gian bắt đầu phải nhỏ hơn kết thúc');
    }

    if (conflictCheck.hasConflict) {
      Alert.alert(
        '⚠️ Xung đột lịch',
        `Phát hiện xung đột:\n\n${conflictCheck.conflicts.join('\n\n')}\n\nBạn có chắc muốn tiếp tục?`,
        [
          { text: 'Hủy', style: 'cancel' },
          { 
            text: 'Vẫn tạo', 
            style: 'destructive',
            onPress: () => submitSchedule()
          }
        ]
      );
    } else {
      submitSchedule();
    }
  };

  const submitSchedule = async () => {
    setSubmitting(true);
    try {
      // Tạo 1 schedule duy nhất với nhiều ngày
      const url = modal.editingId ? `${API_URL}/schedules/${modal.editingId}` : `${API_URL}/schedules`;
      const scheduleData = {
        courseId: form.courseId,
        lecturer: form.lecturer.trim(),
        room: form.room.trim(),
        dayOfWeek: selectedDays, // Gửi mảng các ngày đã chọn
        startTime: form.startTime,
        endTime: form.endTime,
        semester: form.semester,
        semesterNumber: parseInt(form.semesterNumber),
        type: form.type,
        status: form.status,
        isGroupSchedule: form.isGroup,
        maxStudents: 50,
        studentIds: form.isGroup ? form.studentIds : []
      };

      const res = await fetch(url, {
        method: modal.editingId ? 'PUT' : 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleData)
      });

      const result = await res.json();
      
      if (result.success) {
        Alert.alert('Thành công', modal.editingId ? 'Cập nhật thành công' : `Tạo thành công lịch học với ${selectedDays.length} ngày`);
        setModal({ visible: false, editingId: null });
        setSelectedDays([3]);
        setConflictCheck({ hasConflict: false, conflicts: [] });
        fetchAll();
      } else {
        Alert.alert('Lỗi', result.message || 'Có lỗi xảy ra');
      }
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể kết nối server');
    }
    setSubmitting(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Xác nhận', 'Bạn có chắc muốn xóa?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: async () => {
          const res = await fetch(`${API_URL}/schedules/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const result = await res.json();
          if (result.success) {
            Alert.alert('Thành công', 'Đã xóa');
            fetchAll();
          } else Alert.alert('Lỗi', result.message);
        }
      }
    ]);
  };

  const openModal = (schedule?: Schedule) => {
    if (schedule) {
      const c = typeof schedule.courseId === 'object' ? schedule.courseId._id : '';
      const days = schedule.dayOfWeek || [3];
      setSelectedDays(days);
      setForm({
        courseId: c, 
        lecturer: schedule.lecturer, 
        room: schedule.room,
        type: schedule.type || 'theory', 
        days: days.map(d => d.toString()),
        startTime: schedule.startTime, 
        endTime: schedule.endTime,
        semester: schedule.semester,
        semesterNumber: schedule.semesterNumber?.toString() || '1',
        status: schedule.status || 'active',
        isGroup: schedule.isGroupSchedule || false,
        studentIds: schedule.studentIds || [], 
        search: ''
      });
      setModal({ visible: true, editingId: schedule._id });
      setConflictCheck({ hasConflict: false, conflicts: [] });
    } else {
      setSelectedDays([3]);
      setForm({ 
        courseId: '', lecturer: '', room: '', type: 'theory', 
        days: ['3'],
        startTime: '06:00', endTime: '10:00', 
        semester: 'HK1 2026',
        semesterNumber: '1',
        status: 'active', isGroup: false, 
        studentIds: [], search: '' 
      });
      setModal({ visible: true, editingId: null });
      setConflictCheck({ hasConflict: false, conflicts: [] });
    }
    resetFilters();
  };

  const renderItem = ({ item }: { item: Schedule }) => {
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const types: Record<string, { label: string; color: string }> = { 
    theory: { label: 'Lý thuyết', color: '#1890ff' }, 
    practice: { label: 'Thực hành', color: '#52c41a' }, 
    exam: { label: 'Thi', color: '#faad14' } 
  };
  const t = types[item.type] || types.theory;
  
  // Sửa: Lấy tên khóa học an toàn hơn
  let name = '';
  if (typeof item.courseId === 'object' && item.courseId !== null) {
    // Kiểm tra xem courseId có phải là object không và có thuộc tính courseName không
    const course = item.courseId as any;
    name = course.courseName || '';
  }
    return (
      <View style={styles.scheduleCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.courseName}>{name}</Text>
          <View style={[styles.typeBadge, { backgroundColor: t.color }]}>
            <Text style={styles.typeText}>{t.label}</Text>
          </View>
        </View>
        <View style={styles.cardBody}>
          {[
            { icon: 'person', text: item.lecturer },
            { icon: 'location', text: item.room },
            { icon: 'calendar', text: item.dayOfWeek.map((d: number) => days[d]).join(', ') },
            { icon: 'time', text: `${item.startTime} - ${item.endTime}` }
          ].map(({ icon, text }) => (
            <View key={icon} style={styles.infoRow}>
              <Ionicons name={`${icon}-outline` as any} size={16} color="#666" />
              <Text style={styles.infoText}>{text}</Text>
            </View>
          ))}
          {item.semesterNumber && (
            <View style={styles.infoRow}>
              <Ionicons name="book-outline" size={16} color="#666" />
              <Text style={styles.infoText}>HK {item.semesterNumber}</Text>
            </View>
          )}
          {item.isGroupSchedule && (
            <View style={styles.infoRow}>
              <Ionicons name="people-outline" size={16} color="#666" />
              <Text style={styles.infoText}>Nhóm: {item.studentIds?.length || 0} SV</Text>
            </View>
          )}
        </View>
        <View style={styles.cardFooter}>
          <Text style={styles.semesterText}>{item.semester}</Text>
          <View style={styles.cardActions}>
            <TouchableOpacity onPress={() => openModal(item)}>
              <Ionicons name="pencil" size={18} color="#1890ff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item._id)}>
              <Ionicons name="trash" size={18} color="#ff4d4f" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderFilterSection = () => (
    <View style={styles.filterContainer}>
      <View style={styles.filterHeader}>
        <Text style={styles.filterTitle}>Lọc sinh viên</Text>
        <TouchableOpacity onPress={toggleSelectAll}>
          <Text style={styles.selectAllText}>
            {data.filteredStudents.length > 0 && 
             data.filteredStudents.every((s: Student) => form.studentIds.includes(s._id)) 
              ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
          </Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {[
          { key: 'facultyId' as const, label: 'Khoa', items: data.faculties },
          { key: 'departmentId' as const, label: 'Ngành', items: data.filteredDepartments },
          { key: 'class' as const, label: 'Lớp', items: data.classOptions.map((c: string) => ({ _id: c, name: c })) }
        ].map(({ key, label, items }) => (
          <View key={key} style={styles.filterGroup}>
            <Text style={styles.filterLabel}>{label}</Text>
            <View style={styles.filterPickerContainer}>
              <Picker
                selectedValue={filters[key]}
                onValueChange={(v: string) => setFilters(prev => ({ ...prev, [key]: v }))}
                style={styles.filterPicker}
              >
                <Picker.Item label="Tất cả" value="" />
                {items.map((item: any) => (
                  <Picker.Item key={item._id} label={item.name} value={item._id} />
                ))}
              </Picker>
            </View>
          </View>
        ))}
        <TouchableOpacity style={styles.resetFilterButton} onPress={resetFilters}>
          <Ionicons name="refresh-outline" size={20} color="#1890ff" />
          <Text style={styles.resetFilterText}>Đặt lại</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  if (!user || !token) return (
    <View style={styles.loadingContainer}>
      <Ionicons name="lock-closed-outline" size={60} color="#ccc" />
      <Text style={styles.emptyText}>Vui lòng đăng nhập</Text>
      <TouchableOpacity style={styles.emptyButton} onPress={() => router.push('/login')}>
        <Text style={styles.emptyButtonText}>Đăng nhập</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#1890ff" />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
         <TouchableOpacity onPress={() => {
            if(router.canGoBack()) router.replace('/admin/dashboard' as any);
        }}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quản lý lịch học</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => openModal()}>
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Thêm lịch</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={data.schedules}
        renderItem={renderItem}
        keyExtractor={(item: Schedule) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>Chưa có lịch học</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={() => openModal()}>
              <Text style={styles.emptyButtonText}>Thêm lịch đầu tiên</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <Modal visible={modal.visible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{modal.editingId ? 'Cập nhật' : 'Thêm'} lịch học</Text>
              <TouchableOpacity onPress={() => {
                setModal({ visible: false, editingId: null });
                setSelectedDays([3]);
                setConflictCheck({ hasConflict: false, conflicts: [] });
              }}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Khóa học *</Text>
              <View style={styles.pickerContainer}>
                <Picker selectedValue={form.courseId} onValueChange={(v: string) => updateForm('courseId', v)} style={styles.picker}>
                  <Picker.Item label="Chọn khóa học" value="" />
                  {data.courses.map((c: Course) => (
                    <Picker.Item key={c._id} label={`${c.courseCode} - ${c.courseName}`} value={c._id} />
                  ))}
                </Picker>
              </View>
            </View>

            {['lecturer', 'room'].map((f) => (
              <View key={f} style={styles.formGroup}>
                <Text style={styles.label}>{f === 'lecturer' ? 'Giảng viên' : 'Phòng học'} *</Text>
                <TextInput 
                  style={styles.input} 
                  value={form[f as keyof FormData] as string} 
                  onChangeText={(v: string) => updateForm(f as keyof FormData, v)} 
                  placeholder={`Nhập ${f === 'lecturer' ? 'tên giảng viên' : 'phòng học'}`} 
                />
              </View>
            ))}

            <View style={styles.formGroup}>
              <Text style={styles.label}>Loại lịch</Text>
              <View style={styles.pickerContainer}>
                <Picker selectedValue={form.type} onValueChange={(v: string) => updateForm('type', v)} style={styles.picker}>
                  <Picker.Item label="Lý thuyết" value="theory" />
                  <Picker.Item label="Thực hành" value="practice" />
                  <Picker.Item label="Thi" value="exam" />
                </Picker>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Chọn ngày trong tuần * (có thể chọn nhiều)</Text>
              <View style={styles.dayPickerContainer}>
                {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day, index) => {
                  const dayValue = index === 6 ? 0 : index + 1;
                  const isSelected = selectedDays.includes(dayValue);
                  return (
                    <TouchableOpacity
                      key={dayValue}
                      style={[
                        styles.dayButton,
                        isSelected && styles.dayButtonSelected
                      ]}
                      onPress={() => toggleDay(dayValue)}
                    >
                      <Text style={[
                        styles.dayButtonText,
                        isSelected && styles.dayButtonTextSelected
                      ]}>
                        {day}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={styles.selectedDaysText}>
                Đã chọn: {selectedDays.length} ngày
              </Text>
            </View>

            <View style={styles.rowGroup}>
              {['startTime', 'endTime'].map((f, i) => (
                <View key={f} style={[styles.formGroup, { flex: 1, marginLeft: i === 1 ? 8 : 0 }]}>
                  <Text style={styles.label}>{i === 0 ? 'Từ' : 'Đến'}</Text>
                  <TextInput style={styles.input} value={form[f as keyof FormData] as string} onChangeText={(v: string) => updateForm(f as keyof FormData, v)} placeholder="HH:MM" />
                </View>
              ))}
            </View>

            <View style={styles.rowGroup}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Học kỳ</Text>
                <TextInput style={styles.input} value={form.semester} onChangeText={(v: string) => updateForm('semester', v)} placeholder="HK1 2026" />
              </View>
              <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Số học kỳ</Text>
                <View style={styles.pickerContainer}>
                  <Picker 
                    selectedValue={form.semesterNumber} 
                    onValueChange={(v: string) => updateForm('semesterNumber', v)} 
                    style={styles.picker}
                  >
                    {[1,2,3,4,5,6,7,8,9,10].map(num => (
                      <Picker.Item key={num} label={`HK ${num}`} value={String(num)} />
                    ))}
                  </Picker>
                </View>
              </View>
            </View>

            {/* Hiển thị kết quả kiểm tra xung đột */}
            {conflictCheck.conflicts.length > 0 && (
              <View style={[
                styles.conflictContainer,
                conflictCheck.hasConflict ? styles.conflictError : styles.conflictSuccess
              ]}>
                {conflictCheck.conflicts.map((msg, index) => (
                  <Text key={index} style={styles.conflictText}>{msg}</Text>
                ))}
              </View>
            )}

            <TouchableOpacity style={styles.checkboxRow} onPress={() => updateForm('isGroup', !form.isGroup)}>
              <View style={[styles.checkbox, form.isGroup && styles.checkboxChecked]}>
                {form.isGroup && <Ionicons name="checkmark" size={16} color="#fff" />}
              </View>
              <Text style={styles.checkboxLabel}>Lịch nhóm</Text>
            </TouchableOpacity>

            {form.isGroup && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Chọn sinh viên ({form.studentIds.length})</Text>
                <TextInput style={styles.input} value={form.search} onChangeText={(v: string) => updateForm('search', v)} placeholder="Tìm kiếm..." />
                {renderFilterSection()}
                <View style={styles.studentList}>
                  {data.filteredStudents.length === 0 ? (
                    <Text style={styles.emptyStudentText}>Không tìm thấy sinh viên</Text>
                  ) : (
                    data.filteredStudents.map((s: Student) => (
                      <TouchableOpacity 
                        key={s._id} 
                        style={[styles.studentItem, form.studentIds.includes(s._id) && styles.studentItemSelected]} 
                        onPress={() => toggleStudent(s._id)}
                      >
                        <View>
                          <Text style={styles.studentName}>{s.fullName}</Text>
                          <Text style={styles.studentId}>{s.studentId}</Text>
                        </View>
                        {form.studentIds.includes(s._id) && <Ionicons name="checkmark-circle" size={20} color="#1890ff" />}
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => {
                setModal({ visible: false, editingId: null });
                setSelectedDays([3]);
                setConflictCheck({ hasConflict: false, conflicts: [] });
              }}>
                <Text style={styles.buttonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.button, 
                  styles.submitButton,
                  conflictCheck.hasConflict && styles.submitButtonWarning
                ]} 
                onPress={handleSubmit} 
                disabled={submitting}
              >
                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={[styles.buttonText, styles.submitButtonText]}>
                  {modal.editingId ? 'Cập nhật' : `Tạo (${selectedDays.length} ngày)`}
                </Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

export default ScheduleManagement;