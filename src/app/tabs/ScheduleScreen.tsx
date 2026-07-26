// app/screens/StudentSchedule.tsx
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Platform, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
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
  } | string;
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
  studentIds?: any[];
}

const StudentSchedule = () => {
  const { token, user } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date('2026-07-29')); // Mặc định hoặc ngày hiện tại
  const [viewType, setViewType] = useState<'day' | 'week' | 'month'>('day');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [filters, setFilters] = useState({
    hoc: true,
    thi: false,
    online: false,
    tamNgung: false,
    thiChinhThuc: false
  });

  const types: Record<string, { label: string; color: string }> = {
    theory: { label: 'Lý thuyết', color: '#1890ff' },
    practice: { label: 'Thực hành', color: '#52c41a' },
    exam: { label: 'Thi', color: '#faad14' }
  };

  // Chuyển Date Object thành chuỗi YYYY-MM-DD theo giờ địa phương
  const formatDateToYYYYMMDD = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Tách chuỗi YYYY-MM-DD ra Date Object không bị lệch múi giờ
  const parseLocalDate = (dateStr: string): Date => {
    if (!dateStr) return new Date();
    const cleanDateStr = dateStr.substring(0, 10);
    const parts = cleanDateStr.split('-');
    if (parts.length === 3) {
      return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    }
    return new Date(dateStr);
  };

  const fetchSchedules = useCallback(async () => {
    if (!token || !user) return;
    setLoading(true);
    try {
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      };
      
      const userId = user._id || user.id || user.studentId;

      if (!userId) {
        console.error("Không tìm thấy ID trong thông tin người dùng:", user);
        setLoading(false);
        return;
      }

      const t = new Date().getTime();
      const response = await fetch(`${API_URL}/schedules/student/${userId}?t=${t}`, { headers });
      const result = await response.json();

      if (result.success && result.data) {
        setSchedules(result.data);
      } else {
        setSchedules([]);
      }
    } catch (error) {
      console.error("Lỗi API fetchSchedules:", error);
      setSchedules([]);
    }
    setLoading(false);
  }, [token, user]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSchedules().finally(() => setRefreshing(false));
  }, [fetchSchedules]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

