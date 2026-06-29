// app/admin/schedule.tsx
import { View, Text, TouchableOpacity, ScrollView, TextInput, Modal, Alert, RefreshControl, FlatList } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback } from 'react';
import { styles } from '../../a_styles/style_schedule';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../../config/api';
import { replace } from 'expo-router/build/global-state/router';

// Types
interface Schedule {
  _id: string;
  courseId: { _id: string; courseCode: string; courseName: string };
  type: 'theory' | 'practice' | 'exam';
  group?: 1 | 2;
  lecturer: string;
  room: string;
  dates: string[]; // Nhiều ngày
  startTime: string;
  endTime: string;
  slots: number;
  semester: string;
  maxStudents: number;
  status: 'active' | 'inactive' | 'temporary';
  studentIds?: string[];
  isGroupSchedule?: boolean;
  createdAt?: string;
}

interface Course {
  _id: string;
  courseCode: string;
  courseName: string;
  credits: number;
  totalStudents: number;
}

interface Student {
  _id: string;
  fullName: string;
  studentId: string;
  email: string;
  class: string;
  status: 'active' | 'inactive';
}

const DAYS_OF_WEEK = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
const SLOT_TIMES = {
  morning: { start: '07:00', end: '11:30' },
  afternoon: { start: '13:20', end: '17:20' },
  evening: { start: '18:20', end: '21:20' }
};

