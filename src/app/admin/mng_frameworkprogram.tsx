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

interface FilterOptions {
  programCode: string;
  facultyId: string;
  departmentId: string;
  semester: string;
  academicYear: string;
  status: string;
}

interface FilterRowItem {
  label: string;
  key: keyof FilterOptions;
  items?: any[];
  labelKey?: string;
  valueKey?: string;
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

const getId = (item: any): string => item?._id || '';
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
  const [showFilters, setShowFilters] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<CurriculumFramework | null>(null);

  // State của form Thêm/Sửa
  const [form, setForm] = useState({
    courseId: '', programName: '', programCode: '', facultyId: '',
    departmentId: '', semester: '', academicYear: '', status: 'incomplete', notes: ''
  });

  // ĐÃ SỬA LỖI BIẾN: Bộ lọc chuẩn xác
  const [filters, setFilters] = useState<FilterOptions>({
    programCode: '', facultyId: '', departmentId: '', semester: '', academicYear: '', status: ''
  });

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

  const statColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

  // ================= FETCH DATA =================
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
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể tải dữ liệu. Hãy kiểm tra kết nối.');
    } finally {
      setLoading(false); setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ================= LOGIC LỌC (FILTER) =================
  useEffect(() => {
    setFiltered(frameworks.filter(f => {
      const match = (val: string, filter: string) => !filter || (val && val.toLowerCase().includes(filter.toLowerCase()));
      const fFacId = typeof f.facultyId === 'object' ? f.facultyId?._id : f.facultyId;
      const fDeptId = typeof f.departmentId === 'object' ? f.departmentId?._id : f.departmentId;

      return match(f.programCode, filters.programCode) &&
        (!filters.facultyId || fFacId === filters.facultyId) &&
        (!filters.departmentId || fDeptId === filters.departmentId) &&
        (!filters.semester || String(f.semester) === String(filters.semester)) &&
        (!filters.academicYear || f.academicYear === filters.academicYear) &&
        (!filters.status || f.status === filters.status);
    }));
  }, [frameworks, filters]);

  // Cập nhật Ngành trong Form khi chọn Khoa
  useEffect(() => {
    setFilteredDepts(form.facultyId ? departments.filter(d => d.facultyId === form.facultyId) : departments);
  }, [form.facultyId, departments]);

  const resetFilters = () => setFilters({ programCode: '', facultyId: '', departmentId: '', semester: '', academicYear: '', status: '' });

  const resetForm = () => {
    setForm({ courseId: '', programName: '', programCode: '', facultyId: '', departmentId: '', semester: '', academicYear: '', status: 'incomplete', notes: '' });
    setEditing(null);
  };

  // ================= THÊM / SỬA (SAVE) =================
  const handleSave = async () => {
    const { courseId, programName, programCode, facultyId, departmentId, semester, academicYear, status, notes } = form;
    if (!courseId || !programName.trim() || !programCode.trim() || !facultyId || !departmentId || !semester || !academicYear) {
      return Alert.alert('Lỗi', 'Vui lòng điền đầy đủ các thông tin có dấu *');
    }
    try {
      const token = await AsyncStorage.getItem('token');
      const course = courses.find(c => c._id === courseId);
      const data = {
        courseId, courseCode: course?.courseCode || '', courseName: course?.courseName || '',
        credits: course?.credits || 0, programName: programName.trim(), programCode: programCode.trim(),
        facultyId, departmentId, semester, academicYear, status, notes: notes.trim()
      };

      const url = editing ? `${API_URL}/curriculum/${editing._id}` : `${API_URL}/curriculum`;
      const res = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data)
      });
      const result = await res.json();

      if (result.success) {
        Alert.alert('Thành công', editing ? 'Cập nhật thành công' : 'Thêm thành công');
        setModalVisible(false);
        resetForm();
        fetchData();
      } else {
        Alert.alert('Lỗi', result.message);
      }
    } catch (e) { Alert.alert('Lỗi', 'Không thể kết nối đến server'); }
  };

  // ================= XÓA (DELETE) =================
  const handleDelete = (item: CurriculumFramework) => {
    Alert.alert('Xác nhận', `Xóa chương trình "${item.programName}"?`, [
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
    completed: { label: '✅ Hoàn thành', color: '#10B981' },
    in_progress: { label: '🔄 Đang thực hiện', color: '#F59E0B' },
    incomplete: { label: '⏳ Chưa hoàn thành', color: '#EF4444' }
  }[s] || { label: '⏳ Chưa hoàn thành', color: '#EF4444' });

  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#3B82F6" /><Text style={styles.loadingText}>Đang tải dữ liệu...</Text></View>;
  const groupedFrameworks = filtered.reduce((acc, item) => {
    const sem = item.semester || 'Chưa xếp loại';
    if (!acc[sem]) acc[sem] = [];
    acc[sem].push(item);
    return acc;
  }, {} as Record<string, typeof filtered>);
  const sortedSemesters = Object.keys(groupedFrameworks).sort((a, b) => a.localeCompare(b));
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/admin/dashboard')}>
          <Ionicons name="arrow-back" size={28} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chương trình khung</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setShowFilters(!showFilters)}>
            <Ionicons name="filter" size={24} color={showFilters ? "#8B5CF6" : "#3B82F6"} />
          </TouchableOpacity>
          {/* NÚT THÊM ĐÃ QUAY TRỞ LẠI */}
          <TouchableOpacity onPress={() => { resetForm(); setModalVisible(true); }}>
            <Ionicons name="add-circle" size={28} color="#10B981" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsContainer}>
        {['total', 'completed', 'inProgress', 'incomplete'].map((key, i, arr) => (
          <View key={key} style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: statColors[i] }]}>{stats[key as keyof typeof stats]}</Text>
              <Text style={styles.statLabel}>{i === 0 ? 'Tổng HP' : i === 1 ? 'Hoàn thành' : i === 2 ? 'Đang học' : 'Chưa hoàn'}</Text>
            </View>
            {i < arr.length - 1 ? <View style={styles.statDivider} /> : null}
          </View>
        ))}
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#8B5CF6' }]}>{stats.completionRate}%</Text>
          <Text style={styles.statLabel}>Tỷ lệ</Text>
        </View>
      </View>

      {showFilters ? (
        <View style={styles.filterContainer}>
          {[
            [
              {
                label: 'Mã CT',
                key: 'programCode' as const,
                items: frameworks,
                labelKey: 'programCode' as const,
                valueKey: 'programCode' as const
              },
              { label: 'Khoa', key: 'facultyId' as const, items: faculties, labelKey: 'name' as const, valueKey: '_id' as const }
            ],
            [
              {
                label: 'Ngành', key: 'departmentId' as const,
                items: departments.filter(d => !filters.facultyId || d.facultyId === filters.facultyId),
                labelKey: 'name' as const, valueKey: '_id' as const
              },
              { label: 'Học kỳ', key: 'semester' as const, items: semesters }
            ],
            [
              { label: 'Năm học', key: 'academicYear' as const, items: academicYears },
              { label: 'Trạng thái', key: 'status' as const, items: statuses, labelKey: 'label' as const, valueKey: 'value' as const }
            ]
          ].map((row, ri) => (
            <View key={`row-${ri}`} style={styles.filterRow}>
              {row.map((item: FilterRowItem) => {
                const { label, key, items } = item;
                const labelKey = item.labelKey || 'label';
                const valueKey = item.valueKey || 'value';

                return (
                  <View key={`group-${key}`} style={styles.filterGroup}>
                    <Text style={styles.filterLabel}>{label}</Text>
                    <View style={styles.pickerWrapper}>
                      <Picker
                        selectedValue={filters[key]}
                        onValueChange={v => {
                          if (key === 'facultyId') setFilters(p => ({ ...p, facultyId: v, departmentId: '' }));
                          else setFilters(p => ({ ...p, [key]: v }));
                        }}
                        style={styles.picker}
                      >
                        <Picker.Item label="Tất cả" value="" />
                        {items?.map((opt: any, index: number) => {
                          const optLabel = typeof opt === 'object' ? (opt[labelKey] || opt.name || opt.code || 'N/A') : String(opt);
                          const optValue = typeof opt === 'object' ? (opt[valueKey] || opt._id) : opt;
                          const optKey = typeof opt === 'object' ? (opt._id || opt.value || opt.code || `item-${index}`) : String(opt);
                          return <Picker.Item key={optKey} label={optLabel} value={optValue} />;
                        })}
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
            <Text style={styles.filterResultText}>{filtered.length} / {frameworks.length} HP</Text>
          </View>
        </View>
      ) : null}

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchData} />}>
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📚 Danh sách học phần</Text>
            <Text style={styles.courseCount}>{filtered.length} HP</Text>
          </View>

          {filtered.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="folder-open-outline" size={72} color="#CBD5E1" />
              <Text style={styles.emptyText}>Không tìm thấy học phần</Text>
              <Text style={styles.emptySubText}>Thử thay đổi lại bộ lọc hoặc bấm + để thêm</Text>
            </View>
          ) : (
            // DUYỆT QUA TỪNG HỌC KỲ
            sortedSemesters.map(semester => (
              <View key={`sem-${semester}`}>

                {/* HEADER HỌC KỲ */}
                <View style={styles.semesterGroupHeader}>
                  <Ionicons name="school" size={20} color="#8B5CF6" />
                  <Text style={styles.semesterGroupTitle}>
                    {semester.includes('HK') ? `Học kỳ ${semester.replace('HK', '')}` : semester}
                  </Text>
                  <View style={styles.semesterBadge}>
                    <Text style={styles.semesterBadgeText}>{groupedFrameworks[semester].length} HP</Text>
                  </View>
                </View>

                {/* DANH SÁCH MÔN TRONG HỌC KỲ ĐÓ */}
                {groupedFrameworks[semester].map(item => {
                  const cfg = getStatusConfig(item.status);
                  return (
                    <View key={item._id} style={[styles.frameworkCard, { borderLeftColor: cfg.color }]}>
                      <View style={styles.cardHeader}>
                        <View style={styles.cardHeaderLeft}>
                          <Text style={styles.programCode}>{item.programCode}</Text>
                          <View style={[styles.statusBadge, { backgroundColor: cfg.color + '15' }]}>
                            <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                          </View>
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
                          }}>
                            <Ionicons name="pencil-outline" size={20} color="#3B82F6" />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => handleDelete(item)}>
                            <Ionicons name="trash-outline" size={20} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      </View>

                      <Text style={styles.programName}>{item.programName}</Text>

                      <View style={styles.courseInfo}>
                        <View style={styles.infoItem}><Ionicons name="book-outline" size={16} color="#3B82F6" /><Text style={styles.infoText}>{typeof item.courseId === 'object' ? item.courseId?.courseCode : item.courseCode}</Text></View>
                        <View style={styles.infoItem}><Ionicons name="star-outline" size={16} color="#F59E0B" /><Text style={styles.infoText}>{typeof item.courseId === 'object' ? item.courseId?.credits : item.credits} TC</Text></View>
                        <View style={styles.infoItem}><Ionicons name="business-outline" size={16} color="#8B5CF6" /><Text style={styles.infoText}>{getCode(item.facultyId)}</Text></View>
                      </View>

                      <View style={styles.courseInfo}>
                        <View style={styles.infoItem}><Ionicons name="time-outline" size={16} color="#EC4899" /><Text style={styles.infoText}>{item.academicYear}</Text></View>
                        <View style={styles.infoItem}><Ionicons name="folder-open-outline" size={16} color="#F97316" /><Text style={styles.infoText}>{getCode(item.departmentId)}</Text></View>
                        {item.completedDate ? (
                          <View style={styles.infoItem}>
                            <Ionicons name="checkmark-done-circle" size={16} color="#10B981" />
                            <Text style={[styles.infoText, { color: '#10B981', fontWeight: '600' }]}>{new Date(item.completedDate).toLocaleDateString('vi-VN')}</Text>
                          </View>
                        ) : null}
                      </View>

                      {item.notes ? (
                        <Text style={styles.notesText} numberOfLines={2}>💡 {item.notes}</Text>
                      ) : null}

                      <View style={styles.cardFooter}>
                        <TouchableOpacity style={[styles.statusButton, item.status === 'completed' ? styles.statusButtonCompleted : undefined]} onPress={() => {
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
                          <Ionicons name={item.status === 'completed' ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={item.status === 'completed' ? '#10B981' : '#94A3B8'} />
                          <Text style={[styles.statusButtonText, item.status === 'completed' ? styles.statusButtonTextCompleted : undefined]}>
                            {item.status === 'completed' ? 'Đã hoàn thành' : 'Đánh dấu hoàn thành'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* ================= MODAL THÊM / SỬA MỚI TOANH ================= */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => { setModalVisible(false); resetForm(); }}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editing ? 'Sửa học phần' : 'Thêm học phần mới'}</Text>
            <Text style={styles.modalSubtitle}>Điền đầy đủ các thông tin bên dưới</Text>

            <ScrollView style={{ width: '100%' }} showsVerticalScrollIndicator={false}>

              <TextInput style={styles.modalInput} placeholder="Tên chương trình khung *" value={form.programName} onChangeText={v => setForm(p => ({ ...p, programName: v }))} />
              <TextInput style={styles.modalInput} placeholder="Mã chương trình khung *" value={form.programCode} onChangeText={v => setForm(p => ({ ...p, programCode: v }))} />

              {/* Môn Học */}
              <View style={styles.pickerWrapper}>
                <Picker selectedValue={form.courseId} onValueChange={v => setForm(p => ({ ...p, courseId: v }))} style={styles.picker}>
                  <Picker.Item label="Chọn môn học *" value="" color="#94A3B8" />
                  {courses.map(c => <Picker.Item key={c._id} label={`${c.courseCode} - ${c.courseName} (${c.credits} TC)`} value={c._id} />)}
                </Picker>
              </View>

              {/* Dòng đôi: Khoa & Ngành */}
              <View style={styles.modalRow}>
                <View style={[styles.pickerWrapper, styles.modalInputHalf]}>
                  <Picker selectedValue={form.facultyId} onValueChange={v => { setForm(p => ({ ...p, facultyId: v, departmentId: '' })); }} style={styles.picker}>
                    <Picker.Item label="Chọn Khoa *" value="" color="#94A3B8" />
                    {faculties.map(f => <Picker.Item key={f._id} label={f.name} value={f._id} />)}
                  </Picker>
                </View>
                <View style={[styles.pickerWrapper, styles.modalInputHalf]}>
                  <Picker selectedValue={form.departmentId} onValueChange={v => setForm(p => ({ ...p, departmentId: v }))} style={styles.picker}>
                    <Picker.Item label="Chọn Ngành *" value="" color="#94A3B8" />
                    {filteredDepts.map(d => <Picker.Item key={d._id} label={d.name} value={d._id} />)}
                  </Picker>
                </View>
              </View>

              {/* Dòng đôi: Học kỳ & Năm học */}
              <View style={styles.modalRow}>
                <View style={[styles.pickerWrapper, styles.modalInputHalf]}>
                  <Picker selectedValue={form.semester} onValueChange={v => setForm(p => ({ ...p, semester: v }))} style={styles.picker}>
                    <Picker.Item label="Học kỳ *" value="" color="#94A3B8" />
                    {semesters.map(s => <Picker.Item key={s} label={s} value={s} />)}
                  </Picker>
                </View>
                <View style={[styles.pickerWrapper, styles.modalInputHalf]}>
                  <Picker selectedValue={form.academicYear} onValueChange={v => setForm(p => ({ ...p, academicYear: v }))} style={styles.picker}>
                    <Picker.Item label="Năm học *" value="" color="#94A3B8" />
                    {academicYears.map(y => <Picker.Item key={y} label={y} value={y} />)}
                  </Picker>
                </View>
              </View>

              {/* Trạng thái */}
              <View style={styles.pickerWrapper}>
                <Picker selectedValue={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))} style={styles.picker}>
                  {statuses.map(s => <Picker.Item key={s.value} label={`Trạng thái: ${s.label}`} value={s.value} />)}
                </Picker>
              </View>

              <TextInput style={[styles.modalInput, styles.textArea]} placeholder="Ghi chú thêm..." value={form.notes} onChangeText={v => setForm(p => ({ ...p, notes: v }))} multiline numberOfLines={3} />

            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => { setModalVisible(false); resetForm(); }}>
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.confirmButton]} onPress={handleSave}>
                <Text style={styles.confirmButtonText}>{editing ? 'Cập nhật' : 'Thêm mới'}</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

    </View>
  );
}