const getFilteredSchedules = () => {
    const selectedDateStr = formatDateToYYYYMMDD(selectedDate);

    // Lấy tất cả các dạng ID có thể có của sinh viên
    const possibleUserIds = [
      user?.studentId,
      user?._id,
      user?.id
    ].filter(Boolean).map(id => String(id));

    // Tính khoảng thời gian theo Tuần
    const targetDate = new Date(selectedDate);
    targetDate.setHours(0, 0, 0, 0);
    const dayOfWeek = targetDate.getDay();
    const diffToMonday = targetDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const startOfWeek = new Date(targetDate);
    startOfWeek.setDate(diffToMonday);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    let filtered = schedules.filter(s => {
      // Cắt chuỗi lấy 10 ký tự YYYY-MM-DD chuẩn
      const scheduleDateStr = s.specificDate ? s.specificDate.substring(0, 10) : '';

      // 1. Kiểm tra ngày/tuần/tháng
      if (viewType === 'day') {
        if (scheduleDateStr !== selectedDateStr) return false;
      } else {
        const scheduleDate = parseLocalDate(scheduleDateStr);
        scheduleDate.setHours(0, 0, 0, 0);

        if (viewType === 'week') {
          if (scheduleDate < startOfWeek || scheduleDate > endOfWeek) return false;
        } else if (viewType === 'month') {
          if (scheduleDate.getMonth() !== targetDate.getMonth() || 
              scheduleDate.getFullYear() !== targetDate.getFullYear()) return false;
        }
      }

      // 2. Kiểm tra điều kiện nhóm thực hành (MỀM DẺO HƠN)
      if (s.type === 'practice' && s.targetGroup !== 'all') {
        
        // 💡 CẬP NHẬT: Chỉ kiểm tra thêm nếu Backend thực sự gửi kèm danh sách studentIds. 
        // Nếu Backend không gửi (để tối ưu), ta mặc định tin tưởng Backend và cho hiển thị.
        if (Array.isArray(s.studentIds) && s.studentIds.length > 0) {
          const isStudentInList = s.studentIds.some(st => {
            const idToCheck = typeof st === 'object' && st !== null ? String(st.studentId || st._id || st.id) : String(st);
            return possibleUserIds.includes(idToCheck);
          });

          if (!isStudentInList) {
              return false;
          }
        }
      }

      return true;
    });

    // 3. Lọc theo nút Filter giao diện (Lịch học / Lịch thi)
    if (!filters.hoc) filtered = filtered.filter(s => s.type !== 'theory' && s.type !== 'practice');
    if (!filters.thi) filtered = filtered.filter(s => s.type !== 'exam');

    // 4. Sắp xếp danh sách lịch học theo thời gian
    filtered.sort((a, b) => {
      const dateDiff = parseLocalDate(a.specificDate).getTime() - parseLocalDate(b.specificDate).getTime();
      if (dateDiff === 0) {
        return a.startTime.localeCompare(b.startTime);
      }
      return dateDiff;
    });

    return filtered;
  };

  const formatDate = (date: Date) => {
    const d = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'][date.getDay()];
    return `${d}, ${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  };

  const formatFullDateString = (dateString: string) => {
    const d = parseLocalDate(dateString);
    const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    return `${days[d.getDay()]}, ${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const onDateChange = (event: any, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      setSelectedDate(date);
      setViewType('day');
    }
  };

  const toggleFilter = (key: keyof typeof filters) => {
    setFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const renderScheduleItem = ({ item }: { item: Schedule }) => {
    let typeLabel = 'Lý thuyết';
    let typeColor = '#1890ff';

    if (item.type) {
      const found = types[item.type];
      if (found) {
        typeLabel = found.label;
        typeColor = found.color;
      }
    }

    // Lấy tên môn học linh hoạt dù Backend gửi dạng Object hay String ID
    const courseTitle = typeof item.courseId === 'object' && item.courseId !== null
      ? item.courseId.courseName
      : 'Lịch thực hành';

    return (
      <TouchableOpacity style={styles.scheduleCard} key={item._id}>
        <View style={styles.timeColumn}>
          <Text style={styles.startTime}>{item.startTime}</Text>
          <View style={styles.timeLine} />
          <Text style={styles.endTime}>{item.endTime}</Text>
        </View>
        
        <View style={[styles.contentColumn, { borderLeftColor: typeColor }]}>
          <View style={styles.headerRow}>
            <Text style={styles.courseName}>{courseTitle}</Text>
            <View style={[styles.typeBadge, { backgroundColor: typeColor }]}>
              <Text style={styles.typeText}>{typeLabel}</Text>
            </View>
          </View>
          
          {viewType !== 'day' && (
            <Text style={[styles.infoText, { color: '#d9534f', fontWeight: 'bold' }]}>
              <Ionicons name="calendar-outline" size={12} color="#d9534f" /> {formatFullDateString(item.specificDate)}
            </Text>
          )}
          
          <Text style={styles.infoText}>
            Phòng: {item.room} | Buổi {item.session === 'morning' ? 'Sáng' : item.session === 'afternoon' ? 'Chiều' : 'Tối'}
          </Text>
          <Text style={styles.infoText}>Giảng viên: {item.lecturer}</Text>
          
          {item.type === 'practice' && (
             <Text style={[styles.infoText, { color: '#f39c12' }]}>
               Nhóm: {item.targetGroup === 'all' ? 'Cả lớp' : item.targetGroup === 'group1' ? '1' : '2'}
             </Text>
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
      <TouchableOpacity onPress={() => changeDate(viewType === 'day' ? -1 : viewType === 'week' ? -7 : -30)} style={styles.navButton}>
        <Ionicons name="chevron-back" size={24} color="#333" />
      </TouchableOpacity>
      
      <View style={styles.dateDisplay}>
        <TouchableOpacity onPress={() => setShowDatePicker(true)}>
            <Text style={[styles.dateText, { textDecorationLine: 'underline' }]}>
            {viewType === 'month' ? `Tháng ${(selectedDate.getMonth() + 1)}/${selectedDate.getFullYear()}` : formatDate(selectedDate)}
            </Text>
        </TouchableOpacity>

        <View style={styles.viewTypeContainer}>
          {['Ngày', 'Tuần', 'Tháng'].map((type, index) => {
            const mappedType = ['day', 'week', 'month'][index];
            return (
              <TouchableOpacity
                key={type}
                style={[
                  styles.viewTypeButton,
                  (viewType === mappedType) && styles.viewTypeActive
                ]}
                onPress={() => setViewType(mappedType as any)}
              >
                <Text style={[
                  styles.viewTypeText,
                  (viewType === mappedType) && styles.viewTypeTextActive
                ]}>
                  {type}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>
      
      <TouchableOpacity onPress={() => changeDate(viewType === 'day' ? 1 : viewType === 'week' ? 7 : 30)} style={styles.navButton}>
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

  const renderDaySections = (filteredData: Schedule[]) => {
    const morning = filteredData.filter(s => s.session === 'morning');
    const afternoon = filteredData.filter(s => s.session === 'afternoon');
    const evening = filteredData.filter(s => s.session === 'evening');

    const EmptySession = () => (
        <Text style={styles.emptySessionText}>Không có lịch học</Text>
    );

    return (
      <ScrollView 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <View style={styles.sessionSection}>
            <Text style={styles.sessionTitle}>Sáng</Text>
            {morning.length > 0 ? morning.map(item => renderScheduleItem({ item })) : <EmptySession />}
        </View>
        <View style={styles.sessionSection}>
            <Text style={styles.sessionTitle}>Chiều</Text>
            {afternoon.length > 0 ? afternoon.map(item => renderScheduleItem({ item })) : <EmptySession />}
        </View>
        <View style={styles.sessionSection}>
            <Text style={styles.sessionTitle}>Tối</Text>
            {evening.length > 0 ? evening.map(item => renderScheduleItem({ item })) : <EmptySession />}
        </View>
      </ScrollView>
    );
  };

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
      {renderFilters()}
      
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}

      {viewType === 'day' ? (
         renderDaySections(filteredSchedules)
      ) : (
        <FlatList
            data={filteredSchedules}
            renderItem={renderScheduleItem}
            keyExtractor={item => item._id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
                <Ionicons name="calendar-outline" size={60} color="#ccc" />
                <Text style={styles.emptyText}>Không có lịch học</Text>
                <Text style={styles.emptySubText}>
                Hãy kiểm tra lại vào thời gian khác
                </Text>
            </View>
            )}
            contentContainerStyle={filteredSchedules.length === 0 ? { flex: 1 } : { paddingBottom: 20 }}
        />
      )}
    </View>
  );
};

export default StudentSchedule;