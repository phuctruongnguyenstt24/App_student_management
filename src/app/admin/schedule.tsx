// app/admin/schedule.tsx
import { View, Text, TouchableOpacity, ScrollView, TextInput, Modal, Alert, RefreshControl, FlatList } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback } from 'react';
import { styles } from '../../a_styles/style_schedule';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

// API base URL
const host = Constants.expoConfig?.hostUri?.split(':')[0];
const API_URL = `http://${host}:5000/api`;

interface Schedule {
  _id: string;
  courseId: {
    _id: string;
    courseCode: string;
    courseName: string;
  };
  lecturer: string;
  room: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  semester: string;
  maxStudents: number;
  currentStudents: number;
  status: 'active' | 'inactive' | 'full';
  createdAt?: string;
  updatedAt?: string;
}

interface Course {
  _id: string;
  courseCode: string;
  courseName: string;
  credits: number;
}

const DAYS_OF_WEEK = [
  { label: 'Thứ 2', value: 'Monday' },
  { label: 'Thứ 3', value: 'Tuesday' },
  { label: 'Thứ 4', value: 'Wednesday' },
  { label: 'Thứ 5', value: 'Thursday' },
  { label: 'Thứ 6', value: 'Friday' },
  { label: 'Thứ 7', value: 'Saturday' },
  { label: 'Chủ nhật', value: 'Sunday' },
];

const STATUS_COLORS = {
  active: '#28a745',
  inactive: '#dc3545',
  full: '#ffc107',
};

const STATUS_LABELS = {
  active: 'Đang hoạt động',
  inactive: 'Ngừng hoạt động',
  full: 'Đã đầy',
};

