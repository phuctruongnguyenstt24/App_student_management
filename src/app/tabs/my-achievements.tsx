// my-chievements.tsx
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL } from '../../config/api';

interface Achievement {
  _id: string;
  courseCode: string;
  courseName: string;
  credits: number;
  midtermScore: number | null;
  finalScore: number | null;
  averageScore: number; // Điểm tổng của tôi: GK*40% + CK*60%
  classAverage: number; // Trung bình của cả lớp
  grade: string;
  semester: string;
  status: string;
}

interface Grade {
  _id: string;
  course: {
    courseCode: string;
    courseName: string;
    credits: number;
  };
  midtermScore: number | null;
  finalScore: number | null;
  semester: string;
}

export default function MyAchievements() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [semesters, setSemesters] = useState<string[]>([]);
  const [summary, setSummary] = useState({
    totalCredits: 0,
    gpa: 0,
     classAverageGPA: 0,
    completedCourses: 0
  });

  useEffect(() => {
    loadAchievements();
  }, []);

  // Tính điểm tổng: GK*40% + CK*60%
  const calculateTotalScore = (midterm: number | null, final: number | null) => {
    if (midterm === null && final === null) return 0;
    const mid = midterm || 0;
    const fin = final || 0;
    return Number(((mid * 0.4) + (fin * 0.6)).toFixed(2));
  };

  // Tính điểm chữ
  const calculateGrade = (score: number) => {
    if (score === 0) return '';
     if (score >= 9.5) return 'A+';
    if (score >= 8.5) return 'A';
    if (score >= 7.0) return 'B+';
    if (score >= 6.5) return 'B';
    if (score >= 5.5) return 'C';
    if (score >= 4.0) return 'D';
    return 'F';
  };

  const loadAchievements = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        setLoading(false);
        return;
      }

      // Fetch grades and class averages
      const [gradesRes, classAvgRes] = await Promise.all([
        fetch(`${API_URL}/grades/student/me`, { 
          headers: { Authorization: `Bearer ${token}` } 
        }),
        fetch(`${API_URL}/grades/class/average`, { 
          headers: { Authorization: `Bearer ${token}` } 
        })
      ]);

      // Process grades
      const gradesData = await gradesRes.json();
      if (!gradesData.success) {
        console.error('Failed to fetch grades:', gradesData);
        setLoading(false);
        return;
      }

      // Process class averages
      let classAvgMap = new Map<string, number>();
      try {
        const classAvgData = await classAvgRes.json();
        if (classAvgData.success) {
          console.log('RAW CLASS AVG SAMPLE:', JSON.stringify(classAvgData.data?.[0], null, 2));
          classAvgData.data.forEach((item: any) => {
            const code = item.courseCode || item.course?.courseCode;
            if (code) classAvgMap.set(code, item.averageScore);
          });
        }
      } catch (error) {
        console.log('Could not fetch class averages');
      }

      // Combine data
      const grades = gradesData.data || [];

      // DEBUG: kiểm tra cấu trúc thật của 1 grade để đối chiếu field course lồng/phẳng
      if (grades.length > 0) {
        console.log('RAW GRADE SAMPLE:', JSON.stringify(grades[0], null, 2));
      }

      const formattedData: Achievement[] = grades.map((grade: any) => {
        const midterm = grade.midtermScore ?? null;
        const final = grade.finalScore ?? null;

        // Fallback: course có thể nằm lồng trong "course" (nested) hoặc nằm
        // ngay trên grade dạng phẳng (flat), tùy backend trả về kiểu nào.
        // Áp dụng cùng cách xử lý phòng thủ như bên trang quản lý thành tích.
        const courseCode = grade.course?.courseCode || grade.courseCode || '';
        const courseName = grade.course?.courseName || grade.courseName || 'Không xác định';
        const credits = grade.course?.credits ?? grade.credits ?? 0;
        
        // Tính điểm tổng của tôi: GK*40% + CK*60%
        const myScore = calculateTotalScore(midterm, final);
        
        // Lấy điểm trung bình lớp
        const classAvg = classAvgMap.get(courseCode) || 0;
        
        // Tính điểm chữ
        const gradeLetter = calculateGrade(myScore);
        
        return {
          _id: grade._id,
          courseCode,
          courseName,
          credits,
          midtermScore: midterm,
          finalScore: final,
          averageScore: myScore,
          classAverage: classAvg,
          grade: gradeLetter,
          semester: grade.semester || '',
          status: myScore > 0 ? 'completed' : 'in-progress'
        };
      });

      setAchievements(formattedData);
      
      // Get semester list
      const semList = Array.from(new Set(formattedData.map(item => item.semester))).filter(Boolean) as string[];
      setSemesters(semList);
      if (semList.length > 0) setSelectedSemester(semList[0]);
      
      calculateSummary(formattedData);
      
    } catch (error) {
      console.error('Error loading achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (data: Achievement[]) => {
    const completed = data.filter(item => item.status === 'completed');
    const totalCredits = completed.reduce((sum, item) => sum + item.credits, 0);
    
    let totalWeightedScore = 0;
    let totalWeight = 0;
    let classTotalWeightedScore = 0;
    
    completed.forEach(item => {
      if (item.averageScore > 0) {
        totalWeightedScore += item.averageScore * item.credits;
        classTotalWeightedScore += (item.classAverage || 0) * item.credits;
        totalWeight += item.credits;
      }
    });
    
    setSummary({
      totalCredits,
      gpa: totalWeight > 0 ? Number((totalWeightedScore / totalWeight).toFixed(2)) : 0,
       classAverageGPA: totalWeight > 0 ? Number((classTotalWeightedScore / totalWeight).toFixed(2)) : 0,
      completedCourses: completed.length
    });
  };

  // Filter by semester
  const filteredData = selectedSemester === 'all' 
    ? achievements 
    : achievements.filter(item => item.semester === selectedSemester);

  const getScoreColor = (score: number, classAvg: number) => {
    if (!score && score !== 0) return '#999';
    if (classAvg === 0) return '#4CAF50';
    return score >= classAvg ? '#4CAF50' : '#f44336';
  };

  const getGradeColor = (grade: string) => {
    const colors: { [key: string]: string } = {
      'A+': '#ec300f',
      'A': '#4CAF50',
      'B+': '#8BC34A',
      'B': '#FFC107',
      'C+': '#FF9800',
      'C': '#FF5722',
      'D': '#f44336',
      'F': '#d32f2f'
    };
    return colors[grade] || '#999';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#2563EB" style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thành tích</Text>
        <TouchableOpacity onPress={loadAchievements}>
          <Ionicons name="refresh" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Semester selector */}
      {semesters.length > 0 && (
        <View style={styles.semesterContainer}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={['all', ...semesters]}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.semesterButton,
                  selectedSemester === item && styles.semesterButtonActive
                ]}
                onPress={() => setSelectedSemester(item)}
              >
                <Text style={[
                  styles.semesterText,
                  selectedSemester === item && styles.semesterTextActive
                ]}>
                  {item === 'all' ? 'Tất cả' : item}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* GPA Overview */}
      <View style={styles.gpaContainer}>
        <View style={styles.gpaItem}>
          <Text style={styles.gpaLabel}>GPA của tôi</Text>
          <Text style={styles.gpaValue}>{summary.gpa.toFixed(2)}</Text>
        </View>
        <View style={styles.gpaDivider} />
        <View style={styles.gpaItem}>
          <Text style={styles.gpaLabel}>GPA lớp</Text>
          <Text style={[styles.gpaValue, styles.classGpa]}>{summary. classAverageGPA.toFixed(2)}</Text>
        </View>
      </View>

      {/* Course list */}
      {filteredData.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="school-outline" size={60} color="#ccc" />
          <Text style={styles.emptyText}>Chưa có thành tích nào</Text>
        </View>
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <View style={styles.achievementCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.courseName}>{item.courseName}</Text>
                <View style={[styles.gradeBadge, { backgroundColor: getGradeColor(item.grade) }]}>
                  <Text style={styles.gradeText}>{item.grade || '--'}</Text>
                </View>
              </View>
              
              <Text style={styles.courseCode}>{item.courseCode} • {item.credits} tín chỉ</Text>
              
              <View style={styles.scoreContainer}>
                {/* My score */}
                <View style={styles.scoreItem}>
                  <View style={styles.scoreCircle}>
                    <Text style={[styles.scoreValue, { color: getScoreColor(item.averageScore, item.classAverage || 0) }]}>
                      {item.averageScore > 0 ? item.averageScore.toFixed(1) : '-'}
                    </Text>
                  </View>
                  <Text style={styles.scoreLabel}>Điểm của tôi</Text>
                </View>

                {/* Class average */}
                <View style={styles.scoreItem}>
                  <View style={[styles.scoreCircle, styles.classScoreCircle]}>
                    <Text style={styles.classScoreValue}>
                      {item.classAverage > 0 ? item.classAverage.toFixed(1) : '-'}
                    </Text>
                  </View>
                  <Text style={styles.scoreLabel}>Trung bình lớp</Text>
                </View>

                {/* Comparison */}
                <View style={styles.compareItem}>
                  {item.averageScore > 0 && item.classAverage > 0 ? (
                    <Text style={[
                      styles.compareText,
                      { color: item.averageScore >= item.classAverage ? '#4CAF50' : '#f44336' }
                    ]}>
                      {item.averageScore >= item.classAverage ? '▲' : '▼'} 
                      {Math.abs(item.averageScore - item.classAverage).toFixed(1)}
                    </Text>
                  ) : (
                    <Text style={styles.compareText}>-</Text>
                  )}
                  <Text style={styles.compareLabel}>So với lớp</Text>
                </View>
              </View>

              {/* Detail scores */}
              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Giữa kỳ (40%)</Text>
                  <Text style={styles.detailValue}>{item.midtermScore ?? '-'}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Cuối kỳ (60%)</Text>
                  <Text style={styles.detailValue}>{item.finalScore ?? '-'}</Text>
                </View>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6f9'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111'
  },
  semesterContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  semesterButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#f0f0f0'
  },
  semesterButtonActive: {
    backgroundColor: '#2563EB'
  },
  semesterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500'
  },
  semesterTextActive: {
    color: '#fff'
  },
  gpaContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  gpaItem: {
    flex: 1,
    alignItems: 'center'
  },
  gpaLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4
  },
  gpaValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2563EB'
  },
  classGpa: {
    color: '#999'
  },
  gpaDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 8
  },
  listContainer: {
    padding: 16,
    paddingTop: 0
  },
  achievementCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  courseName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    flex: 1,
    marginRight: 8
  },
  courseCode: {
    fontSize: 12,
    color: '#888',
    marginBottom: 12
  },
  gradeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 36,
    alignItems: 'center'
  },
  gradeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold'
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginBottom: 8
  },
  scoreItem: {
    alignItems: 'center'
  },
  scoreCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4
  },
  classScoreCircle: {
    backgroundColor: '#F5F5F5'
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  classScoreValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#999'
  },
  scoreLabel: {
    fontSize: 11,
    color: '#888'
  },
  compareItem: {
    alignItems: 'center'
  },
  compareText: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  compareLabel: {
    fontSize: 11,
    color: '#888'
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 8
  },
  detailItem: {
    alignItems: 'center'
  },
  detailLabel: {
    fontSize: 11,
    color: '#888',
    marginBottom: 2
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyText: {
    marginTop: 16,
    color: '#888',
    fontSize: 14
  }
});