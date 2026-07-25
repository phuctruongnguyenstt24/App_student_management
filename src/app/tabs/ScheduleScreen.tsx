// app/screens/StudentSchedule.tsx
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../../a_styles/style_student_schedule';
import { API_URL } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';

interface Schedule {
  _id: string;
  courseId: {
    _id: string;
    courseName: string;
    courseCode: string;
    credits?: number;
  };
  studentId?: string;
  studentIds?: string[];
  lecturer: string;
  room: string;
  dayOfWeek: number[];
  startTime: string;
  endTime: string;
  semester: string;
  maxStudents?: number;
  isGroupSchedule?: boolean;
  status?: string;
  createdBy?: string;
  type?: string;
}

// Mock data để test
const MOCK_SCHEDULES: Schedule[] = [
  {
    _id: '1',
    courseId: { _id: 'c1', courseName: 'Blockchain căn bản', courseCode: 'BC101' },
    lecturer: 'Võ Thanh Vinh',
    room: 'Phòng máy Mo 2',
    dayOfWeek: [3],
    startTime: '06:00',
    endTime: '10:00',
    semester: 'HK1 2026',
    type: 'practice',
    isGroupSchedule: true,
    studentIds: ['user1', 'user2']
  },
  {
    _id: '2',
    courseId: { _id: 'c2', courseName: 'Lập trình di động', courseCode: 'MOB201' },
    lecturer: 'Nguyễn Văn A',
    room: 'Phòng 301',
    dayOfWeek: [4],
    startTime: '13:00',
    endTime: '16:00',
    semester: 'HK1 2026',
    type: 'theory'
  }
];

