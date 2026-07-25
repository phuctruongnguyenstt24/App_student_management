// app/admin/mng_frameworkprogram.tsx
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Modal, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { styles } from '../../a_styles/style_mng_framework';
import { API_URL } from '../../config/api';

interface FilterRowItem {
  label: string;
  key: keyof FilterOptions;
  items?: any[];
  labelKey?: string;  // Thêm optional
  valueKey?: string;  // Thêm optional
}

interface Course { _id: string; courseCode: string; courseName: string; credits: number; }
interface Faculty { _id: string; name: string; code: string; }
interface Department { _id: string; name: string; code: string; facultyId: string; }
interface CurriculumFramework {
  _id: string; courseId: Course | string; courseCode: string; courseName: string;
  credits: number; programName: string; programCode: string; facultyId: Faculty | string;
  departmentId: Department | string; semester: string; academicYear: string;
  status: 'completed' | 'incomplete' | 'in_progress'; completedDate: string | null; notes: string;
  createdAt: string; updatedAt: string;
}
interface FilterOptions { programCode: string; code: string; facultyId: string; semester: string; course: string; status: string; }
 

const getId = (item: any): string => item?._id || '';
const getName = (item: any): string => item?.name || item?.code || '';
const getCode = (item: any): string => item?.code || '';

