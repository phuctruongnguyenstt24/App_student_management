import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL } from '../../config/api';

// ============================================================================
// GHI CHÚ TÍCH HỢP API
// ----------------------------------------------------------------------------
// Đã khớp với gradeRoutes.js / gradeController.js thật của backend:
//   GET /grades/student/me?semester=...   -> gradeController.getMyGrades
//       trả về mảng grade, MỖI item đã có sẵn totalScore, grade (điểm chữ
//       A/B/C/D/F) và status ('completed' | 'in-progress') do server tính.
//   GET /grades/student/gpa?semester=...  -> gradeController.getMyGPA
//       trả về { gpa, totalCredits, courses } do server tính sẵn
//       (chỉ tính các môn có totalScore > 0).
// `semester` là optional ở cả 2 API -> không truyền = lấy tất cả học kỳ.
//
// Công thức điểm tổng (đã khớp gradeController.js): GK*40% + CK*60%.
// Điểm chữ: A(>=8.5) B(>=7.0) C(>=5.5) D(>=4.0) F(<4.0).
//
// PHẦN CHƯA XÁC NHẬN: endpoint lấy hồ sơ (họ tên/MSSV/lớp) của sinh viên
// đang đăng nhập. fetchMyProfile() bên dưới thử GET /students/me, nếu
// không có thì đọc AsyncStorage key 'user'. Gửi controller liên quan
// (VD: userController.js / studentController.js) nếu muốn mình chỉnh
// lại chính xác.
// ============================================================================

interface Course {
  _id: string;
  courseCode: string;
  courseName: string;
  credits: number;
}

interface Grade {
  _id: string;
  course: Course | { courseCode?: string; courseName?: string; credits?: number };
  semester: string; // VD: "HK1-2024-2025"
  midtermScore?: number | null;
  finalScore?: number | null;
  totalScore?: number; // do server tính: GK*40% + CK*60%
  grade?: string; // điểm chữ A/B/C/D/F do server tính
  status?: 'completed' | 'in-progress';
}

interface GpaData {
  gpa: number;
  totalCredits: number;
  courses: number;
}

interface StudentProfile {
  _id: string;
  fullName: string;
  studentId: string;
  class: string;
}

// Nhãn xếp loại theo điểm chữ trả về từ server (A/B/C/D/F)
const GRADE_LETTER_LABEL: Record<string, { label: string; color: string }> = {
  A: { label: 'Giỏi', color: '#16A34A' },
  B: { label: 'Khá', color: '#2563EB' },
  C: { label: 'Trung bình', color: '#0891B2' },
  D: { label: 'Yếu', color: '#D97706' },
  F: { label: 'Kém', color: '#DC2626' },
};

function classifyByLetter(letter?: string): { label: string; color: string } {
  if (!letter || !GRADE_LETTER_LABEL[letter]) {
    return { label: 'Chưa có điểm', color: '#9CA3AF' };
  }
  return GRADE_LETTER_LABEL[letter];
}

// Xếp loại chung cho điểm trung bình tích lũy (GPA hệ 10), theo cùng
// ngưỡng với điểm chữ từng môn để nhất quán.
function classifyGpa(gpa: number | null): { label: string; color: string } {
  if (gpa == null) return { label: 'Chưa có điểm', color: '#9CA3AF' };
  if (gpa >= 8.5) return { label: 'Giỏi', color: '#16A34A' };
  if (gpa >= 7.0) return { label: 'Khá', color: '#2563EB' };
  if (gpa >= 5.5) return { label: 'Trung bình', color: '#0891B2' };
  if (gpa >= 4.0) return { label: 'Yếu', color: '#D97706' };
  return { label: 'Kém', color: '#DC2626' };
}