export default function ScheduleScreen() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  
  // Form states
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [lecturer, setLecturer] = useState('');
  const [room, setRoom] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [semester, setSemester] = useState('');
  const [maxStudents, setMaxStudents] = useState('');

  // Fetch schedules
  const fetchSchedules = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        router.replace('/login');
        return;
      }

      const response = await fetch(`${API_URL}/schedules`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (data.success) {
        setSchedules(data.data || []);
      } else {
        Alert.alert('Lỗi', data.message || 'Không thể tải danh sách lịch học');
      }
    } catch (error) {
      console.error('Fetch schedules error:', error);
      Alert.alert('Lỗi', 'Không thể kết nối đến server');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch courses for dropdown
  const fetchCourses = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_URL}/courses`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (data.success) {
        setCourses(data.data || []);
      }
    } catch (error) {
      console.error('Fetch courses error:', error);
    }
  };

  useEffect(() => {
    fetchSchedules();
    fetchCourses();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSchedules();
  }, []);

  // Reset form
  const resetForm = () => {
    setSelectedCourseId('');
    setLecturer('');
    setRoom('');
    setDayOfWeek('');
    setStartTime('');
    setEndTime('');
    setSemester('');
    setMaxStudents('');
    setEditingSchedule(null);
  };

  // Open create modal
  const openCreateModal = () => {
    resetForm();
    setModalVisible(true);
  };

  // Open edit modal
  const openEditModal = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setSelectedCourseId(schedule.courseId._id);
    setLecturer(schedule.lecturer);
    setRoom(schedule.room);
    setDayOfWeek(schedule.dayOfWeek);
    setStartTime(schedule.startTime);
    setEndTime(schedule.endTime);
    setSemester(schedule.semester);
    setMaxStudents(schedule.maxStudents.toString());
    setModalVisible(true);
  };

  // Handle create/edit schedule
  const handleSaveSchedule = async () => {
    // Validation
    if (!selectedCourseId || !lecturer || !room || !dayOfWeek || !startTime || !endTime || !semester || !maxStudents) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
      return;
    }

    if (isNaN(Number(maxStudents)) || Number(maxStudents) <= 0) {
      Alert.alert('Lỗi', 'Số lượng sinh viên tối đa phải là số nguyên dương');
      return;
    }

    // Validate time
    if (startTime >= endTime) {
      Alert.alert('Lỗi', 'Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        router.replace('/login');
        return;
      }

      const scheduleData = {
        courseId: selectedCourseId,
        lecturer,
        room,
        dayOfWeek,
        startTime,
        endTime,
        semester,
        maxStudents: Number(maxStudents),
      };

      const url = editingSchedule 
        ? `${API_URL}/schedules/${editingSchedule._id}`
        : `${API_URL}/schedules`;
      
      const method = editingSchedule ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(scheduleData),
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert(
          'Thành công', 
          editingSchedule ? 'Cập nhật lịch học thành công' : 'Thêm lịch học thành công'
        );
        setModalVisible(false);
        resetForm();
        fetchSchedules();
      } else {
        Alert.alert('Lỗi', data.message || 'Không thể lưu lịch học');
      }
    } catch (error) {
      console.error('Save schedule error:', error);
      Alert.alert('Lỗi', 'Không thể kết nối đến server');
    }
  };

  // Handle delete schedule
  const handleDeleteSchedule = (schedule: Schedule) => {
    Alert.alert(
      'Xác nhận xóa',
      `Bạn có chắc chắn muốn xóa lịch học này?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              if (!token) {
                router.replace('/login');
                return;
              }

              const response = await fetch(`${API_URL}/schedules/${schedule._id}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              });

              const data = await response.json();

              if (data.success) {
                Alert.alert('Thành công', 'Xóa lịch học thành công');
                fetchSchedules();
              } else {
                Alert.alert('Lỗi', data.message || 'Không thể xóa lịch học');
              }
            } catch (error) {
              console.error('Delete schedule error:', error);
              Alert.alert('Lỗi', 'Không thể kết nối đến server');
            }
          },
        },
      ]
    );
  };

  // Get day label
  const getDayLabel = (dayValue: string) => {
    const day = DAYS_OF_WEEK.find(d => d.value === dayValue);
    return day ? day.label : dayValue;
  };

  // Format time
  const formatTime = (time: string) => {
    return time.substring(0, 5); // HH:MM
  };

  // Render schedule item
  const renderScheduleItem = ({ item }: { item: Schedule }) => (
    <View style={styles.scheduleCard}>
      <View style={styles.cardHeader}>
        <View style={styles.courseInfo}>
          <Text style={styles.courseCode}>{item.courseId.courseCode}</Text>
          <Text style={styles.courseName}>{item.courseId.courseName}</Text>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => openEditModal(item)}
          >
            <Ionicons name="pencil-outline" size={20} color="#4A90E2" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleDeleteSchedule(item)}
          >
            <Ionicons name="trash-outline" size={20} color="#dc3545" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.scheduleDetails}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Ionicons name="person-outline" size={16} color="#666" />
            <Text style={styles.detailText}>{item.lecturer}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="location-outline" size={16} color="#666" />
            <Text style={styles.detailText}>{item.room}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.detailText}>{getDayLabel(item.dayOfWeek)}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.detailText}>
              {formatTime(item.startTime)} - {formatTime(item.endTime)}
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Ionicons name="book-outline" size={16} color="#666" />
            <Text style={styles.detailText}>HK {item.semester}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="people-outline" size={16} color="#666" />
            <Text style={styles.detailText}>
              {item.currentStudents || 0}/{item.maxStudents}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] }]}>
            <Text style={styles.statusText}>{STATUS_LABELS[item.status]}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  // Render loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quản lý lịch học</Text>
        <TouchableOpacity onPress={openCreateModal} style={styles.addButton}>
          <Ionicons name="add-circle" size={28} color="#4A90E2" />
        </TouchableOpacity>
      </View>

      {/* Body */}
      {schedules.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Chưa có lịch học nào</Text>
          <Text style={styles.emptySubText}>Nhấn nút + để thêm lịch học mới</Text>
        </View>
      ) : (
        <FlatList
          data={schedules}
          renderItem={renderScheduleItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {/* Create/Edit Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          resetForm();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingSchedule ? 'Chỉnh sửa lịch học' : 'Thêm lịch học mới'}
              </Text>
              <TouchableOpacity 
                onPress={() => {
                  setModalVisible(false);
                  resetForm();
                }}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Môn học <Text style={styles.required}>*</Text></Text>
                <View style={styles.pickerContainer}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {courses.map((course) => (
                      <TouchableOpacity
                        key={course._id}
                        style={[
                          styles.pickerItem,
                          selectedCourseId === course._id && styles.pickerItemSelected
                        ]}
                        onPress={() => setSelectedCourseId(course._id)}
                      >
                        <Text style={[
                          styles.pickerItemText,
                          selectedCourseId === course._id && styles.pickerItemTextSelected
                        ]}>
                          {course.courseCode} - {course.courseName}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Giảng viên <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  placeholder="Tên giảng viên"
                  value={lecturer}
                  onChangeText={setLecturer}
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phòng học <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  placeholder="VD: A101"
                  value={room}
                  onChangeText={setRoom}
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Thứ <Text style={styles.required}>*</Text></Text>
                <View style={styles.dayPicker}>
                  {DAYS_OF_WEEK.map((day) => (
                    <TouchableOpacity
                      key={day.value}
                      style={[
                        styles.dayItem,
                        dayOfWeek === day.value && styles.dayItemSelected
                      ]}
                      onPress={() => setDayOfWeek(day.value)}
                    >
                      <Text style={[
                        styles.dayItemText,
                        dayOfWeek === day.value && styles.dayItemTextSelected
                      ]}>
                        {day.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.rowGroup}>
                <View style={[styles.inputGroup, styles.halfInput]}>
                  <Text style={styles.label}>Bắt đầu <Text style={styles.required}>*</Text></Text>
                  <TextInput
                    style={styles.input}
                    placeholder="07:30"
                    value={startTime}
                    onChangeText={setStartTime}
                    placeholderTextColor="#999"
                  />
                </View>

                <View style={[styles.inputGroup, styles.halfInput]}>
                  <Text style={styles.label}>Kết thúc <Text style={styles.required}>*</Text></Text>
                  <TextInput
                    style={styles.input}
                    placeholder="09:30"
                    value={endTime}
                    onChangeText={setEndTime}
                    placeholderTextColor="#999"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Học kỳ <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  placeholder="VD: 2024.1"
                  value={semester}
                  onChangeText={setSemester}
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Số lượng SV tối đa <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  placeholder="VD: 50"
                  value={maxStudents}
                  onChangeText={setMaxStudents}
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  resetForm();
                }}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveSchedule}
              >
                <Text style={styles.saveButtonText}>
                  {editingSchedule ? 'Cập nhật' : 'Thêm mới'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}