export default function CurriculumFrameworkScreen() {
  const [frameworks, setFrameworks] = useState<CurriculumFramework[]>([]);
  const [filtered, setFiltered] = useState<CurriculumFramework[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [filteredDepts, setFilteredDepts] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ total: 0, completed: 0, incomplete: 0, inProgress: 0, completionRate: 0 });
  const [filters, setFilters] = useState<FilterOptions>({ programCode: '', code: '', facultyId: '', semester: '', course: '', status: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<CurriculumFramework | null>(null);
  const [form, setForm] = useState({ courseId: '', programName: '', programCode: '', facultyId: '', departmentId: '', semester: '', academicYear: '', status: 'incomplete', notes: '' });

  const academicYears = Array.from({ length: 7 }, (_, i) => {
    const y = new Date().getFullYear() + i - 3;
    return `${y}-${y + 1}`;
  });
  const semesters = ['HK1', 'HK2', 'HK3'];
  const statuses = [
    { label: 'Chưa hoàn thành', value: 'incomplete' },
    { label: 'Đang thực hiện', value: 'in_progress' },
    { label: 'Hoàn thành', value: 'completed' }
  ];

  const fetchData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return router.replace('/login');
      const headers = { Authorization: `Bearer ${token}` };
      const [fr, cr, ff, dp, st] = await Promise.all([
        fetch(`${API_URL}/curriculum`, { headers }),
        fetch(`${API_URL}/courses`, { headers }),
        fetch(`${API_URL}/faculties`, { headers }),
        fetch(`${API_URL}/departments`, { headers }),
        fetch(`${API_URL}/curriculum/stats/summary`, { headers })
      ]);
      const [fd, cd, ffd, dpd, sd] = await Promise.all([fr.json(), cr.json(), ff.json(), dp.json(), st.json()]);
      if (fd.success) { setFrameworks(fd.data); setFiltered(fd.data); }
      if (cd.success) setCourses(cd.data);
      if (ffd.success) setFaculties(ffd.faculties || []);
      if (dpd.success) setDepartments(dpd.departments || []);
      if (sd.success) setStats(sd.data);
    } catch (e) { Alert.alert('Lỗi', 'Không thể tải dữ liệu'); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => {
    setFiltered(frameworks.filter(f => {
      const match = (val: string, filter: string) => !filter || val.toLowerCase().includes(filter.toLowerCase());
      const facultyCode = typeof f.facultyId === 'object' ? f.facultyId?.code : '';
      const deptId = typeof f.departmentId === 'object' ? f.departmentId?._id : f.departmentId;
      return match(f.programCode, filters.programCode) &&
        (!filters.code || facultyCode === filters.code) &&
        (!filters.facultyId || deptId === filters.facultyId) &&
        (!filters.semester || f.semester === filters.semester) &&
        (!filters.course || f.academicYear === filters.course) &&
        (!filters.status || f.status === filters.status);
    }));
  }, [frameworks, filters]);

  useEffect(() => {
    setFilteredDepts(form.facultyId ? departments.filter(d => d.facultyId === form.facultyId) : departments);
  }, [form.facultyId, departments]);

  const resetFilters = () => setFilters({ programCode: '', code: '', facultyId: '', semester: '', course: '', status: '' });
  const resetForm = () => { setForm({ courseId: '', programName: '', programCode: '', facultyId: '', departmentId: '', semester: '', academicYear: '', status: 'incomplete', notes: '' }); setEditing(null); };

  const handleSave = async () => {
    const { courseId, programName, programCode, facultyId, departmentId, semester, academicYear, status, notes } = form;
    if (!courseId || !programName.trim() || !programCode.trim() || !facultyId || !departmentId) {
      return Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
    }
    try {
      const token = await AsyncStorage.getItem('token');
      const course = courses.find(c => c._id === courseId);
      const data = { courseId, courseCode: course?.courseCode || '', courseName: course?.courseName || '', credits: course?.credits || 0, programName: programName.trim(), programCode: programCode.trim(), facultyId, departmentId, semester, academicYear, status, notes: notes.trim() };
      const url = editing ? `${API_URL}/curriculum/${editing._id}` : `${API_URL}/curriculum`;
      const res = await fetch(url, { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(data) });
      const result = await res.json();
      if (result.success) { Alert.alert('Thành công', editing ? 'Cập nhật thành công' : 'Thêm thành công'); setModalVisible(false); resetForm(); fetchData(); }
      else Alert.alert('Lỗi', result.message);
    } catch (e) { Alert.alert('Lỗi', 'Không thể kết nối server'); }
  };

  const handleDelete = (item: CurriculumFramework) => {
    Alert.alert('Xác nhận', `Xóa "${item.programName}"?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa', style: 'destructive', onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('token');
            const res = await fetch(`${API_URL}/curriculum/${item._id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
            const result = await res.json();
            if (result.success) { Alert.alert('Thành công', 'Xóa thành công'); fetchData(); }
          } catch (e) { Alert.alert('Lỗi', 'Không thể xóa'); }
        }
      }
    ]);
  };

  const getStatusConfig = (s: string) => ({
    completed: { label: '✅ Hoàn thành', color: '#16a34a' },
    in_progress: { label: '🔄 Đang thực hiện', color: '#f59e0b' },
    incomplete: { label: '⏳ Chưa hoàn thành', color: '#dc3545' }
  }[s] || { label: '⏳ Chưa hoàn thành', color: '#dc3545' });

  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#4A90E2" /><Text style={styles.loadingText}>Đang tải...</Text></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={28} color="#333" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Chương trình khung</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setShowFilters(!showFilters)}><Ionicons name="filter" size={24} color="#4A90E2" /></TouchableOpacity>
          <TouchableOpacity onPress={() => { resetForm(); setModalVisible(true); }}><Ionicons name="add-circle" size={28} color="#4A90E2" /></TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsContainer}>
        {['total', 'completed', 'inProgress', 'incomplete'].map((key, i, arr) => (
          <View key={key} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats[key as keyof typeof stats]}</Text>
              <Text style={styles.statLabel}>{i === 0 ? 'Tổng HP' : i === 1 ? 'Hoàn thành' : i === 2 ? 'Đang học' : 'Chưa hoàn'}</Text>
            </View>
            {i < arr.length - 1 && <View style={styles.statDivider} />}
          </View>
        ))}
        <View style={styles.statItem}><Text style={styles.statNumber}>{stats.completionRate}%</Text><Text style={styles.statLabel}>Tỷ lệ</Text></View>
      </View>

      {showFilters && (
  <View style={styles.filterContainer}>
    {[
      [
        { label: 'Mã CT', key: 'programCode' as const },
        { label: 'Khoa', key: 'code' as const, items: faculties, labelKey: 'code' as const }
      ],
      [
        { 
          label: 'Ngành', 
          key: 'facultyId' as const, 
          items: departments.filter(d => !filters.code || faculties.find(f => f.code === filters.code)?._id === d.facultyId) 
        },
        { label: 'Học kỳ', key: 'semester' as const, items: semesters }
      ],
      [
        { label: 'Năm học', key: 'course' as const, items: academicYears },
        { label: 'Trạng thái', key: 'status' as const, items: statuses, labelKey: 'label' as const, valueKey: 'value' as const }
      ]
    ].map((row, ri) => (
      <View key={ri} style={styles.filterRow}>
        {row.map((item: FilterRowItem) => {
          const { label, key, items } = item;
          const labelKey = item.labelKey || 'label';
          const valueKey = item.valueKey || 'value';
          
          return (
            <View key={key} style={styles.filterGroup}>
              <Text style={styles.filterLabel}>{label}</Text>
              <View style={styles.pickerWrapper}>
                <Picker 
                  selectedValue={filters[key]} 
                  onValueChange={v => setFilters(p => ({ ...p, [key]: v }))} 
                  style={styles.picker}
                >
                  <Picker.Item label="Tất cả" value="" />
                  {items?.map((item: any) => (
                    <Picker.Item 
                      key={item._id || item} 
                      label={item[labelKey] || item} 
                      value={item[valueKey] || item._id || item} 
                    />
                  ))}
                </Picker>
              </View>
            </View>
          );
        })}
      </View>
    ))}
    <View style={styles.filterActions}>
      <TouchableOpacity onPress={resetFilters}>
        <Text style={styles.clearFilterText}>Xóa bộ lọc</Text>
      </TouchableOpacity>
      <Text style={styles.filterResultText}>
        {filtered.length} / {frameworks.length} HP
      </Text>
    </View>
  </View>
)}

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchData} />}>
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>📚 Danh sách học phần</Text><Text style={styles.courseCount}>{filtered.length} HP</Text></View>
          {filtered.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="book-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>Không tìm thấy học phần</Text>
              <Text style={styles.emptySubText}>{frameworks.length > 0 ? 'Thử điều chỉnh bộ lọc' : 'Nhấn + để thêm'}</Text>
            </View>
          ) : filtered.map(item => {
            const cfg = getStatusConfig(item.status);
            return (
              <View key={item._id} style={styles.frameworkCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <Text style={styles.programCode}>{item.programCode}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: cfg.color + '20' }]}><Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text></View>
                  </View>
                  <View style={styles.cardActions}>
                    <TouchableOpacity onPress={() => {
                      setEditing(item);
                      setForm({
                        courseId: getId(item.courseId), programName: item.programName, programCode: item.programCode,
                        facultyId: getId(item.facultyId), departmentId: getId(item.departmentId),
                        semester: item.semester, academicYear: item.academicYear, status: item.status, notes: item.notes || ''
                      });
                      setModalVisible(true);
                    }}><Ionicons name="pencil-outline" size={20} color="#4A90E2" /></TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item)}><Ionicons name="trash-outline" size={20} color="#dc3545" /></TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.programName}>{item.programName}</Text>
                <View style={styles.courseInfo}>
                  <View style={styles.infoItem}><Ionicons name="book-outline" size={14} color="#666" /><Text style={styles.infoText}>{typeof item.courseId === 'object' ? item.courseId?.courseCode : item.courseCode}</Text></View>
                  <View style={styles.infoItem}><Ionicons name="star-outline" size={14} color="#666" /><Text style={styles.infoText}>{typeof item.courseId === 'object' ? item.courseId?.credits : item.credits} TC</Text></View>
                  <View style={styles.infoItem}><Ionicons name="business-outline" size={14} color="#666" /><Text style={styles.infoText}>{getCode(item.facultyId)}</Text></View>
                  <View style={styles.infoItem}><Ionicons name="calendar-outline" size={14} color="#666" /><Text style={styles.infoText}>{item.semester}</Text></View>
                </View>
                <View style={styles.courseInfo}>
                  <View style={styles.infoItem}><Ionicons name="time-outline" size={14} color="#666" /><Text style={styles.infoText}>{item.academicYear}</Text></View>
                  <View style={styles.infoItem}><Ionicons name="folder-outline" size={14} color="#666" /><Text style={styles.infoText}>{getCode(item.departmentId)}</Text></View>
                  {item.completedDate && <View style={styles.infoItem}><Ionicons name="checkmark-circle-outline" size={14} color="#16a34a" /><Text style={[styles.infoText, { color: '#16a34a' }]}>{new Date(item.completedDate).toLocaleDateString('vi-VN')}</Text></View>}
                </View>
                {item.notes && <Text style={styles.notesText} numberOfLines={2}>📝 {item.notes}</Text>}
                <View style={styles.cardFooter}>
                  <TouchableOpacity style={[styles.statusButton, item.status === 'completed' && styles.statusButtonCompleted]} onPress={() => {
                    const ns = item.status === 'completed' ? 'incomplete' : 'completed';
                    (async () => {
                      try {
                        const token = await AsyncStorage.getItem('token');
                        const res = await fetch(`${API_URL}/curriculum/${item._id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ status: ns }) });
                        const result = await res.json();
                        if (result.success) { Alert.alert('Thành công', 'Cập nhật trạng thái thành công'); fetchData(); }
                      } catch (e) { Alert.alert('Lỗi', 'Không thể cập nhật'); }
                    })();
                  }}>
                    <Ionicons name={item.status === 'completed' ? 'checkmark-circle' : 'ellipse-outline'} size={16} color={item.status === 'completed' ? '#16a34a' : '#666'} />
                    <Text style={[styles.statusButtonText, item.status === 'completed' && styles.statusButtonTextCompleted]}>{item.status === 'completed' ? 'Đã hoàn thành' : 'Đánh dấu hoàn thành'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editing ? 'Sửa học phần' : 'Thêm học phần'}</Text>
              <TouchableOpacity onPress={() => { setModalVisible(false); resetForm(); }}><Ionicons name="close" size={24} color="#333" /></TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Môn học *</Text>
                <View style={styles.pickerWrapper}>
                  <Picker selectedValue={form.courseId} onValueChange={v => setForm(p => ({ ...p, courseId: v }))} style={styles.picker}>
                    <Picker.Item label="Chọn môn học" value="" />
                    {courses.map(c => <Picker.Item key={c._id} label={`${c.courseCode} - ${c.courseName} (${c.credits} TC)`} value={c._id} />)}
                  </Picker>
                </View>
              </View>
              <TextInput style={styles.input} placeholder="Tên học phần *" value={form.programName} onChangeText={v => setForm(p => ({ ...p, programName: v }))} />
              <TextInput style={styles.input} placeholder="Mã học phần *" value={form.programCode} onChangeText={v => setForm(p => ({ ...p, programCode: v }))} />
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Khoa *</Text>
                <View style={styles.pickerWrapper}>
                  <Picker selectedValue={form.facultyId} onValueChange={v => { setForm(p => ({ ...p, facultyId: v, departmentId: '' })); }} style={styles.picker}>
                    <Picker.Item label="Chọn khoa" value="" />
                    {faculties.map(f => <Picker.Item key={f._id} label={`${f.code} - ${f.name}`} value={f._id} />)}
                  </Picker>
                </View>
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Ngành *</Text>
                <View style={styles.pickerWrapper}>
                  <Picker selectedValue={form.departmentId} onValueChange={v => setForm(p => ({ ...p, departmentId: v }))} style={styles.picker}>
                    <Picker.Item label="Chọn ngành" value="" />
                    {filteredDepts.map(d => <Picker.Item key={d._id} label={`${d.code} - ${d.name}`} value={d._id} />)}
                  </Picker>
                </View>
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Học kỳ *</Text>
                <View style={styles.pickerWrapper}>
                  <Picker selectedValue={form.semester} onValueChange={v => setForm(p => ({ ...p, semester: v }))} style={styles.picker}>
                    <Picker.Item label="Chọn học kỳ" value="" />
                    {semesters.map(s => <Picker.Item key={s} label={s} value={s} />)}
                  </Picker>
                </View>
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Năm học *</Text>
                <View style={styles.pickerWrapper}>
                  <Picker selectedValue={form.academicYear} onValueChange={v => setForm(p => ({ ...p, academicYear: v }))} style={styles.picker}>
                    <Picker.Item label="Chọn năm học" value="" />
                    {academicYears.map(y => <Picker.Item key={y} label={y} value={y} />)}
                  </Picker>
                </View>
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Trạng thái</Text>
                <View style={styles.pickerWrapper}>
                  <Picker selectedValue={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))} style={styles.picker}>
                    {statuses.map(s => <Picker.Item key={s.value} label={s.label} value={s.value} />)}
                  </Picker>
                </View>
              </View>
              <TextInput style={[styles.input, styles.textArea]} placeholder="Ghi chú" value={form.notes} onChangeText={v => setForm(p => ({ ...p, notes: v }))} multiline numberOfLines={3} />
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => { setModalVisible(false); resetForm(); }}><Text style={styles.cancelButtonText}>Hủy</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleSave}><Text style={styles.saveButtonText}>{editing ? 'Cập nhật' : 'Thêm'}</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}