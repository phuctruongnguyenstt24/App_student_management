import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL } from '../../config/api';

export default function StudentAchievements() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [submittingId, setSubmittingId] = useState<string | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

    const [allRawStudents, setAllRawStudents] = useState<any[]>([]);
    const [faculties, setFaculties] = useState<any[]>([]);
    const [selectedFaculty, setSelectedFaculty] = useState<any>(null);
    const [departments, setDepartments] = useState<any[]>([]);
    const [selectedDepartment, setSelectedDepartment] = useState<any>(null);

    const yearOptions = ['2023', '2024', '2025', '2026'];
    const [selectedYear, setSelectedYear] = useState<string | null>(null);

    const [curriculumList, setCurriculumList] = useState<any[]>([]);
    const [selectedSemester, setSelectedSemester] = useState<any>(null);

    const [selectedCourse, setSelectedCourse] = useState<any>(null);
    const [selectedClass, setSelectedClass] = useState<string | null>(null);

    const [activeFilter, setActiveFilter] = useState<string | null>(null);

    const [studentsData, setStudentsData] = useState<any[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [midtermScore, setMidtermScore] = useState('');
    const [finalScore, setFinalScore] = useState('');

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;

            const [facultiesRes, studentsRes, curriculumRes] = await Promise.all([
                fetch(`${API_URL}/faculties`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_URL}/students/all`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_URL}/curriculum`, { headers: { Authorization: `Bearer ${token}` } })
            ]);

            const facData = await facultiesRes.json();
            const stdData = await studentsRes.json();
            const curData = await curriculumRes.json();

            if (facData.success) setFaculties(facData.faculties || []);
            if (stdData.success) setAllRawStudents(stdData.students || []);

            let semesterList = [];
            if (Array.isArray(curData)) semesterList = curData;
            else if (curData && Array.isArray(curData.data)) semesterList = curData.data;
            else if (curData && Array.isArray(curData.semesters)) semesterList = curData.semesters;
            if (semesterList.length > 0) {
                setCurriculumList(semesterList.sort((a: any, b: any) => a.semesterNumber - b.semesterNumber));
            }
        } catch (error) {
            Alert.alert("Lỗi", "Không thể tải dữ liệu nền.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchDepartments = async () => {
            if (!selectedFaculty) return;
            try {
                const token = await AsyncStorage.getItem('token');
                const res = await fetch(`${API_URL}/departments/faculty/${selectedFaculty._id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.success) setDepartments(data.departments || []);
            } catch (error) {
                console.error("Lỗi lấy Ngành:", error);
            }
        };
        fetchDepartments();
    }, [selectedFaculty]);

    const availableClasses = useMemo(() => {
        if (!selectedDepartment) return [];
        const baseStudents = allRawStudents.filter(s => s.departmentId === selectedDepartment._id);
        const classSet = new Set(baseStudents.map(s => s.class).filter(c => c && c.trim() !== ''));
        return Array.from(classSet).sort();
    }, [allRawStudents, selectedDepartment]);

    useEffect(() => {
        if (selectedFaculty && selectedDepartment && selectedYear && selectedSemester && selectedCourse && selectedClass) {
            loadGradesAndMerge();
        } else {
            setStudentsData([]);
        }
    }, [selectedFaculty, selectedDepartment, selectedYear, selectedSemester, selectedCourse, selectedClass, allRawStudents]);

    // ==========================================
    // TRỘN ĐIỂM CỰC MẠNH (Đã nâng cấp)
    // ==========================================
    const loadGradesAndMerge = async () => {
        setLoading(true);
        try {
            const targetStudents = allRawStudents.filter(student => student.class === selectedClass);
            if (targetStudents.length === 0) {
                setStudentsData([]);
                setLoading(false);
                return;
            }

            const token = await AsyncStorage.getItem('token');
            const semesterCode = `HK${selectedSemester.semesterNumber}-${selectedYear}`;

            const res = await fetch(`${API_URL}/grades/admin?semester=${semesterCode}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const gradesResult = await res.json();
            const rawGrades = gradesResult.success ? (gradesResult.data || []) : [];

            const processedStudents = targetStudents.map((student: any) => {
                // So khớp đa điều kiện để không bao giờ miss điểm
                const foundGrade = rawGrades.find((g: any) =>
                    (g.student?.studentId === student.studentId || g.student?._id === student._id) &&
                    (g.course?.courseCode === selectedCourse.code || g.course?.code === selectedCourse.code || g.courseCode === selectedCourse.code)
                );

                if (foundGrade) return { ...foundGrade, student: student };
                return {
                    _id: `empty_${student._id}_${selectedCourse.code}`,
                    student: student,
                    course: { courseCode: selectedCourse.code, courseName: selectedCourse.name },
                    midtermScore: null,
                    finalScore: null,
                    semester: semesterCode
                };
            });

            setStudentsData(processedStudents);
        } catch (error) {
            console.error("Lỗi trộn điểm:", error);
        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    // 5. LƯU ĐIỂM (Đã nâng cấp Fix UI Tức thì)
    // ==========================================
    const handleSaveGrade = async () => {
        if (!selectedStudent || !selectedCourse || !selectedSemester || !selectedYear) return;

        let mScore = midtermScore.trim() !== '' ? Number(midtermScore) : null;
        let fScore = finalScore.trim() !== '' ? Number(finalScore) : null;

        if ((mScore !== null && (isNaN(mScore) || mScore < 0 || mScore > 10)) ||
            (fScore !== null && (isNaN(fScore) || fScore < 0 || fScore > 10))) {
            Alert.alert("Lỗi nhập liệu", "Điểm hệ 10 phải từ 0 đến 10");
            return;
        }

        const finalCourseCode = (selectedCourse.code || selectedCourse.courseCode || selectedCourse._id || '').toString().trim();

        // 🛑 CHỐT CHẶN: Chặn mã môn ảo tự sinh (M17...)
        if (finalCourseCode.startsWith('M1') && finalCourseCode.length > 10) {
            Alert.alert(
                "Lỗi Mã Môn Học",
                "Môn học này đang sử dụng mã tạm thời. Vui lòng vào mục 'Chương trình khung' bấm 'Đồng bộ' môn học chuẩn trước khi nhập điểm."
            );
            return;
        }

        try {
            setSubmittingId(selectedStudent.studentId);
            const token = await AsyncStorage.getItem('token');
            const semesterCode = `HK${selectedSemester.semesterNumber}-${selectedYear}`;

            const payload = {
                studentCode: selectedStudent.studentId,
                courseCode: finalCourseCode,
                semester: semesterCode,
                midtermScore: mScore,
                finalScore: fScore
            };

            // 👉 CẬP NHẬT GIAO DIỆN NGAY LẬP TỨC (Optimistic UI)
            setStudentsData(prevData => prevData.map(item => {
                if (item.student?.studentId === selectedStudent.studentId) {
                    return { ...item, midtermScore: mScore, finalScore: fScore };
                }
                return item;
            }));

            const res = await fetch(`${API_URL}/grades/admin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload)
            });
            const result = await res.json();

            if (result.success || res.ok) {
                Alert.alert("Thành công", `Đã lưu điểm cho ${selectedStudent.fullName}!`);
                setModalVisible(false);
                // Không cần gọi loadGradesAndMerge() ở đây nữa vì UI đã cập nhật ngay ở trên rồi
            } else {
                Alert.alert("Lỗi Backend", result.message || "Không tìm thấy mã môn học");
                loadGradesAndMerge(); // Nếu lỗi thì load lại điểm cũ để undo cái cập nhật ảo ở trên
            }
        } catch (error) {
            Alert.alert("Lỗi", "Không thể lưu điểm. Vui lòng kiểm tra mạng.");
            loadGradesAndMerge(); // Phục hồi lại dữ liệu cũ nếu rớt mạng
        } finally {
            setSubmittingId(null);
        }
    };

    const renderFilterModal = () => {
        let data: any[] = [];
        let title = '';
        let renderItem = (item: any) => '';
        let onSelect = (item: any) => { };
        let isSelected = (item: any) => false;

        switch (activeFilter) {
            case 'faculty':
                title = 'Chọn Khoa';
                data = faculties;
                renderItem = (item) => item.name;
                isSelected = (item) => selectedFaculty?._id === item._id;
                onSelect = (item) => { setSelectedFaculty(item); setSelectedDepartment(null); setSelectedClass(null); };
                break;
            case 'department':
                title = 'Chọn Ngành';
                data = departments;
                renderItem = (item) => item.name;
                isSelected = (item) => selectedDepartment?._id === item._id;
                onSelect = (item) => { setSelectedDepartment(item); setSelectedClass(null); };
                break;
            case 'year':
                title = 'Chọn Năm (Khóa)';
                data = yearOptions;
                renderItem = (item) => item;
                isSelected = (item) => selectedYear === item;
                onSelect = (item) => { setSelectedYear(item); setSelectedClass(null); };
                break;
            case 'semester':
                title = 'Chọn Học kỳ (Chương trình khung)';
                data = curriculumList;
                renderItem = (item) => `Học kỳ ${item.semesterNumber}`;
                isSelected = (item) => selectedSemester?.semesterNumber === item.semesterNumber;
                onSelect = (item) => { setSelectedSemester(item); setSelectedCourse(null); };
                break;
            case 'course':
                title = 'Chọn Môn học';
                data = selectedSemester ? selectedSemester.subjects : [];
                renderItem = (item) => item.name;
                isSelected = (item) => selectedCourse?.code === item.code;
                onSelect = (item) => setSelectedCourse(item);
                break;
            case 'class':
                title = 'Chọn Lớp';
                data = availableClasses;
                renderItem = (item) => item;
                isSelected = (item) => selectedClass === item;
                onSelect = (item) => setSelectedClass(item);
                break;
            default:
                return null;
        }

        return (
            <Modal visible={activeFilter !== null} transparent={true} animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{title}</Text>
                        <FlatList
                            data={data}
                            keyExtractor={(item, idx) => item._id || item.code || item.toString() + idx}
                            renderItem={({ item }) => {
                                const active = isSelected(item);
                                return (
                                    <TouchableOpacity
                                        style={[styles.modalItem, active && styles.modalItemSelected]}
                                        onPress={() => { onSelect(item); setActiveFilter(null); }}
                                    >
                                        <Text style={[styles.modalItemText, active && styles.modalItemTextSelected]}>
                                            {renderItem(item)}
                                        </Text>
                                        {active && <Ionicons name="checkmark" size={20} color="#4CAF50" />}
                                    </TouchableOpacity>
                                );
                            }}
                            ListEmptyComponent={<Text style={styles.emptyText}>Không có dữ liệu</Text>}
                        />
                        <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setActiveFilter(null)}>
                            <Text style={styles.modalCloseText}>Đóng</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/admin/dashboard' as any)}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Nhập Điểm Học Phần</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* BỘ LỌC (Sử dụng cấu trúc Box gọn gàng) */}
            <View style={styles.filtersContainer}>
                <View style={styles.filterRow}>
                    <TouchableOpacity style={styles.filterBox} onPress={() => setActiveFilter('faculty')}>
                        <Text style={styles.filterLabel}>1. Khoa</Text>
                        <View style={styles.filterValueRow}>
                            <Text style={styles.filterValue} numberOfLines={1}>{selectedFaculty ? selectedFaculty.name : 'Chọn Khoa'}</Text>
                            <Ionicons name="chevron-down" size={16} color="#777" />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.filterBox, !selectedFaculty && styles.disabledBox]} onPress={() => selectedFaculty && setActiveFilter('department')}>
                        <Text style={styles.filterLabel}>2. Ngành</Text>
                        <View style={styles.filterValueRow}>
                            <Text style={styles.filterValue} numberOfLines={1}>{selectedDepartment ? selectedDepartment.name : 'Chọn Ngành'}</Text>
                            <Ionicons name="chevron-down" size={16} color="#777" />
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={styles.filterRow}>
                    <TouchableOpacity style={[styles.filterBox, !selectedDepartment && styles.disabledBox]} onPress={() => selectedDepartment && setActiveFilter('year')}>
                        <Text style={styles.filterLabel}>3. Năm (Khóa)</Text>
                        <View style={styles.filterValueRow}>
                            <Text style={styles.filterValue} numberOfLines={1}>{selectedYear ? selectedYear : 'Chọn Năm'}</Text>
                            <Ionicons name="chevron-down" size={16} color="#777" />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.filterBox, (!selectedYear || curriculumList.length === 0) && styles.disabledBox]} onPress={() => selectedYear && setActiveFilter('semester')}>
                        <Text style={styles.filterLabel}>4. Học kỳ</Text>
                        <View style={styles.filterValueRow}>
                            <Text style={styles.filterValue} numberOfLines={1}>{selectedSemester ? `Học kỳ ${selectedSemester.semesterNumber}` : 'Chọn HK'}</Text>
                            <Ionicons name="chevron-down" size={16} color="#777" />
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={styles.filterRow}>
                    <TouchableOpacity style={[styles.filterBox, !selectedSemester && styles.disabledBox]} onPress={() => selectedSemester && setActiveFilter('course')}>
                        <Text style={styles.filterLabel}>5. Môn học</Text>
                        <View style={styles.filterValueRow}>
                            <Text style={styles.filterValue} numberOfLines={1}>{selectedCourse ? selectedCourse.name : 'Chọn Môn'}</Text>
                            <Ionicons name="chevron-down" size={16} color="#777" />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.filterBox, (!selectedCourse || availableClasses.length === 0) && styles.disabledBox]} onPress={() => selectedCourse && setActiveFilter('class')}>
                        <Text style={styles.filterLabel}>6. Lớp</Text>
                        <View style={styles.filterValueRow}>
                            <Text style={styles.filterValue} numberOfLines={1}>{selectedClass ? selectedClass : 'Chọn Lớp'}</Text>
                            <Ionicons name="chevron-down" size={16} color="#777" />
                        </View>
                    </TouchableOpacity>
                </View>
            </View>

            {/* DANH SÁCH SINH VIÊN */}
            {loading ? (
                <ActivityIndicator size="large" color="#2563EB" style={{ flex: 1 }} />
            ) : (!selectedClass ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name="funnel-outline" size={60} color="#ccc" />
                    <Text style={styles.emptyText}>Hoàn thành 6 bước lọc để xem danh sách lớp</Text>
                </View>
            ) : (
                <FlatList
                    data={studentsData}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={{ padding: 16 }}
                    renderItem={({ item }) => (
                        <View style={styles.studentCard}>
                            <View style={{ flex: 1, paddingRight: 10 }}>
                                <Text style={styles.nameText}>{item.student?.fullName}</Text>
                                <Text style={styles.subText}>MSSV: {item.student?.studentId}</Text>
                                <Text style={styles.scoreDetailsText}>
                                    GK: <Text style={{ fontWeight: 'bold', color: '#111' }}>{item.midtermScore ?? '-'}</Text>  |
                                    CK: <Text style={{ fontWeight: 'bold', color: '#111' }}>{item.finalScore ?? '-'}</Text>
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={styles.btnInputScore}
                                onPress={() => {
                                    setSelectedStudent(item.student);
                                    setMidtermScore(item.midtermScore != null ? item.midtermScore.toString() : '');
                                    setFinalScore(item.finalScore != null ? item.finalScore.toString() : '');
                                    setModalVisible(true);
                                }}
                            >
                                <Ionicons name="pencil" size={20} color="#fff" />
                                <Text style={styles.btnInputScoreText}>Nhập</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    ListEmptyComponent={<Text style={styles.emptyText}>Lớp {selectedClass} chưa có sinh viên nào.</Text>}
                />
            ))}

            {/* MODAL LỌC CHUNG */}
            {renderFilterModal()}

            {/* MODAL NHẬP ĐIỂM (BOTTOM SHEET) */}
            <Modal visible={modalVisible} transparent={true} animationType="slide">
                <TouchableOpacity style={styles.modalOverlayBs} activeOpacity={1} onPress={() => setModalVisible(false)}>
                    <TouchableOpacity style={styles.modalContentBs} activeOpacity={1}>
                        <View style={styles.dragHandle} />
                        <Text style={styles.modalTitleBs}>Nhập / Cập nhật điểm số</Text>
                        <Text style={styles.studentSubtitle}>{selectedStudent?.fullName} - {selectedStudent?.studentId}</Text>

                        <View style={styles.courseSelect}>
                            <Text style={styles.courseText}>{selectedCourse?.name}</Text>
                            <Ionicons name="lock-closed-outline" size={18} color="#9CA3AF" />
                        </View>

                        <View style={styles.scoreInputRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.labelBs}>GIỮA KỲ (Hệ 10)</Text>
                                <TextInput style={styles.inputBs} keyboardType="numeric" placeholder="VD: 8.5" value={midtermScore} onChangeText={setMidtermScore} />
                            </View>
                            <View style={{ width: 16 }} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.labelBs}>CUỐI KỲ (Hệ 10)</Text>
                                <TextInput style={styles.inputBs} keyboardType="numeric" placeholder="VD: 9.0" value={finalScore} onChangeText={setFinalScore} />
                            </View>
                        </View>

                        <TouchableOpacity style={styles.btnSaveBs} onPress={handleSaveGrade} disabled={submittingId !== null}>
                            {submittingId ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Ionicons name="save-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                                    <Text style={styles.btnSaveTextBs}>Xác nhận & Lưu điểm</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
}


const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f4f6f9' },
    header: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', alignItems: 'center', elevation: 2 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111' },

    filtersContainer: { padding: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0', marginBottom: 8 },
    filterRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    filterBox: { flex: 1, backgroundColor: '#f8f9fa', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#dcdfe3', marginHorizontal: 4 },
    disabledBox: { backgroundColor: '#eef0f2', opacity: 0.6 },
    filterLabel: { fontSize: 11, color: '#666', fontWeight: 'bold', marginBottom: 4, textTransform: 'uppercase' },
    filterValueRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    filterValue: { fontSize: 14, color: '#333', fontWeight: '600', flex: 1 },

    // Modal dùng chung
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '85%', backgroundColor: '#fff', borderRadius: 12, padding: 20, maxHeight: '70%' },
    modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center', color: '#111' },
    modalItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#eee' },
    modalItemSelected: { backgroundColor: '#e8f5e9' },
    modalItemText: { fontSize: 15, color: '#333' },
    modalItemTextSelected: { color: '#4CAF50', fontWeight: 'bold' },
    modalCloseBtn: { marginTop: 20, padding: 12, backgroundColor: '#f0f0f0', borderRadius: 8, alignItems: 'center' },
    modalCloseText: { fontSize: 16, fontWeight: '600', color: '#555' },

    // Danh sách thẻ sinh viên
    studentCard: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginHorizontal: 16, marginBottom: 12, elevation: 2, alignItems: 'center' },
    nameText: { fontSize: 16, fontWeight: 'bold', color: '#222' },
    subText: { fontSize: 13, color: '#666', marginTop: 4 },
    scoreDetailsText: { fontSize: 12, color: '#555', marginTop: 8, backgroundColor: '#f0f4f8', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
    btnInputScore: { flexDirection: 'row', backgroundColor: '#2563EB', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
    btnInputScoreText: { color: '#fff', fontWeight: 'bold', marginLeft: 6 },
    emptyText: { textAlign: 'center', marginTop: 16, color: '#888', fontSize: 14 },

    // Modal Bottom Sheet (Nhập điểm)
    modalOverlayBs: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContentBs: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
    dragHandle: { width: 40, height: 5, backgroundColor: '#ccc', borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
    modalTitleBs: { fontSize: 20, fontWeight: 'bold', color: '#111', textAlign: 'center' },
    studentSubtitle: { fontSize: 15, color: '#666', textAlign: 'center', marginBottom: 20, marginTop: 4 },
    courseSelect: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#f8f9fa', borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 12, padding: 16, marginBottom: 24 },
    courseText: { fontSize: 15, color: '#333', fontWeight: 'bold' },
    scoreInputRow: { flexDirection: 'row', marginBottom: 30 },
    labelBs: { fontSize: 12, fontWeight: 'bold', color: '#666', marginBottom: 8 },
    inputBs: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ccc', borderRadius: 10, padding: 14, fontSize: 16, color: '#111', fontWeight: 'bold' },
    btnSaveBs: { backgroundColor: '#2563EB', paddingVertical: 16, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    btnSaveTextBs: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});