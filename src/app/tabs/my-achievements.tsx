import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View ,Alert} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL } from '../../config/api';

// Định nghĩa Interface cho Học kỳ để dễ quản lý Label (hiển thị) và Value (gửi API)
interface SemesterOption {
    label: string; // VD: "Học kỳ 1"
    value: string; // VD: "HK1-2026"
}

export default function MyAchievementsScreen() {
    const router = useRouter();
    const [grades, setGrades] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // State quản lý Học kỳ (Đã nâng cấp thành Object)
    const [semesterOptions, setSemesterOptions] = useState<SemesterOption[]>([]);
    const [currentSemester, setCurrentSemester] = useState<SemesterOption | null>(null);
    const [showSemesterList, setShowSemesterList] = useState(false);

    // 1. Tải danh sách Học kỳ từ Chương trình khung ngay khi mở app
    useEffect(() => {
        fetchCurriculumSemesters();
    }, []);

    // 2. Tự động lấy bảng điểm mỗi khi thay đổi currentSemester
    useEffect(() => {
        if (currentSemester) {
            fetchMyGrades();
        }
    }, [currentSemester]);

    // HÀM LẤY CHƯƠNG TRÌNH KHUNG
    const fetchCurriculumSemesters = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                router.replace('/login');
                return;
            }

            // Lấy Năm học (Khóa) của sinh viên từ Local Storage
            const userStr = await AsyncStorage.getItem('user');
            let courseYear = '2026';
            if (userStr) {
                const user = JSON.parse(userStr);
                courseYear = user.courseYear || user.year || (user.class ? user.class.match(/\d{4}/)?.[0] : '2026') || '2026';
            }

            const response = await fetch(`${API_URL}/curriculum`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            // Xử lý dữ liệu trả về
            let rawSemesters = [];
            if (Array.isArray(data)) rawSemesters = data;
            else if (data && Array.isArray(data.data)) rawSemesters = data.data;
            else if (data && Array.isArray(data.semesters)) rawSemesters = data.semesters;
            else if (data && data.curriculum && Array.isArray(data.curriculum)) rawSemesters = data.curriculum;

            if (rawSemesters.length > 0) {
                // Sắp xếp học kỳ tăng dần
                const sorted = rawSemesters.sort((a: any, b: any) => a.semesterNumber - b.semesterNumber);

                // Format lại mảng Options cho Dropdown
                const options: SemesterOption[] = sorted.map((sem: any) => ({
                    label: `Học kỳ ${sem.semesterNumber}`,
                    value: `HK${sem.semesterNumber}-${courseYear}`
                }));

                setSemesterOptions(options);
                setCurrentSemester(options[0]); // Mặc định chọn học kỳ 1
            }
        } catch (error) {
            console.error("Lỗi tải chương trình khung:", error);
            Alert.alert("Lỗi", "Không thể tải chương trình khung");
        } finally {
            setLoading(false);
        }
    };

    // HÀM LẤY BẢNG ĐIỂM THEO HỌC KỲ
    const fetchMyGrades = async () => {
        if (!currentSemester) return;
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                router.replace('/login');
                return;
            }

            // Gọi API bằng currentSemester.value (VD: HK1-2026)
            const res = await fetch(`${API_URL}/grades/student/me?semester=${currentSemester.value}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();

            if (data.success) {
                setGrades(data.data || []);
            } else {
                setGrades([]);
            }
        } catch (error) {
            console.error("Lỗi fetchMyGrades:", error);
            setGrades([]);
        } finally {
            setLoading(false);
        }
    };

    // Tính toán thống kê học kỳ
    const totalCredits = grades.reduce((sum, item) => sum + (item.course?.credits || 0), 0);
    const passedCredits = grades.reduce((sum, item) => sum + (item.finalScore >= 5 ? (item.course?.credits || 0) : 0), 0);

    const renderScoreStatus = (score: number | null | undefined) => {
        if (score === null || score === undefined) {
            return (
                <View style={[styles.statusBadge, { backgroundColor: '#F3F4F6' }]}>
                    <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600' }}>Chưa có</Text>
                </View>
            );
        }
        if (score >= 5) {
            return (
                <View style={[styles.statusBadge, { backgroundColor: '#D1FAE5' }]}>
                    <Text style={{ color: '#065F46', fontSize: 11, fontWeight: '600' }}>Đạt</Text>
                </View>
            );
        }
        return (
            <View style={[styles.statusBadge, { backgroundColor: '#FEE2E2' }]}>
                <Text style={{ color: '#991B1B', fontSize: 11, fontWeight: '600' }}>Chưa đạt</Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Kết quả học tập</Text>
                <TouchableOpacity onPress={fetchMyGrades} style={styles.refreshButton}>
                    <Ionicons name="refresh" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Bộ lọc học kỳ */}
            <View style={styles.filterSection}>
                <Text style={styles.sectionLabel}>CHỌN HỌC KỲ</Text>
                <TouchableOpacity
                    style={styles.dropdownBox}
                    onPress={() => setShowSemesterList(!showSemesterList)}
                    disabled={semesterOptions.length === 0}
                >
                    <Ionicons name="calendar-outline" size={20} color="#2563EB" style={styles.icon} />
                    <Text style={styles.dropdownText}>
                        {currentSemester ? currentSemester.label : "Đang tải dữ liệu..."}
                    </Text>
                    <Ionicons name={showSemesterList ? "chevron-up" : "chevron-down"} size={20} color="#6B7280" />
                </TouchableOpacity>

                {/* Dropdown list học kỳ */}
                {showSemesterList && semesterOptions.length > 0 && (
                    <View style={styles.semesterDropdownList}>
                        {semesterOptions.map((sem, idx) => (
                            <TouchableOpacity
                                key={idx}
                                style={[styles.semesterItem, currentSemester?.value === sem.value && styles.semesterItemSelected]}
                                onPress={() => {
                                    setCurrentSemester(sem);
                                    setShowSemesterList(false);
                                }}
                            >
                                <Text style={[styles.semesterItemText, currentSemester?.value === sem.value && styles.semesterItemTextSelected]}>
                                    {sem.label}
                                </Text>
                                {currentSemester?.value === sem.value && (
                                    <Ionicons name="checkmark-circle" size={24} color="#2563EB" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>

            {/* Thống kê */}
            <View style={styles.summaryCard}>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Môn đã học</Text>
                    <Text style={styles.summaryValue}>{grades.length}</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Tổng tín chỉ</Text>
                    <Text style={styles.summaryValue}>{totalCredits}</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Tín chỉ đạt</Text>
                    <Text style={[styles.summaryValue, { color: '#059669' }]}>{passedCredits}</Text>
                </View>
            </View>

            {/* Danh sách điểm */}
            <View style={styles.listContainer}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#2563EB" />
                        <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={grades}
                        keyExtractor={(item, index) => item._id || index.toString()}
                        contentContainerStyle={{ paddingBottom: 20 }}
                        renderItem={({ item }) => (
                            <View style={styles.gradeCard}>
                                <View style={styles.gradeHeader}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.courseName}>{item.course?.courseName || 'Môn học không xác định'}</Text>
                                        <Text style={styles.courseCode}>
                                            {item.course?.courseCode} • {item.course?.credits} tín chỉ
                                        </Text>
                                    </View>
                                    {renderScoreStatus(item.finalScore)}
                                </View>

                                <View style={styles.gradeDivider} />

                                <View style={styles.scoresRow}>
                                    <View style={styles.scoreBox}>
                                        <Text style={styles.scoreLabel}>Điểm Giữa kỳ</Text>
                                        <Text style={[styles.scoreNumber, item.midtermScore !== null && { color: '#2563EB' }]}>
                                            {item.midtermScore ?? '-'}
                                        </Text>
                                    </View>
                                    <View style={styles.scoreDivider} />
                                    <View style={styles.scoreBox}>
                                        <Text style={styles.scoreLabel}>Điểm Cuối kỳ</Text>
                                        <Text style={[styles.scoreNumber, item.finalScore !== null && { color: '#2563EB' }]}>
                                            {item.finalScore ?? '-'}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        )}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Ionicons name="document-text-outline" size={64} color="#D1D5DB" />
                                <Text style={styles.emptyTitle}>
                                    Chưa có dữ liệu điểm
                                </Text>
                                <Text style={styles.emptySubtitle}>
                                    cho {currentSemester?.label?.toLowerCase() || 'học kỳ này'}
                                </Text>
                            </View>
                        }
                    />
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#F3F4F6' 
    },
    
    // Header - giống student-achievements
    header: { 
        backgroundColor: '#2563EB', 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingHorizontal: 16, 
        paddingTop: 12,
        paddingBottom: 16,
    },
    backButton: { padding: 5 },
    refreshButton: { padding: 5 },
    headerTitle: { 
        color: '#fff', 
        fontSize: 18, 
        fontWeight: 'bold' 
    },

    // Filter Section
    filterSection: { 
        padding: 16, 
        backgroundColor: '#fff', 
        borderBottomWidth: 1, 
        borderBottomColor: '#E5E7EB',
        zIndex: 50,
    },
    sectionLabel: { 
        fontSize: 11, 
        fontWeight: '700', 
        color: '#6B7280', 
        marginBottom: 8, 
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    dropdownBox: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: '#F9FAFB', 
        borderRadius: 12, 
        paddingHorizontal: 12, 
        height: 48, 
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    icon: { marginRight: 10 },
    dropdownText: { 
        flex: 1, 
        fontSize: 15, 
        color: '#1F2937', 
        fontWeight: '500' 
    },

    // Dropdown list
    semesterDropdownList: { 
        position: 'absolute', 
        top: 82, 
        left: 16, 
        right: 16, 
        backgroundColor: '#fff', 
        borderRadius: 12, 
        marginTop: 4, 
        paddingVertical: 8, 
        shadowColor: "#000", 
        shadowOffset: { width: 0, height: 4 }, 
        shadowOpacity: 0.1, 
        shadowRadius: 6, 
        elevation: 5, 
        borderWidth: 1, 
        borderColor: '#E5E7EB', 
        zIndex: 1000,
    },
    semesterItem: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingHorizontal: 16, 
        paddingVertical: 12,
    },
    semesterItemSelected: { 
        backgroundColor: '#EFF6FF',
    },
    semesterItemText: { 
        fontSize: 15, 
        color: '#4B5563' 
    },
    semesterItemTextSelected: { 
        color: '#2563EB', 
        fontWeight: '700' 
    },

    // Summary Card
    summaryCard: { 
        flexDirection: 'row', 
        backgroundColor: '#fff', 
        marginHorizontal: 16, 
        borderRadius: 16, 
        paddingVertical: 16, 
        marginVertical: 16, 
        shadowColor: "#000", 
        shadowOffset: { width: 0, height: 2 }, 
        shadowOpacity: 0.05, 
        shadowRadius: 4, 
        elevation: 3,
    },
    summaryItem: { 
        flex: 1, 
        alignItems: 'center' 
    },
    summaryLabel: { 
        fontSize: 12, 
        color: '#6B7280', 
        marginBottom: 4,
        fontWeight: '600',
    },
    summaryValue: { 
        fontSize: 20, 
        fontWeight: 'bold', 
        color: '#1F2937' 
    },
    summaryDivider: { 
        width: 1, 
        backgroundColor: '#E5E7EB', 
        marginVertical: 4 
    },

    // List
    listContainer: { 
        flex: 1, 
        paddingHorizontal: 16 
    },
    gradeCard: { 
        backgroundColor: '#fff', 
        borderRadius: 16, 
        padding: 16, 
        marginBottom: 12, 
        shadowColor: "#000", 
        shadowOffset: { width: 0, height: 2 }, 
        shadowOpacity: 0.05, 
        shadowRadius: 4, 
        elevation: 2,
    },
    gradeHeader: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start' 
    },
    courseName: { 
        fontSize: 16, 
        fontWeight: 'bold', 
        color: '#1F2937', 
        marginBottom: 4 
    },
    courseCode: { 
        fontSize: 13, 
        color: '#6B7280' 
    },
    statusBadge: { 
        paddingHorizontal: 10, 
        paddingVertical: 4, 
        borderRadius: 6,
    },

    gradeDivider: { 
        height: 1, 
        backgroundColor: '#F3F4F6', 
        marginVertical: 12 
    },
    scoresRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-around' 
    },
    scoreBox: { 
        alignItems: 'center', 
        flex: 1,
    },
    scoreLabel: { 
        fontSize: 11, 
        color: '#6B7280', 
        marginBottom: 4,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    scoreNumber: { 
        fontSize: 18, 
        fontWeight: 'bold', 
        color: '#6B7280' 
    },
    scoreDivider: { 
        width: 1, 
        backgroundColor: '#E5E7EB',
        marginHorizontal: 8,
    },

    // Empty State
    emptyContainer: { 
        alignItems: 'center', 
        justifyContent: 'center', 
        paddingTop: 80,
    },
    emptyTitle: { 
        marginTop: 16, 
        fontSize: 16, 
        fontWeight: '600',
        color: '#4B5563' 
    },
    emptySubtitle: { 
        marginTop: 4, 
        fontSize: 14, 
        color: '#6B7280' 
    },

    // Loading
    loadingContainer: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        paddingVertical: 40,
    },
    loadingText: { 
        marginTop: 12, 
        fontSize: 14, 
        color: '#6B7280',
    },
});