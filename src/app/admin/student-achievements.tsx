import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { API_URL } from '../../config/api';

export default function StudentAchievements() {
    const [modalVisible, setModalVisible] = useState(false);

    // Lưu trữ dữ liệu gốc
    const [allRawStudents, setAllRawStudents] = useState<any[]>([]);
    const [coursesList, setCoursesList] = useState<any[]>([]);

    // Dữ liệu hiển thị
    const [studentsData, setStudentsData] = useState<any[]>([]);
    const [filteredData, setFilteredData] = useState<any[]>([]);

    // Bộ lọc chính
    const [activeCourse, setActiveCourse] = useState<any>(null);
    const [currentSemester, setCurrentSemester] = useState('Học kỳ 1 - 2026');

    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');

    const [showMainCourseList, setShowMainCourseList] = useState(false);
    const [showSemesterList, setShowSemesterList] = useState(false);

    const [selectedStudent, setSelectedStudent] = useState<any>(null);

    // TÁCH 2 STATE CHO GIỮA KỲ VÀ CUỐI KỲ
    const [midtermScore, setMidtermScore] = useState('');
    const [finalScore, setFinalScore] = useState('');

    const semesterOptions = ['Học kỳ 1 - 2026', 'Học kỳ 2 - 2026'];

    useEffect(() => {
        loadInitialBaseData();
    }, []);

    useEffect(() => {
        if (allRawStudents.length > 0 && activeCourse) {
            loadGradesAndMerge();
        }
    }, [currentSemester, activeCourse, allRawStudents]);

    useEffect(() => {
        if (!searchText.trim()) {
            setFilteredData(studentsData);
        } else {
            const lowercasedFilter = searchText.toLowerCase();
            const filtered = studentsData.filter(item => {
                const studentId = item.student?.studentId?.toLowerCase() || '';
                const fullName = item.student?.fullName?.toLowerCase() || '';
                return studentId.includes(lowercasedFilter) || fullName.includes(lowercasedFilter);
            });
            setFilteredData(filtered);
        }
    }, [searchText, studentsData]);

    const loadInitialBaseData = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;

            const [studentsRes, coursesRes] = await Promise.all([
                fetch(`${API_URL}/auth/students`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_URL}/courses`, { headers: { Authorization: `Bearer ${token}` } })
            ]);

            const studentsData = await studentsRes.json();
            const coursesData = await coursesRes.json();

            if (studentsData.success && studentsData.students) {
                setAllRawStudents(studentsData.students);
            }

            if (coursesData.success && coursesData.data) {
                const normalizedCourses = coursesData.data.map((c: any) => ({
                    ...c,
                    _safeCode: c.courseCode || c.code || c._id,
                    _safeName: c.courseName || c.name || 'Môn không tên',
                    _safeCredits: c.credits || 3
                })).filter((c: any) => c._safeCode);

                setCoursesList(normalizedCourses);
                if (normalizedCourses.length > 0) {
                    setActiveCourse(normalizedCourses[0]);
                }
            }
        } catch (error) {
            console.error("Lỗi lấy dữ liệu gốc:", error);
            Alert.alert("Lỗi", "Không thể tải danh sách sinh viên & môn học gốc");
        } finally {
            setLoading(false);
        }
    };

    const loadGradesAndMerge = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            const semesterCode = currentSemester === 'Học kỳ 1 - 2026' ? 'HK1-2026' : 'HK2-2026';

            const res = await fetch(`${API_URL}/grades/admin?semester=${semesterCode}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const gradesResult = await res.json();
            const rawGrades = gradesResult.success ? (gradesResult.data || []) : [];

            const processedStudents = allRawStudents.map((student: any) => {
                const foundGrade = rawGrades.find((g: any) =>
                    g.student?.studentId === student.studentId &&
                    g.course?.courseCode === activeCourse._safeCode
                );

                if (foundGrade) {
                    return { ...foundGrade, student: student };
                } else {
                    return {
                        _id: `empty_${student._id}_${activeCourse._safeCode}`,
                        student: student,
                        course: {
                            courseCode: activeCourse._safeCode,
                            courseName: activeCourse._safeName,
                            credits: activeCourse._safeCredits
                        },
                        midtermScore: null,
                        finalScore: null,
                        semester: semesterCode
                    };
                }
            });

            setStudentsData(processedStudents);
            setFilteredData(processedStudents);
        } catch (error) {
            console.error("Lỗi trộn dữ liệu điểm:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRowClick = (item: any) => {
        setSelectedStudent(item.student);
        // Nạp cả 2 điểm vào Modal
        setMidtermScore(item.midtermScore != null ? item.midtermScore.toString() : '');
        setFinalScore(item.finalScore != null ? item.finalScore.toString() : '');
        setModalVisible(true);
    };

    const handleSaveGrade = async () => {
        if (!selectedStudent || !activeCourse) {
            Alert.alert("Thiếu thông tin", "Dữ liệu môn học hoặc sinh viên bị trống!");
            return;
        }

        // Kiểm tra hợp lệ điểm Giữa kỳ
        let mScore: number | null = null;
        if (midtermScore.trim() !== '') {
            mScore = Number(midtermScore);
            if (isNaN(mScore) || mScore < 0 || mScore > 10) {
                Alert.alert("Lỗi nhập liệu", "Điểm GIỮA KỲ phải từ 0 đến 10");
                return;
            }
        }

        // Kiểm tra hợp lệ điểm Cuối kỳ
        let fScore: number | null = null;
        if (finalScore.trim() !== '') {
            fScore = Number(finalScore);
            if (isNaN(fScore) || fScore < 0 || fScore > 10) {
                Alert.alert("Lỗi nhập liệu", "Điểm CUỐI KỲ phải từ 0 đến 10");
                return;
            }
        }

        try {
            const token = await AsyncStorage.getItem('token');
            const semesterCode = currentSemester === 'Học kỳ 1 - 2026' ? 'HK1-2026' : 'HK2-2026';

            const payload = {
                studentCode: selectedStudent.studentId,
                courseCode: activeCourse._safeCode,
                semester: semesterCode,
                midtermScore: mScore,
                finalScore: fScore
            };

            const response = await fetch(`${API_URL}/grades/admin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (result.success) {
                Alert.alert("Thành công", `Đã lưu điểm cho sinh viên ${selectedStudent.fullName}!`);
                setModalVisible(false);
                loadGradesAndMerge();
            } else {
                Alert.alert("Lỗi Backend", result.message);
            }
        } catch (error) {
            Alert.alert("Lỗi", "Có lỗi xảy ra khi gửi điểm lên server.");
        }
    };

    const renderScoreBadge = (item: any) => {
        // Ưu tiên hiển thị badge theo điểm Cuối kỳ (vì nó quyết định đậu/rớt)
        const score = item.finalScore;
        if (score === null || score === undefined) {
            return <View style={[styles.scoreBadge, { backgroundColor: '#F3F4F6' }]}><Text style={[styles.scoreText, { color: '#6B7280' }]}>Chưa có CK</Text></View>;
        }
        if (score >= 8) return <View style={[styles.scoreBadge, { backgroundColor: '#D1FAE5' }]}><Text style={[styles.scoreText, { color: '#065F46' }]}>{score}</Text></View>;
        if (score >= 5) return <View style={[styles.scoreBadge, { backgroundColor: '#DBEAFE' }]}><Text style={[styles.scoreText, { color: '#1E40AF' }]}>{score}</Text></View>;
        return <View style={[styles.scoreBadge, { backgroundColor: '#FEE2E2' }]}><Text style={[styles.scoreText, { color: '#991B1B' }]}>{score}</Text></View>;
    };

    return (
        <View style={styles.container}>
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Quản lý Thành tích</Text>
                <TouchableOpacity style={styles.settingsBtn}>
                    <Ionicons name="settings-outline" size={22} color="#fff" />
                </TouchableOpacity>
            </View>

            <View style={styles.filterSection}>
                {/* BƯỚC 1: CHỌN MÔN HỌC */}
                <Text style={styles.sectionLabel}>BƯỚC 1: CHỌN MÔN HỌC</Text>
                <TouchableOpacity style={styles.dropdownBox} onPress={() => { setShowMainCourseList(!showMainCourseList); setShowSemesterList(false); }}>
                    <Ionicons name="book-outline" size={20} color="#2563EB" style={styles.searchIcon} />
                    <Text style={styles.dropdownText}>{activeCourse ? activeCourse._safeName : 'Đang tải môn học...'}</Text>
                    <Ionicons name={showMainCourseList ? "chevron-up" : "chevron-down"} size={20} color="#6B7280" />
                </TouchableOpacity>

                {showMainCourseList && (
                    <View style={styles.mainCourseDropdownList}>
                        <FlatList
                            data={coursesList}
                            keyExtractor={(item, index) => item._safeCode || index.toString()}
                            style={{ maxHeight: 180 }}
                            nestedScrollEnabled={true}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[styles.semesterItem, activeCourse?._safeCode === item._safeCode && { backgroundColor: '#EFF6FF' }]}
                                    onPress={() => {
                                        setActiveCourse(item);
                                        setShowMainCourseList(false);
                                    }}
                                >
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.semesterItemText, activeCourse?._safeCode === item._safeCode && { color: '#2563EB', fontWeight: '700' }]}>{item._safeName}</Text>
                                        <Text style={{ fontSize: 12, color: '#6B7280' }}>{item._safeCode} • {item._safeCredits} tín chỉ</Text>
                                    </View>
                                    {activeCourse?._safeCode === item._safeCode && <Ionicons name="checkmark" size={18} color="#2563EB" />}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                )}

                {/* BƯỚC 2: CHỌN HỌC KỲ */}
                <Text style={[styles.sectionLabel, { marginTop: 12 }]}>BƯỚC 2: CHỌN HỌC KỲ</Text>
                <TouchableOpacity style={styles.dropdownBox} onPress={() => { setShowSemesterList(!showSemesterList); setShowMainCourseList(false); }}>
                    <Ionicons name="calendar-outline" size={20} color="#2563EB" style={styles.searchIcon} />
                    <Text style={styles.dropdownText}>{currentSemester}</Text>
                    <Ionicons name={showSemesterList ? "chevron-up" : "chevron-down"} size={20} color="#6B7280" />
                </TouchableOpacity>

                {showSemesterList && (
                    <View style={styles.semesterDropdownList}>
                        {semesterOptions.map((sem, idx) => (
                            <TouchableOpacity
                                key={idx}
                                style={[styles.semesterItem, currentSemester === sem && { backgroundColor: '#EFF6FF' }]}
                                onPress={() => {
                                    setCurrentSemester(sem);
                                    setShowSemesterList(false);
                                }}
                            >
                                <Text style={[styles.semesterItemText, currentSemester === sem && { color: '#2563EB', fontWeight: '700' }]}>{sem}</Text>
                                {currentSemester === sem && <Ionicons name="checkmark" size={18} color="#2563EB" />}
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* BƯỚC 3: TÌM KIẾM */}
                <Text style={[styles.sectionLabel, { marginTop: 12 }]}>BƯỚC 3: LỌC DANH SÁCH SINH VIÊN</Text>
                <View style={styles.searchBox}>
                    <Ionicons name="search-outline" size={20} color="#9CA3AF" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Nhập mã sinh viên hoặc họ tên..."
                        placeholderTextColor="#9CA3AF"
                        value={searchText}
                        onChangeText={setSearchText}
                    />
                </View>
            </View>

            {/* DANH SÁCH SINH VIÊN */}
            <View style={styles.listContainer}>
                {loading ? (
                    <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 30 }} />
                ) : (
                    <FlatList
                        data={filteredData}
                        keyExtractor={(item, index) => item._id || index.toString()}
                        contentContainerStyle={{ paddingBottom: 20 }}
                        renderItem={({ item }) => (
                            <TouchableOpacity style={styles.studentCard} onPress={() => handleRowClick(item)} activeOpacity={0.7}>
                                <View style={styles.cardHeader}>
                                    <View style={styles.avatarPlaceholder}>
                                        <Text style={styles.avatarText}>{item.student?.fullName?.charAt(0) || 'S'}</Text>
                                    </View>
                                    <View style={styles.cardInfo}>
                                        <Text style={styles.studentName} numberOfLines={1}>{item.student?.fullName || 'Chưa rõ tên'}</Text>
                                        <Text style={styles.studentId}>MSSV: {item.student?.studentId || 'N/A'}</Text>
                                        <Text style={styles.scoreDetailsText}>
                                            GK: <Text style={{ fontWeight: 'bold' }}>{item.midtermScore ?? '-'}</Text>  |  CK: <Text style={{ fontWeight: 'bold' }}>{item.finalScore ?? '-'}</Text>
                                        </Text>
                                    </View>
                                    {renderScoreBadge(item)}
                                </View>
                            </TouchableOpacity>
                        )}
                        ListEmptyComponent={<Text style={styles.emptyText}>Không tìm thấy dữ liệu sinh viên phù hợp!</Text>}
                    />
                )}
            </View>

            {/* BOTTOM SHEET NHẬP ĐIỂM */}
            <Modal visible={modalVisible} transparent={true} animationType="slide">
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
                    <TouchableOpacity style={styles.modalContent} activeOpacity={1} onPress={() => { }}>
                        <View style={styles.dragHandle} />
                        <Text style={styles.modalTitle}>Nhập / Cập nhật điểm số</Text>
                        <Text style={styles.studentSubtitle}>{selectedStudent?.fullName} - {selectedStudent?.studentId}</Text>

                        <Text style={styles.label}>MÔN HỌC (ĐÃ KHÓA)</Text>
                        <View style={[styles.courseSelect, { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' }]}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.courseText, { color: '#374151', fontWeight: '700' }]}>
                                    {activeCourse ? activeCourse._safeName : ''}
                                </Text>
                            </View>
                            <Ionicons name="lock-closed-outline" size={18} color="#9CA3AF" />
                        </View>

                        {/* HÀNG NHẬP ĐIỂM GK & CK */}
                        <View style={styles.scoreInputRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.label}>GIỮA KỲ (Hệ 10)</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Ví dụ: 8.0"
                                    placeholderTextColor="#9CA3AF"
                                    keyboardType="numeric"
                                    value={midtermScore}
                                    onChangeText={setMidtermScore}
                                />
                            </View>
                            <View style={{ width: 16 }} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.label}>CUỐI KỲ (Hệ 10)</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Ví dụ: 9.5"
                                    placeholderTextColor="#9CA3AF"
                                    keyboardType="numeric"
                                    value={finalScore}
                                    onChangeText={setFinalScore}
                                />
                            </View>
                        </View>

                        <TouchableOpacity style={styles.btnSave} onPress={handleSaveGrade}>
                            <Ionicons name="save-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                            <Text style={styles.btnSaveText}>Xác nhận & Lưu điểm</Text>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

// ... styles 
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    header: { backgroundColor: '#2563EB', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 55, paddingBottom: 20, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
    backButton: { padding: 5 },
    settingsBtn: { padding: 5, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8 },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

    filterSection: { padding: 16, marginTop: -10, zIndex: 50 },
    sectionLabel: { fontSize: 11, fontWeight: '700', color: '#4B5563', marginBottom: 6, marginTop: 4, letterSpacing: 0.5 },
    searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, height: 48, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
    searchIcon: { marginRight: 10 },
    searchInput: { flex: 1, fontSize: 15, color: '#1F2937' },
    dropdownBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, height: 48, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
    dropdownText: { flex: 1, fontSize: 15, color: '#1F2937', fontWeight: '500' },

    mainCourseDropdownList: { backgroundColor: '#fff', borderRadius: 12, marginTop: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 5, borderWidth: 1, borderColor: '#E5E7EB', zIndex: 1000 },
    semesterDropdownList: { backgroundColor: '#fff', borderRadius: 12, marginTop: 4, paddingVertical: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 5, borderWidth: 1, borderColor: '#E5E7EB', zIndex: 900 },
    semesterItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
    semesterItemText: { fontSize: 15, color: '#4B5563' },

    listContainer: { flex: 1, paddingHorizontal: 16, zIndex: 10 },
    studentCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 3 },
    cardHeader: { flexDirection: 'row', alignItems: 'center' },
    avatarPlaceholder: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    avatarText: { fontSize: 18, fontWeight: 'bold', color: '#2563EB' },
    cardInfo: { flex: 1 },
    studentName: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 2 },
    studentId: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
    scoreDetailsText: { fontSize: 12, color: '#4B5563', marginTop: 4, backgroundColor: '#F3F4F6', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },

    scoreBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    scoreText: { fontSize: 15, fontWeight: 'bold' },
    emptyText: { textAlign: 'center', marginTop: 30, color: '#6B7280', fontSize: 15, padding: 10 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
    dragHandle: { width: 48, height: 5, backgroundColor: '#E5E7EB', borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827', textAlign: 'center' },
    studentSubtitle: { fontSize: 15, color: '#6B7280', textAlign: 'center', marginBottom: 24, marginTop: 4 },
    label: { fontSize: 12, fontWeight: '700', color: '#6B7280', marginBottom: 8, letterSpacing: 0.5 },
    courseSelect: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderRadius: 12, padding: 16, marginBottom: 20 },
    courseText: { fontSize: 15, color: '#1F2937', fontWeight: '500' },

    scoreInputRow: { flexDirection: 'row', marginBottom: 30 },
    input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 16, fontSize: 16, color: '#1F2937', fontWeight: '500' },

    btnSave: { backgroundColor: '#2563EB', paddingVertical: 16, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: "#2563EB", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
    btnSaveText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});