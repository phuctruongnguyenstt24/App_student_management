// mng_frameworkstudent.jsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { API_URL } from "../../config/api";
import { useAuth } from "../../contexts/AuthContext";

// Interface khớp với dữ liệu thực tế từ API /curriculum
interface CurriculumItem {
  _id: string;
  courseId: any;
  courseCode: string;
  courseName: string;
  credits: number;
  semester: string;
  academicYear: string;
  status: 'completed' | 'incomplete' | 'in_progress';
  programName?: string;
}

const CurriculumStudentScreen = () => {
  const { user } = useAuth();
  const [frameworks, setFrameworks] = useState<CurriculumItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // SỬA ĐỔI: Dùng mảng để lưu danh sách các học kỳ đang mở
  const [expandedSemesters, setExpandedSemesters] = useState<string[]>([]);

  useEffect(() => {
    fetchCurriculum();
  }, []);

  const fetchCurriculum = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/curriculum`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      const data = await response.json();

      if (data.success && Array.isArray(data.data)) {
        setFrameworks(data.data);
      } else if (Array.isArray(data)) {
        setFrameworks(data);
      } else {
        setFrameworks([]);
      }
    } catch (error) {
      console.error("Error fetching curriculum:", error);
      Alert.alert("Lỗi", "Không thể tải chương trình khung. Hãy kiểm tra kết nối.");
      setFrameworks([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchCurriculum();
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.replace('/tabs/AllFeaturesScreen');
    }
  };

  // Hàm xử lý việc đóng/mở học kỳ (hỗ trợ mở nhiều cái cùng lúc)
  const toggleSemester = (semesterName: string) => {
    setExpandedSemesters(prev =>
      prev.includes(semesterName)
        ? prev.filter(s => s !== semesterName) // Nếu đang mở thì đóng
        : [...prev, semesterName]              // Nếu đang đóng thì thêm vào danh sách mở
    );
  };

  // Mảng an toàn chống crash
  const safeFrameworks = Array.isArray(frameworks) ? frameworks : [];

  // ================= TÍNH TOÁN THỐNG KÊ =================
  const getTotalSubjects = (): number => safeFrameworks.length;

  const getTotalCredits = (): number => {
    return safeFrameworks.reduce((total, item) => total + (item.credits || 0), 0);
  };

  const getCompletedCredits = (): number => {
    return safeFrameworks.reduce((total, item) => {
      if (item.status === 'completed') {
        return total + (item.credits || 0);
      }
      return total;
    }, 0);
  };

  // ================= XỬ LÝ NHÓM DỮ LIỆU THEO HỌC KỲ =================
  const groupedSemesters = safeFrameworks.reduce((acc, item) => {
    const sem = item.semester || 'Chưa xếp loại';
    if (!acc[sem]) acc[sem] = [];
    acc[sem].push(item);
    return acc;
  }, {} as Record<string, CurriculumItem[]>);

  // Sắp xếp các học kỳ theo thứ tự (HK1, HK2, ...)
  const sortedSemesters = Object.keys(groupedSemesters).sort((a, b) => a.localeCompare(b));

  // Cấu hình UI cho các trạng thái
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed': return { label: '✓ Hoàn thành', bg: '#e8f5e9', text: '#4CAF50' };
      case 'in_progress': return { label: '🔄 Đang học', bg: '#fff8e1', text: '#FFC107' };
      default: return { label: 'Chưa hoàn thành', bg: '#ffebee', text: '#F44336' };
    }
  };

  // ================= COMPONENT RENDER MÔN HỌC =================
  const renderSubjectCard = (subject: CurriculumItem) => {
    const statusConfig = getStatusConfig(subject.status);

    return (
      <View key={subject._id} style={styles.subjectCard}>
        <View style={styles.subjectHeader}>
          <View style={styles.subjectTitle}>
            <Text style={styles.subjectName}>{subject.courseName}</Text>
            <Text style={styles.subjectCode}>Mã: {subject.courseCode}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
            <Text style={[styles.statusText, { color: statusConfig.text }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        <View style={styles.subjectDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="book-outline" size={14} color="#666" />
            <Text style={styles.detailLabel}>Tín chỉ:</Text>
            <Text style={styles.detailValue}>{subject.credits}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={14} color="#666" />
            <Text style={styles.detailLabel}>Năm học:</Text>
            <Text style={styles.detailValue}>{subject.academicYear}</Text>
          </View>
          {subject.programName && (
            <View style={styles.detailItem}>
              <Ionicons name="school-outline" size={14} color="#666" />
              <Text style={styles.detailLabel}>CTĐT:</Text>
              <Text style={styles.detailValue}>{subject.programName}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1065db" />
        <Text style={styles.loadingText}>Đang tải chương trình khung...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chương trình học</Text>
          <Text style={styles.headerSubtitle}>
            Theo dõi tiến độ học tập của bạn
          </Text>
        </View>

        {/* Thông tin tổng quan */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{getTotalSubjects()}</Text>
              <Text style={styles.summaryLabel}>Tổng HP</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{getTotalCredits()}</Text>
              <Text style={styles.summaryLabel}>Tổng TC</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNumber, { color: '#4CAF50' }]}>{getCompletedCredits()}</Text>
              <Text style={styles.summaryLabel}>TC Tích lũy</Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Tiến độ hoàn thành</Text>
              <Text style={styles.progressPercent}>
                {getTotalCredits() > 0
                  ? Math.round((getCompletedCredits() / getTotalCredits()) * 100)
                  : 0}%
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: getTotalCredits() > 0
                      ? `${Math.min((getCompletedCredits() / getTotalCredits()) * 100, 100)}%`
                      : '0%'
                  }
                ]}
              />
            </View>
          </View>
        </View>

        {/* Danh sách học kỳ */}
        {sortedSemesters.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>Chưa có dữ liệu học phần</Text>
            <Text style={styles.emptySubText}>
              Chương trình khung đang được cập nhật
            </Text>
          </View>
        ) : (
          sortedSemesters.map((semesterName) => {
            const subjects = groupedSemesters[semesterName];

            // SỬA ĐỔI: Kiểm tra xem học kỳ có nằm trong danh sách mở không
            const isExpanded = expandedSemesters.includes(semesterName);

            const semesterCredits = subjects.reduce((sum, s) => sum + (s.credits || 0), 0);
            const completedCount = subjects.filter(s => s.status === 'completed').length;

            return (
              <View key={semesterName} style={styles.semesterCard}>
                <TouchableOpacity
                  style={styles.semesterHeader}
                  onPress={() => toggleSemester(semesterName)} // SỬA ĐỔI: Gọi hàm toggle
                  activeOpacity={0.7}
                >
                  <View style={styles.semesterTitleContainer}>
                    <Text style={styles.semesterTitle}>
                      {semesterName.includes('HK') ? `Học kỳ ${semesterName.replace('HK', '')}` : semesterName}
                    </Text>
                    <View style={styles.semesterStats}>
                      <Text style={styles.statsText}>{subjects.length} HP</Text>
                      <Text style={styles.statsText}>•</Text>
                      <Text style={styles.statsText}>{semesterCredits} TC</Text>
                      <Text style={styles.statsText}>•</Text>
                      <Text style={styles.statsText}>
                        Hoàn thành: {completedCount}/{subjects.length}
                      </Text>
                    </View>
                  </View>
                  <Ionicons
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={24}
                    color="#1065db"
                  />
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.semesterContent}>
                    {subjects.map((subject) => renderSubjectCard(subject))}
                  </View>
                )}
              </View>
            );
          })
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2024 - Quản lý lộ trình học tập
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f5f5f5" },
  loadingText: { marginTop: 12, fontSize: 16, color: "#666" },
  header: { backgroundColor: "#1065db", padding: 16, paddingTop: 40, paddingBottom: 20 },
  backButton: { marginBottom: 12, width: 40, height: 40, justifyContent: "center" },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "white" },
  headerSubtitle: { fontSize: 14, color: "rgba(255,255,255,0.9)", marginTop: 4 },
  summaryContainer: { padding: 16, backgroundColor: "white", marginBottom: 8 },
  summaryCard: { flexDirection: "row", justifyContent: "space-around", alignItems: "center", backgroundColor: "#f9f9f9", borderRadius: 12, padding: 16, marginBottom: 16 },
  summaryItem: { alignItems: "center", flex: 1 },
  summaryNumber: { fontSize: 24, fontWeight: "bold", color: "#333" },
  summaryLabel: { fontSize: 12, color: "#666", marginTop: 4 },
  summaryDivider: { width: 1, height: 40, backgroundColor: "#e0e0e0" },
  progressContainer: { padding: 4 },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  progressLabel: { fontSize: 14, color: "#666", fontWeight: "500" },
  progressPercent: { fontSize: 16, fontWeight: "bold", color: "#4CAF50" },
  progressBar: { height: 8, backgroundColor: "#e0e0e0", borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: "#4CAF50", borderRadius: 4 },
  semesterCard: { backgroundColor: "white", margin: 16, marginBottom: 8, borderRadius: 12, elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, overflow: "hidden" },
  semesterHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, backgroundColor: "white" },
  semesterTitleContainer: { flex: 1 },
  semesterTitle: { fontSize: 18, fontWeight: "bold", color: "#333", marginBottom: 4 },
  semesterStats: { flexDirection: "row", alignItems: "center", flexWrap: "wrap" },
  statsText: { fontSize: 12, color: "#666", marginRight: 4 },
  semesterContent: { paddingHorizontal: 16, paddingBottom: 16 },
  subjectCard: { backgroundColor: "#f9f9f9", borderRadius: 8, padding: 12, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: "#1065db" },
  subjectHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
  subjectTitle: { flex: 1, marginRight: 8 },
  subjectName: { fontSize: 16, fontWeight: "600", color: "#333" },
  subjectCode: { fontSize: 12, color: "#666", marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, minWidth: 90, alignItems: "center" },
  statusText: { fontSize: 11, fontWeight: "600" },
  subjectDetails: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  detailItem: { flexDirection: "row", alignItems: "center", backgroundColor: "white", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, marginRight: 6, marginTop: 4 },
  detailLabel: { fontSize: 12, color: "#666", marginLeft: 4, marginRight: 2 },
  detailValue: { fontSize: 12, color: "#333", fontWeight: "500" },
  emptyContainer: { padding: 40, alignItems: "center", justifyContent: "center" },
  emptyText: { fontSize: 16, color: "#999", marginTop: 12, fontWeight: "500" },
  emptySubText: { fontSize: 14, color: "#bbb", marginTop: 4 },
  footer: { padding: 20, alignItems: "center" },
  footerText: { fontSize: 12, color: "#999" },
});

export default CurriculumStudentScreen;