export default function ScheduleScreen() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [studentModal, setStudentModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);

  // Form states
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [type, setType] = useState<'theory' | 'practice' | 'exam'>('theory');
  const [lecturer, setLecturer] = useState('');
  const [room, setRoom] = useState('');
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [slots, setSlots] = useState('3');
  const [semester, setSemester] = useState('');
  const [group, setGroup] = useState<1 | 2>(1);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [searchStudent, setSearchStudent] = useState('');

  // Fetch data
  const fetchSchedules = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return router.replace('/login');

      const res = await fetch(`${API_URL}/schedules`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      console.log('Full response:', data); // Thêm dòng này để debug

      if (data.success) {
        setSchedules(data.data || []);
      } else {
        console.log('API Error:', data.message);
        setSchedules([]); // Đảm bảo set rỗng nếu lỗi
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setSchedules([]); // Đảm bảo set rỗng nếu lỗi
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchCourses = async () => {
    const token = await AsyncStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/courses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setCourses(data.data || []);
    } catch (error) { console.error('Fetch courses error:', error); }
  };

  const fetchStudents = async () => {
    const token = await AsyncStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/auth/students`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setStudents(data.students || []);
    } catch (error) { console.error('Fetch students error:', error); }
  };

  useEffect(() => {
    fetchSchedules();
    fetchCourses();
    fetchStudents();
  }, []);

  const onRefresh = useCallback(() => { setRefreshing(true); fetchSchedules(); }, []);

  const resetForm = () => {
    setSelectedCourseId('');
    setType('theory');
    setLecturer('');
    setRoom('');
    setSelectedDates([]);
    setStartTime('');
    setEndTime('');
    setSlots('3');
    setSemester('');
    setGroup(1);
    setSelectedStudents([]);
    setEditingSchedule(null);
  };

  // Auto split students by name
  const autoSplitStudents = (courseId: string) => {
    const course = courses.find(c => c._id === courseId);
    if (!course || course.totalStudents <= 50) {
      return { group1: students.filter(s => s.status === 'active'), group2: [] };
    }

    const sorted = students.filter(s => s.status === 'active')
      .sort((a, b) => a.fullName.localeCompare(b.fullName, 'vi'));
    const half = Math.ceil(sorted.length / 2);
    return {
      group1: sorted.slice(0, half),
      group2: sorted.slice(half)
    };
  };

  //Debug

  

  const handleSaveSchedule = async () => {
    if (!selectedCourseId || !lecturer || !room || selectedDates.length === 0 || !startTime || !endTime || !semester) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return router.replace('/login');

      const course = courses.find(c => c._id === selectedCourseId);
      let studentIds: string[] = [];

      if (type === 'theory') {
        studentIds = students.filter(s => s.status === 'active').map(s => s._id);
      } else {
        const { group1, group2 } = autoSplitStudents(selectedCourseId);
        studentIds = group === 1
          ? group1.map(s => s._id)
          : group2.map(s => s._id);
      }

      // Tính dayOfWeek từ selectedDates - ĐẢM BẢO LÀ MẢNG SỐ
      const dayOfWeek = selectedDates.map(date => {
        const d = new Date(date);
        return d.getDay(); // Trả về số: 0-6
      });

      // Lấy user ID từ token hoặc AsyncStorage
      const userData = await AsyncStorage.getItem('user');
      const user = userData ? JSON.parse(userData) : null;

      const scheduleData = {
        courseId: selectedCourseId,
        lecturer: lecturer,
        type:type,
        room: room,
        dayOfWeek: dayOfWeek, // Mảng số: [1, 2, 3]
        startTime: startTime,
        endTime: endTime,
        semester: semester,
        maxStudents: course?.totalStudents || 50,
        studentIds: studentIds,
        isGroupSchedule: type !== 'theory',
        createdBy: user?._id || user?.id, // Thêm createdBy vì model yêu cầu
        // Nếu là lịch cá nhân thì thêm studentId
        // studentId: type === 'theory' ? null : null,
      };

      console.log('Sending data:', JSON.stringify(scheduleData, null, 2)); // Debug

      const url = editingSchedule
        ? `${API_URL}/schedules/${editingSchedule._id}`
        : `${API_URL}/schedules`;
      const method = editingSchedule ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(scheduleData),
      });
      const data = await res.json();

      if (data.success) {
        Alert.alert('Thành công', editingSchedule ? 'Cập nhật thành công' : 'Tạo lịch thành công');
        setModalVisible(false);
        resetForm();
        fetchSchedules();
      } else {
        Alert.alert('Lỗi', data.message || 'Không thể lưu');
        console.log('Error response:', data);
      }
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Lỗi', 'Không thể kết nối server');
    }
  };

  const handleDeleteSchedule = (schedule: Schedule) => {
    Alert.alert('Xác nhận xóa', 'Bạn có chắc chắn muốn xóa?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return router.replace('/login');
            const res = await fetch(`${API_URL}/schedules/${schedule._id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
              Alert.alert('Thành công', 'Xóa thành công');
              fetchSchedules();
            }
          } catch (error) { console.error('Delete error:', error); }
        },
      },
    ]);
  };

  const toggleDateSelection = (date: string) => {
    setSelectedDates(prev =>
      prev.includes(date) ? prev.filter(d => d !== date) : [...prev, date]
    );
  };

  const toggleStudentSelection = (id: string) => {
    setSelectedStudents(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const getDayLabel = (day: string) => {
    const d = new Date(day);
    return `${DAYS_OF_WEEK[d.getDay()]}, ${d.getDate()}/${d.getMonth() + 1}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#28a745';
      case 'inactive': return '#dc3545';
      case 'temporary': return '#ffc107';
      default: return '#6c757d';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Đang hoạt động';
      case 'inactive': return 'Ngừng hoạt động';
      case 'temporary': return 'Tạm ngưng';
      default: return 'Không xác định';
    }
  };

const getTypeLabel = (type: string) => {
  if (type === 'theory') return 'Lý thuyết';
  if (type === 'practice') return 'Thực hành';
  if (type === 'exam') return 'Thi';
  return 'Khác'; // Chỉ trả về 'Khác' khi type không khớp
};

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'theory': return '#4A90E2';
      case 'practice': return '#28a745';
      case 'exam': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const renderScheduleItem = ({ item }: { item: Schedule }) => (
    <View style={styles.scheduleCard}>
      <View style={styles.cardHeader}>
        <View style={styles.courseInfo}>
          <Text style={styles.courseCode}>{item.courseId.courseCode}</Text>
          <Text style={styles.courseName}>{item.courseId.courseName}</Text>
          <View style={styles.typeBadgeContainer}>
            <View style={[styles.typeBadge, { backgroundColor: getTypeColor(item.type) }]}>
              <Text style={styles.typeText}>{getTypeLabel(item.type)}</Text>
            </View>
            {item.group && (
              <View style={[styles.typeBadge, { backgroundColor: '#6c5ce7', marginLeft: 4 }]}>
                <Text style={styles.typeText}>Nhóm {item.group}</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.actionButton} onPress={() => {
            setEditingSchedule(item);
            setSelectedCourseId(item.courseId._id);
            setType(item.type);
            setLecturer(item.lecturer);
            setRoom(item.room);
            setSelectedDates(Array.isArray(item.dates) ? item.dates : []);
            setStartTime(item.startTime);
            setEndTime(item.endTime);
            setSlots(item.slots?.toString() || '');
            setSemester(item.semester);
            setGroup(item.group || 1);
            setSelectedStudents(item.studentIds || []);
            setModalVisible(true);
          }}>
            <Ionicons name="pencil-outline" size={20} color="#4A90E2" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleDeleteSchedule(item)}>
            <Ionicons name="trash-outline" size={20} color="#dc3545" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.scheduleDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="person-outline" size={16} color="#666" />
          <Text style={styles.detailText}>{item.lecturer}</Text>
          <Ionicons name="location-outline" size={16} color="#666" style={{ marginLeft: 12 }} />
          <Text style={styles.detailText}>{item.room}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={16} color="#666" />
          <Text style={styles.detailText}>{item.startTime} - {item.endTime} ({item.slots} tiết)</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={styles.detailText}>
            {item.dates?.map(d => getDayLabel(d)).join(', ') || 'Chưa có lịch'}
          </Text>
        </View>
        <View style={[styles.detailRow, styles.statusRow]}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {getStatusLabel(item.status)}
            </Text>
          </View>
          {item.studentIds && (
            <Text style={styles.studentCount}>
              {item.studentIds.length} sinh viên
            </Text>
          )}
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  const handleback =  () => {
    if(router.canGoBack()){
      router.back();
    }else {
      router.replace('/admin/dashboard');
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleback} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quản lý lịch học</Text>
        <TouchableOpacity onPress={() => { resetForm(); setModalVisible(true); }} style={styles.addButton}>
          <Ionicons name="add-circle" size={28} color="#4A90E2" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={schedules}
        renderItem={renderScheduleItem}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Chưa có lịch học nào</Text>
          </View>
        )}
      />

      {/* Schedule Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingSchedule ? 'Sửa lịch học' : 'Tạo lịch học mới'}
              </Text>
              <TouchableOpacity onPress={() => { setModalVisible(false); resetForm(); }}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {/* Loại học */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Loại <Text style={styles.required}>*</Text></Text>
              <View style={styles.typeToggle}>
  {['theory', 'practice', 'exam'].map(t => (
    <TouchableOpacity
      key={t}
      style={[styles.typeOption, type === t && styles.typeOptionActive]}
      onPress={() => {
        console.log('Selected type:', t); // Debug
        setType(t as any);
        console.log('Current type after set:', type); // Debug
      }}
    >
      <Text style={[styles.typeOptionText, type === t && styles.typeOptionTextActive]}>
        {getTypeLabel(t)}
      </Text>
    </TouchableOpacity>
  ))}
</View>
{/* Thêm dòng debug hiển thị type hiện tại */}
<Text style={{marginTop: 5, color: 'red', fontWeight: 'bold'}}>
  Current type: {type}
</Text>
              </View>

              {/* Môn học */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Môn học <Text style={styles.required}>*</Text></Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {courses.map(c => (
                    <TouchableOpacity
                      key={c._id}
                      style={[styles.pickerItem, selectedCourseId === c._id && styles.pickerItemSelected]}
                      onPress={() => setSelectedCourseId(c._id)}
                    >
                      <Text style={[styles.pickerItemText, selectedCourseId === c._id && styles.pickerItemTextSelected]}>
                        {c.courseCode} - {c.courseName}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Nhóm (cho thực hành và thi) */}
              {(type === 'practice' || type === 'exam') && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Nhóm <Text style={styles.required}>*</Text></Text>
                  <View style={styles.typeToggle}>
                    <TouchableOpacity
                      style={[styles.typeOption, group === 1 && styles.typeOptionActive]}
                      onPress={() => setGroup(1)}
                    >
                      <Text style={[styles.typeOptionText, group === 1 && styles.typeOptionTextActive]}>
                        Nhóm 1 (A - ...)
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.typeOption, group === 2 && styles.typeOptionActive]}
                      onPress={() => setGroup(2)}
                    >
                      <Text style={[styles.typeOptionText, group === 2 && styles.typeOptionTextActive]}>
                        Nhóm 2 (... - Z)
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Giảng viên <Text style={styles.required}>*</Text></Text>
                <TextInput style={styles.input} placeholder="Tên giảng viên" value={lecturer} onChangeText={setLecturer} />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phòng học <Text style={styles.required}>*</Text></Text>
                <TextInput style={styles.input} placeholder="VD: A101" value={room} onChangeText={setRoom} />
              </View>

              {/* Chọn ngày */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Ngày học <Text style={styles.required}>*</Text></Text>
                <Text style={styles.subLabel}>Chọn nhiều ngày (chạm để chọn/bỏ chọn)</Text>
                <View style={styles.datePicker}>
                  {[0, 1, 2, 3, 4, 5, 6].map(offset => {
                    const d = new Date();
                    d.setDate(d.getDate() + offset);
                    const dateStr = d.toISOString().split('T')[0];
                    const isSelected =
                      Array.isArray(selectedDates) &&
                      selectedDates.includes(dateStr);
                    return (
                      <TouchableOpacity
                        key={offset}
                        style={[styles.dateItem, isSelected && styles.dateItemSelected]}
                        onPress={() => toggleDateSelection(dateStr)}
                      >
                        <Text style={[styles.dateItemText, isSelected && styles.dateItemTextSelected]}>
                          {DAYS_OF_WEEK[d.getDay()]}
                        </Text>
                        <Text style={[styles.dateItemNumber, isSelected && styles.dateItemTextSelected]}>
                          {d.getDate()}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {Array.isArray(selectedDates) && selectedDates.length > 0 && (
                  <Text style={styles.selectedInfo}>
                    Đã chọn {selectedDates.length} ngày
                  </Text>
                )}
              </View>

              <View style={styles.rowGroup}>
                <View style={[styles.inputGroup, styles.halfInput]}>
                  <Text style={styles.label}>Bắt đầu <Text style={styles.required}>*</Text></Text>
                  <TextInput style={styles.input} placeholder="07:00" value={startTime} onChangeText={setStartTime} />
                </View>
                <View style={[styles.inputGroup, styles.halfInput]}>
                  <Text style={styles.label}>Kết thúc <Text style={styles.required}>*</Text></Text>
                  <TextInput style={styles.input} placeholder="09:30" value={endTime} onChangeText={setEndTime} />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Số tiết</Text>
                <TextInput style={styles.input} placeholder="3" value={slots} onChangeText={setSlots} keyboardType="numeric" />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Học kỳ <Text style={styles.required}>*</Text></Text>
                <TextInput style={styles.input} placeholder="VD: 2024.1" value={semester} onChangeText={setSemester} />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Trạng thái</Text>
                <View style={styles.statusToggle}>
                  {['active', 'inactive', 'temporary'].map(s => (
                    <TouchableOpacity
                      key={s}
                      style={[styles.statusOption, editingSchedule?.status === s && styles.statusOptionActive]}
                      onPress={() => setEditingSchedule(prev => prev ? { ...prev, status: s as any } : null)}
                    >
                      <Text style={[styles.statusOptionText, editingSchedule?.status === s && styles.statusOptionTextActive]}>
                        {getStatusLabel(s)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => { setModalVisible(false); resetForm(); }}>
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleSaveSchedule}>
                <Text style={styles.saveButtonText}>{editingSchedule ? 'Cập nhật' : 'Thêm mới'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}