export default function StudentAchievementView() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [gpaData, setGpaData] = useState<GpaData | null>(null);
  const [semesterOptions, setSemesterOptions] = useState<string[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<string | null>(null); // null = Tất cả

  // -------------------------------------------------------------------
  // Hồ sơ sinh viên hiện tại (xem ghi chú ở đầu file)
  // -------------------------------------------------------------------
  const fetchMyProfile = async (token: string): Promise<StudentProfile | null> => {
    try {
      const res = await fetch(`${API_URL}/students/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        const s = json.student || json.data || json;
        if (s && s.studentId) return s;
      }
    } catch {
      // ignore, thử fallback bên dưới
    }
    try {
      const raw = await AsyncStorage.getItem('user');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.studentId) return parsed;
      }
    } catch {
      // ignore
    }
    return null;
  };

  // -------------------------------------------------------------------
  // Điểm các môn của sinh viên hiện tại — GET /grades/student/me
  // -------------------------------------------------------------------
  const fetchMyGrades = async (token: string, semester?: string | null): Promise<Grade[]> => {
    try {
      const qs = semester ? `?semester=${encodeURIComponent(semester)}` : '';
      const res = await fetch(`${API_URL}/grades/student/me${qs}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) return json.data || [];
      return [];
    } catch (error) {
      console.error('Lỗi tải điểm:', error);
      return [];
    }
  };

  // -------------------------------------------------------------------
  // GPA + tín chỉ tích lũy — GET /grades/student/gpa
  // -------------------------------------------------------------------
  const fetchMyGpa = async (token: string, semester?: string | null): Promise<GpaData | null> => {
    try {
      const qs = semester ? `?semester=${encodeURIComponent(semester)}` : '';
      const res = await fetch(`${API_URL}/grades/student/gpa${qs}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) return json.data;
      return null;
    } catch (error) {
      console.error('Lỗi tải GPA:', error);
      return null;
    }
  };

  // -------------------------------------------------------------------
  // Load toàn bộ dữ liệu (không lọc học kỳ) để lấy danh sách học kỳ + điểm
  // -------------------------------------------------------------------
  const loadData = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const [myProfile, allGrades, gpa] = await Promise.all([
        fetchMyProfile(token),
        fetchMyGrades(token, null),
        fetchMyGpa(token, null),
      ]);

      setProfile(myProfile);
      setGrades(allGrades);
      setGpaData(gpa);

      const sems = Array.from(new Set(allGrades.map((g) => g.semester).filter(Boolean))).sort();
      setSemesterOptions(sems);
    } catch (error) {
      console.error('Lỗi tải thành tích:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Khi đổi bộ lọc học kỳ: gọi lại GPA theo đúng học kỳ đó (server tính),
  // còn bảng điểm thì lọc ngay trên dữ liệu đã tải (không cần gọi lại API).
  useEffect(() => {
    if (loading) return;
    (async () => {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      const gpa = await fetchMyGpa(token, selectedSemester);
      setGpaData(gpa);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSemester]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // -------------------------------------------------------------------
  // Lọc + gom nhóm theo học kỳ để hiển thị
  // -------------------------------------------------------------------
  const visibleGrades = useMemo(() => {
    if (!selectedSemester) return grades;
    return grades.filter((g) => g.semester === selectedSemester);
  }, [grades, selectedSemester]);

  const groupedBySemester = useMemo(() => {
    const map = new Map<string, Grade[]>();
    visibleGrades.forEach((g) => {
      const key = g.semester || 'Chưa xác định';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(g);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [visibleGrades]);

  const overallClass = classifyGpa(gpaData?.gpa ?? null);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#2563EB" style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thành tích học tập</Text>
        <TouchableOpacity onPress={onRefresh}>
          <Ionicons name="refresh" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Thông tin sinh viên */}
        {profile && (
          <View style={styles.profileCard}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{profile.fullName?.charAt(0) || '?'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.profileName}>{profile.fullName}</Text>
              <Text style={styles.profileSub}>MSSV: {profile.studentId} • Lớp: {profile.class}</Text>
            </View>
          </View>
        )}

        {/* Tổng quan GPA (từ /grades/student/gpa) */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{gpaData?.gpa ?? '-'}</Text>
            <Text style={styles.summaryLabel}>Điểm TB (hệ 10)</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: overallClass.color }]}>{overallClass.label}</Text>
            <Text style={styles.summaryLabel}>Xếp loại học lực</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{gpaData?.totalCredits ?? 0}</Text>
            <Text style={styles.summaryLabel}>Tín chỉ tích lũy</Text>
          </View>
        </View>

        {/* Bộ lọc học kỳ */}
        {semesterOptions.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            <TouchableOpacity
              style={[styles.chip, !selectedSemester && styles.chipActive]}
              onPress={() => setSelectedSemester(null)}
            >
              <Text style={[styles.chipText, !selectedSemester && styles.chipTextActive]}>Tất cả</Text>
            </TouchableOpacity>
            {semesterOptions.map((sem) => (
              <TouchableOpacity
                key={sem}
                style={[styles.chip, selectedSemester === sem && styles.chipActive]}
                onPress={() => setSelectedSemester(sem)}
              >
                <Text style={[styles.chipText, selectedSemester === sem && styles.chipTextActive]}>{sem}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Bảng điểm theo học kỳ */}
        {groupedBySemester.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 60 }}>
            <Ionicons name="school-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>Chưa có dữ liệu điểm</Text>
          </View>
        ) : (
          groupedBySemester.map(([semester, semGrades]) => (
            <View key={semester} style={styles.semesterBlock}>
              <Text style={styles.semesterTitle}>{semester}</Text>

              {semGrades.map((g) => {
                const course = g.course as Course;
                const c = classifyByLetter(g.grade);
                const isInProgress = g.status === 'in-progress';
                return (
                  <View key={g._id} style={styles.courseRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.courseName}>{course?.courseName || 'Môn học'}</Text>
                      <Text style={styles.courseSub}>
                        {course?.courseCode} • {course?.credits ?? '-'} TC
                      </Text>
                      <Text style={styles.courseSub}>
                        GK: {g.midtermScore ?? '-'}  |  CK: {g.finalScore ?? '-'}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.courseTotal}>{isInProgress ? '-' : g.totalScore ?? '-'}</Text>
                      <Text style={[styles.courseClass, { color: c.color }]}>
                        {isInProgress ? 'Đang học' : `${c.label}${g.grade ? ` (${g.grade})` : ''}`}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#333' },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    gap: 12,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  profileName: { fontSize: 16, fontWeight: '700', color: '#222' },
  profileSub: { fontSize: 13, color: '#777', marginTop: 2 },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 16,
    marginBottom: 16,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryDivider: { width: 1, backgroundColor: '#EEE' },
  summaryValue: { fontSize: 18, fontWeight: '700', color: '#222' },
  summaryLabel: { fontSize: 12, color: '#888', marginTop: 4, textAlign: 'center' },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  chipText: { fontSize: 13, color: '#555' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  semesterBlock: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  semesterTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2563EB',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingBottom: 8,
  },
  courseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  courseName: { fontSize: 14, fontWeight: '600', color: '#222' },
  courseSub: { fontSize: 12, color: '#888', marginTop: 2 },
  courseTotal: { fontSize: 16, fontWeight: '700', color: '#222' },
  courseClass: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  emptyText: { marginTop: 12, color: '#999', fontSize: 14 },
});