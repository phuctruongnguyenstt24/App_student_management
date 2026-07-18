// mng_frameworkstudent.jsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from 'expo-router';
import { useAuth } from "../../contexts/AuthContext";
import { API_URL } from "../../config/api";

// Định nghĩa interface cho Subject
interface Subject {
  _id?: string;
  id?: string;
  name: string;
  code: string;
  credits: number;
  theoryHours: number;
  practiceHours: number;
  isRequired: boolean;
  isCompleted: boolean;
  semester?: number;
}

// Định nghĩa interface cho Semester
interface Semester {
  _id?: string;
  id?: string;
  semesterNumber: number;
  subjects: Subject[];
  totalCredits?: number;
}



const CurriculumStudentScreen = () => {
  const { user } = useAuth();
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null);

  useEffect(() => {
    fetchCurriculum();
  }, []);

  const fetchCurriculum = async () => {
    try {
      const response = await fetch(`${API_URL}/curriculum`);
      const data = await response.json();
      setSemesters(data);
    } catch (error) {
      console.error("Error fetching curriculum:", error);
      Alert.alert("Lỗi", "Không thể tải chương trình khung");
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

  const getTotalCredits = (): number => {
    let total = 0;
    semesters.forEach(semester => {
      semester.subjects?.forEach(subject => {
        total += subject.credits || 0;
      });
    });
    return total;
  };

  const getTotalSubjects = (): number => {
    let count = 0;
    semesters.forEach(semester => {
      count += semester.subjects?.length || 0;
    });
    return count;
  };

  const getCompletedCredits = (): number => {
    let total = 0;
    semesters.forEach(semester => {
      semester.subjects?.forEach(subject => {
        if (subject.isCompleted) {
          total += subject.credits || 0;
        }
      });
    });
    return total;
  };

  const renderSubjectCard = (subject: Subject) => (
    <View key={subject._id || subject.id} style={styles.subjectCard}>
      <View style={styles.subjectHeader}>
        <View style={styles.subjectTitle}>
          <Text style={styles.subjectName}>{subject.name}</Text>
          <Text style={styles.subjectCode}>Mã: {subject.code}</Text>
        </View>
        <View style={[
          styles.statusBadge,
          subject.isCompleted ? styles.completed : styles.incomplete
        ]}>
          <Text style={styles.statusText}>
            {subject.isCompleted ? "✓ Hoàn thành" : "Chưa hoàn thành"}
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
          <Ionicons name="time-outline" size={14} color="#666" />
          <Text style={styles.detailLabel}>Lý thuyết:</Text>
          <Text style={styles.detailValue}>{subject.theoryHours}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="construct-outline" size={14} color="#666" />
          <Text style={styles.detailLabel}>Thực hành:</Text>
          <Text style={styles.detailValue}>{subject.practiceHours}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="ribbon-outline" size={14} color="#666" />
          <Text style={styles.detailLabel}>Loại:</Text>
          <Text style={[
            styles.detailValue,
            subject.isRequired ? styles.requiredText : styles.electiveText
          ]}>
            {subject.isRequired ? "Bắt buộc" : "Tự chọn"}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderSemester = (semester: Semester) => {
    const isExpanded = selectedSemester === semester.semesterNumber;
    const totalCredits = semester.subjects?.reduce((sum, s) => sum + s.credits, 0) || 0;
    const completedCount = semester.subjects?.filter(s => s.isCompleted).length || 0;

    return (
      <View key={semester._id || semester.id} style={styles.semesterCard}>
        <TouchableOpacity
          style={styles.semesterHeader}
          onPress={() => setSelectedSemester(
            isExpanded ? null : semester.semesterNumber
          )}
          activeOpacity={0.7}
        >
          <View style={styles.semesterTitleContainer}>
            <Text style={styles.semesterTitle}>
              Học kỳ {semester.semesterNumber}
            </Text>
            <View style={styles.semesterStats}>
              <Text style={styles.statsText}>
                {semester.subjects?.length || 0} môn
              </Text>
              <Text style={styles.statsText}>•</Text>
              <Text style={styles.statsText}>{totalCredits} TC</Text>
              {(semester.subjects?.length || 0) > 0 && (
                <>
                  <Text style={styles.statsText}>•</Text>
                  <Text style={styles.statsText}>
                    Hoàn thành: {completedCount}/{semester.subjects?.length || 0}
                  </Text>
                </>
              )}
            </View>
          </View>
          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={24}
            color="#4CAF50"
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.semesterContent}>
            {!semester.subjects || semester.subjects.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Chưa có môn học nào</Text>
              </View>
            ) : (
              semester.subjects.map((subject) => renderSubjectCard(subject))
            )}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Đang tải chương trình khung...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chương trình khung</Text>
          <Text style={styles.headerSubtitle}>
            Kỹ thuật phần mềm - Đại học chính quy
          </Text>
        </View>

        {/* Thông tin tổng quan */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{getTotalSubjects()}</Text>
              <Text style={styles.summaryLabel}>Tổng môn học</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{getTotalCredits()}</Text>
              <Text style={styles.summaryLabel}>Tổng tín chỉ</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{getCompletedCredits()}</Text>
              <Text style={styles.summaryLabel}>Đã hoàn thành</Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Tiến độ học tập</Text>
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
                      ? `${Math.min(
                          (getCompletedCredits() / getTotalCredits()) * 100,
                          100
                        )}%` 
                      : '0%'
                  }
                ]} 
              />
            </View>
          </View>
        </View>

        {/* Danh sách học kỳ */}
        {semesters.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>Chưa có học kỳ nào</Text>
            <Text style={styles.emptySubText}>
              Chương trình khung đang được cập nhật
            </Text>
          </View>
        ) : (
          semesters.map((semester) => renderSemester(semester))
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2024 - Chương trình đào tạo Kỹ thuật phần mềm
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  header: {
    backgroundColor: "#1065db",
    padding: 16,
    paddingTop: 40,
    paddingBottom: 20,
  },
  backButton: {
    marginBottom: 12,
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    marginTop: 4,
  },
  summaryContainer: {
    padding: 16,
    backgroundColor: "white",
    marginBottom: 8,
  },
  summaryCard: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  summaryItem: {
    alignItems: "center",
    flex: 1,
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  summaryLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#e0e0e0",
  },
  progressContainer: {
    padding: 4,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  progressPercent: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  progressBar: {
    height: 8,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#4CAF50",
    borderRadius: 4,
  },
  semesterCard: {
    backgroundColor: "white",
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    overflow: "hidden",
  },
  semesterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "white",
  },
  semesterTitleContainer: {
    flex: 1,
  },
  semesterTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  semesterStats: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  statsText: {
    fontSize: 12,
    color: "#666",
    marginRight: 4,
  },
  semesterContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  subjectCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
  },
  subjectHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  subjectTitle: {
    flex: 1,
    marginRight: 8,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  subjectCode: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 100,
    alignItems: "center",
  },
  completed: {
    backgroundColor: "#e8f5e9",
  },
  incomplete: {
    backgroundColor: "#fff3e0",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#333",
  },
  subjectDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    marginRight: 6,
    marginTop: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
    marginRight: 2,
  },
  detailValue: {
    fontSize: 12,
    color: "#333",
    fontWeight: "500",
  },
  requiredText: {
    color: "#4CAF50",
  },
  electiveText: {
    color: "#2196F3",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    marginTop: 12,
    fontWeight: "500",
  },
  emptySubText: {
    fontSize: 14,
    color: "#bbb",
    marginTop: 4,
  },
  footer: {
    padding: 20,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: "#999",
  },
});

export default CurriculumStudentScreen;