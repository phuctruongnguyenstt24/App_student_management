import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { API_URL } from '../../config/api';

// Định nghĩa Interface cho Học kỳ để dễ quản lý Label (hiển thị) và Value (gửi API)
interface SemesterOption {
    label: string; // VD: "Học kỳ 1"
    value: string; // VD: "HK1-2026"
}

export default function MyAchievementsScreen() {
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

    // HÀM LẤY CHƯƠNG TRÌNH KHUNG (Chuẩn logic từ mng_frameworkprogram.jsx)
    const fetchCurriculumSemesters = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;

            // Cố gắng lấy Năm học (Khóa) của sinh viên từ Local Storage để ghép mã. 
            // Nếu không có, tạm mặc định là 2026.
            const userStr = await AsyncStorage.getItem('user');
            let courseYear = '2026';
            if (userStr) {
                const user = JSON.parse(userStr);
                // Lấy năm học từ profile (nếu có) hoặc bóc tách từ tên lớp (VD: KTPM2026 -> 2026)
                courseYear = user.courseYear || user.year || (user.class ? user.class.match(/\d{4}/)?.[0] : '2026') || '2026';
            }

            const response = await fetch(`${API_URL}/curriculum`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            // Xử lý dữ liệu trả về theo đúng chuẩn mng_frameworkprogram.jsx
            let rawSemesters = [];
            if (Array.isArray(data)) rawSemesters = data;
            else if (data && Array.isArray(data.data)) rawSemesters = data.data;
            else if (data && Array.isArray(data.semesters)) rawSemesters = data.semesters;
            else if (data && data.curriculum && Array.isArray(data.curriculum)) rawSemesters = data.curriculum;

            if (rawSemesters.length > 0) {
                // Sắp xếp học kỳ tăng dần 1, 2, 3...
                const sorted = rawSemesters.sort((a: any, b: any) => a.semesterNumber - b.semesterNumber);

                // Format lại mảng Options cho Dropdown
                const options: SemesterOption[] = sorted.map((sem: any) => ({
                    label: `Học kỳ ${sem.semesterNumber}`, // Hiện lên màn hình
                    value: `HK${sem.semesterNumber}-${courseYear}` // Gửi ngầm xuống API
                }));

                setSemesterOptions(options);
                setCurrentSemester(options[0]); // Mặc định chọn học kỳ 1
            }
        } catch (error) {
            console.error("Lỗi tải chương trình khung:", error);
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
                setGrades([]); // Nếu không có điểm, set về mảng rỗng
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
            return <View style={[styles.statusBadge, { backgroundColor: '#F3F4F6' }]}><Text style={{ color: '#6B7280', fontSize: 12, fontWeight: '600' }}>Chưa có</Text></View>;
        }
        if (score >= 5) {
            return <View style={[styles.statusBadge, { backgroundColor: '#D1FAE5' }]}><Text style={{ color: '#065F46', fontSize: 12, fontWeight: '600' }}>Đạt</Text></View>;
        }
        return <View style={[styles.statusBadge, { backgroundColor: '#FEE2E2' }]}><Text style={{ color: '#991B1B', fontSize: 12, fontWeight: '600' }}>Chưa đạt</Text></View>;
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Kết quả học tập</Text>
                <View style={{ width: 24 }} />
            </View>

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

                {showSemesterList && semesterOptions.length > 0 && (
                    <View style={styles.semesterDropdownList}>
                        {semesterOptions.map((sem, idx) => (
                            <TouchableOpacity
                                key={idx}
                                style={[styles.semesterItem, currentSemester?.value === sem.value ? { backgroundColor: '#EFF6FF' } : undefined]}
                                onPress={() => {
                                    setCurrentSemester(sem);
                                    setShowSemesterList(false);
                                }}
                            >
                                <Text style={[styles.semesterItemText, currentSemester?.value === sem.value ? { color: '#2563EB', fontWeight: '700' } : undefined]}>
                                    {sem.label}
                                </Text>
                                {currentSemester?.value === sem.value && <Ionicons name="checkmark" size={18} color="#2563EB" />}
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>

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

            <View style={styles.listContainer}>
                {loading ? (
                    <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 40 }} />
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
                                        <Text style={styles.courseCode}>{item.course?.courseCode} • {item.course?.credits} tín chỉ</Text>
                                    </View>
                                    {renderScoreStatus(item.finalScore)}
                                </View>

                                <View style={styles.gradeDivider} />

                                <View style={styles.scoresRow}>
                                    <View style={styles.scoreBox}>
                                        <Text style={styles.scoreLabel}>Điểm Giữa kỳ</Text>
                                        <Text style={styles.scoreNumber}>{item.midtermScore ?? '-'}</Text>
                                    </View>
                                    <View style={styles.scoreBox}>
                                        <Text style={styles.scoreLabel}>Điểm Cuối kỳ</Text>
                                        <Text style={[styles.scoreNumber, { color: '#2563EB' }]}>{item.finalScore ?? '-'}</Text>
                                    </View>
                                </View>
                            </View>
                        )}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Ionicons name="document-text-outline" size={60} color="#D1D5DB" />
                                <Text style={styles.emptyText}>Chưa có dữ liệu điểm cho {currentSemester?.label?.toLowerCase() || 'học kỳ này'}.</Text>
                            </View>
                        }
                    />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    header: { backgroundColor: '#2563EB', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 55, paddingBottom: 20, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
    backButton: { padding: 5 },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

    filterSection: { padding: 16, marginTop: -10, zIndex: 50 },
    sectionLabel: { fontSize: 11, fontWeight: '700', color: '#4B5563', marginBottom: 6, letterSpacing: 0.5 },
    dropdownBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, height: 48, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
    icon: { marginRight: 10 },
    dropdownText: { flex: 1, fontSize: 15, color: '#1F2937', fontWeight: '500' },

    semesterDropdownList: { position: 'absolute', top: 85, left: 16, right: 16, backgroundColor: '#fff', borderRadius: 12, marginTop: 4, paddingVertical: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 5, borderWidth: 1, borderColor: '#E5E7EB', zIndex: 900 },
    semesterItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
    semesterItemText: { fontSize: 15, color: '#4B5563' },

    summaryCard: { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 16, paddingVertical: 16, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 3 },
    summaryItem: { flex: 1, alignItems: 'center' },
    summaryLabel: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
    summaryValue: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
    summaryDivider: { width: 1, backgroundColor: '#E5E7EB', marginVertical: 4 },

    listContainer: { flex: 1, paddingHorizontal: 16 },
    gradeCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    gradeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    courseName: { fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 4 },
    courseCode: { fontSize: 13, color: '#6B7280' },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },

    gradeDivider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 },
    scoresRow: { flexDirection: 'row', justifyContent: 'space-around' },
    scoreBox: { alignItems: 'center' },
    scoreLabel: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
    scoreNumber: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },

    emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
    emptyText: { marginTop: 12, fontSize: 14, color: '#6B7280' }
});