const StudentSchedule = () => {
  const { token, user } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewType, setViewType] = useState<'day' | 'week' | 'month'>('day');
  const [filters, setFilters] = useState({
    hoc: true,
    thi: false,
    online: false,
    tamNgung: false,
    thiChinhThuc: false
  });

  const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const types: Record<string, { label: string; color: string }> = {
    theory: { label: 'Lý thuyết', color: '#1890ff' },
    practice: { label: 'Thực hành', color: '#52c41a' },
    exam: { label: 'Thi', color: '#faad14' }
  };

  const fetchSchedules = useCallback(async () => {
    if (!token || !user) {
      // Dùng mock data nếu chưa đăng nhập
      setSchedules(MOCK_SCHEDULES);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // SỬA: Thêm /student/ vào URL
      const response = await fetch(`${API_URL}/schedules/student/${user._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Kiểm tra response status
      if (response.status === 404) {
        console.log('API not found, using mock data');
        setSchedules(MOCK_SCHEDULES);
        setLoading(false);
        return;
      }

      const result = await response.json();

      if (result.success && result.data && result.data.length > 0) {
        setSchedules(result.data);
      } else {
        // Nếu không có dữ liệu, dùng mock
        console.log('No data from API, using mock data');
        setSchedules(MOCK_SCHEDULES);
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
      // Dùng mock data khi lỗi
      setSchedules(MOCK_SCHEDULES);
    }
    setLoading(false);
  }, [token, user]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSchedules().finally(() => setRefreshing(false));
  }, [fetchSchedules]);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const getFilteredSchedules = () => {
    const day = selectedDate.getDay();
    let filtered = schedules.filter(s => s.dayOfWeek.includes(day));
    
    // Áp dụng filters
    if (!filters.hoc) {
      filtered = filtered.filter(s => s.type !== 'theory');
    }
    if (!filters.thi) {
      filtered = filtered.filter(s => s.type !== 'exam');
    }
    
    // Sắp xếp theo giờ
    filtered.sort((a, b) => a.startTime.localeCompare(b.startTime));
    
    return filtered;
  };

  const formatDate = (date: Date) => {
    const d = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'][date.getDay()];
    return `${d}, ${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const toggleFilter = (key: keyof typeof filters) => {
    setFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const renderScheduleItem = ({ item }: { item: Schedule }) => {
    let type = 'theory';
    let typeLabel = 'Lý thuyết';
    let typeColor = '#1890ff';

    if (item.type) {
      const found = types[item.type];
      if (found) {
        typeLabel = found.label;
        typeColor = found.color;
      }
    }

    const startHour = parseInt(item.startTime.split(':')[0]);
    const endHour = parseInt(item.endTime.split(':')[0]);

    return (
      <TouchableOpacity style={styles.scheduleCard}>
        <View style={styles.timeColumn}>
          <Text style={styles.startTime}>{item.startTime}</Text>
          <View style={styles.timeLine} />
          <Text style={styles.endTime}>{item.endTime}</Text>
        </View>
        
        <View style={[styles.contentColumn, { borderLeftColor: typeColor }]}>
          <View style={styles.headerRow}>
            <Text style={styles.courseName}>
              {typeof item.courseId === 'object' ? item.courseId.courseName : 'Khóa học'}
            </Text>
            <View style={[styles.typeBadge, { backgroundColor: typeColor }]}>
              <Text style={styles.typeText}>{typeLabel}</Text>
            </View>
          </View>
          
          <Text style={styles.infoText}>
            Tiết: {startHour} - {endHour}
          </Text>
          {item.isGroupSchedule && (
            <Text style={styles.infoText}>
              Nhóm: {item.studentIds?.length || 0} sinh viên
            </Text>
          )}
          <Text style={styles.infoText}>Phòng: {item.room}</Text>
          <Text style={styles.infoText}>Giảng viên: {item.lecturer}</Text>
          {item.semester && (
            <Text style={styles.infoText}>Học kỳ: {item.semester}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderFilterItem = (label: string, key: keyof typeof filters) => (
    <TouchableOpacity 
      style={styles.filterChip} 
      onPress={() => toggleFilter(key)}
    >
      <View style={[styles.checkbox, filters[key] && styles.checkboxChecked]}>
        {filters[key] && <Ionicons name="checkmark" size={12} color="#fff" />}
      </View>
      <Text style={styles.filterChipText}>{label}</Text>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Lịch học</Text>
      <TouchableOpacity onPress={onRefresh}>
        <Ionicons name="refresh-outline" size={24} color="#333" />
      </TouchableOpacity>
    </View>
  );

  const renderDateNavigator = () => (
    <View style={styles.dateNavigator}>
      <TouchableOpacity onPress={() => changeDate(-1)} style={styles.navButton}>
        <Ionicons name="chevron-back" size={24} color="#333" />
      </TouchableOpacity>
      
      <View style={styles.dateDisplay}>
        <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
        <View style={styles.viewTypeContainer}>
          {['Ngày', 'Tuần', 'Tháng'].map((type, index) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.viewTypeButton,
                (viewType === ['day', 'week', 'month'][index]) && styles.viewTypeActive
              ]}
              onPress={() => setViewType(['day', 'week', 'month'][index] as any)}
            >
              <Text style={[
                styles.viewTypeText,
                (viewType === ['day', 'week', 'month'][index]) && styles.viewTypeTextActive
              ]}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      <TouchableOpacity onPress={() => changeDate(1)} style={styles.navButton}>
        <Ionicons name="chevron-forward" size={24} color="#333" />
      </TouchableOpacity>
    </View>
  );

  const renderFilters = () => (
    <View style={styles.filterContainer}>
      {renderFilterItem('Lịch học', 'hoc')}
      {renderFilterItem('Lịch thi', 'thi')}
      {renderFilterItem('Lịch trực tuyến', 'online')}
      {renderFilterItem('Tạm ngưng', 'tamNgung')}
      {renderFilterItem('Lịch thi chính thức', 'thiChinhThuc')}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1890ff" />
        <Text style={styles.loadingText}>Đang tải lịch học...</Text>
      </View>
    );
  }

  const filteredSchedules = getFilteredSchedules();

  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderDateNavigator()}
      
      <FlatList
        data={filteredSchedules}
        renderItem={renderScheduleItem}
        keyExtractor={item => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={renderFilters}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>Không có lịch học hôm nay</Text>
            <Text style={styles.emptySubText}>
              {selectedDate.getDay() === 0 || selectedDate.getDay() === 6 
                ? 'Hôm nay là cuối tuần, bạn không có lịch học' 
                : 'Hãy kiểm tra lại vào ngày khác'}
            </Text>
          </View>
        )}
        contentContainerStyle={filteredSchedules.length === 0 ? { flex: 1 } : undefined}
      />
    </View>
  );
};

export default StudentSchedule;