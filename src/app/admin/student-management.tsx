// app/admin/student-management.tsx
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Modal,
    RefreshControl,
    ScrollView,
    TouchableOpacity,
    View
} from 'react-native';
import {
    ActivityIndicator,
    Button,
    Card,
    Chip,
    Searchbar,
    Text,
    TextInput
} from 'react-native-paper';
import { styles } from '../../a_styles/style_student_management';
import { API_URL } from '../../config/api';

// Types
interface Student {
    _id: string;
    fullName: string;
    studentId: string;
    email: string;
    facultyId: string;
    departmentId: string;
    class: string;
    phone: string;
    address: string;
    dateOfBirth: string;
    placeOfBirth: string;
    status: 'active' | 'inactive';
    createdAt: string;
    updatedAt: string;
    academicInfo?: {
        enrollmentDate: string;
        trainingLevel: string;
        trainingType: string;
        courseYear: string;
        base: string;
        profileCode: string;
    };
    personalInfo?: {
        ethnicity: string;
        religion: string;
        nationality: string;
        region: string;
        cccd: string;
        cccdIssueDate: string;
        cccdIssuePlace: string;
        object: string;
        policyType: string;
        unionJoinDate: string;
        partyJoinDate: string;
        permanentResidence: string;
        bankName: string;
        bankBranch: string;
        accountHolder: string;
        accountNumber: string;
    };
    familyInfo?: {
        father: {
            name: string;
            birthYear: string;
            occupation: string;
            nationality: string;
            ethnicity: string;
            religion: string;
            workplace: string;
            position: string;
            phone: string;
            permanentResidence: string;
            currentResidence: string;
        };
        mother: {
            name: string;
            birthYear: string;
            occupation: string;
            nationality: string;
            ethnicity: string;
            religion: string;
            workplace: string;
            position: string;
            phone: string;
            permanentResidence: string;
            currentResidence: string;
        };
    };
}

interface UpdateRequest {
    _id: string;
    studentId: string;
    studentName: string;
    fields: string[];
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
}

interface Faculty {
    _id: string;
    name: string;
    code: string;
}

interface Department {
    _id: string;
    name: string;
    code: string;
    facultyId: string;
}

type EditFormType = Partial<Student> & { courseYear?: string };

export default function StudentManagementScreen() {
    const [students, setStudents] = useState<Student[]>([]);
    const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
    const [faculties, setFaculties] = useState<Faculty[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [updateRequests, setUpdateRequests] = useState<UpdateRequest[]>([]);
    
    // State cho việc lọc Lớp & Khoa
    const [classes, setClasses] = useState<string[]>([]);
    const [selectedClass, setSelectedClass] = useState<string>('All');
    const [selectedFacultyFilter, setSelectedFacultyFilter] = useState<string | null>(null);
    
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [requestModalVisible, setRequestModalVisible] = useState(false);

    const [editForm, setEditForm] = useState<EditFormType>({});

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (faculties.length > 0 && !selectedFacultyFilter) {
            setSelectedFacultyFilter(String(faculties[0]._id));
        }
    }, [faculties]);

    useEffect(() => {
        filterData();
    }, [students, searchQuery, selectedClass]);

    const classesInSelectedFaculty = useMemo(() => {
        if (!selectedFacultyFilter) return [];
        const studentsInFaculty = students.filter(s => String(s.facultyId) === selectedFacultyFilter);
        const uniqueClasses = Array.from(new Set(studentsInFaculty.map(s => s.class))).filter(Boolean);
        return uniqueClasses.sort();
    }, [students, selectedFacultyFilter]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            await Promise.all([
                loadStudents(),
                loadClasses(),
                loadFaculties(),
                loadDepartments(),
                loadUpdateRequests(),
            ]);
        } catch (error) {
            console.error('Load data error:', error);
            Alert.alert('Lỗi', 'Không thể tải dữ liệu');
        } finally {
            setIsLoading(false);
        }
    };

    const loadStudents = async () => {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
            Alert.alert('Lỗi', 'Vui lòng đăng nhập lại');
            router.replace('/login');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/students/all`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            
            if (data.success) {
                setStudents(data.students || []);
            }
        } catch (error) {
            console.error('Load students error:', error);
            throw error;
        }
    };

    const loadClasses = async () => {
        const token = await AsyncStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch(`${API_URL}/students/classes`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            
            if (data.success) {
                setClasses(data.classes || []);
            }
        } catch (error) {
            console.error('Load classes error:', error);
        }
    };

    const loadFaculties = async () => {
        const token = await AsyncStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch(`${API_URL}/faculties`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();

            if (data.success) {
                setFaculties(data.faculties || []);
            }
        } catch (error) {
            console.error('Load faculties error:', error);
        }
    };

    const loadDepartments = async () => {
        const token = await AsyncStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch(`${API_URL}/departments`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (data.success) {
                setDepartments(data.departments || []);
            }
        } catch (error) {
            console.error('Load departments error:', error);
        }
    };

    const loadUpdateRequests = async () => {
        const token = await AsyncStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch(`${API_URL}/students/update-requests`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (data.success) {
                setUpdateRequests(data.requests || []);
            }
        } catch (error) {
            console.error('Load update requests error:', error);
        }
    };

    const filterData = () => {
        let result = students;

        if (selectedClass !== 'All') {
            result = result.filter((student) => student.class === selectedClass);
        }

        if (searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (student) =>
                    student.fullName.toLowerCase().includes(query) ||
                    student.studentId.toLowerCase().includes(query) ||
                    student.email.toLowerCase().includes(query)
            );
        }

        setFilteredStudents(result);
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
    };

    const getFacultyName = (facultyId: string) => {
        const faculty = faculties.find(f => String(f._id) === String(facultyId));
        return faculty?.name || 'N/A';
    };

    const getDepartmentName = (departmentId: string) => {
        if (!departmentId) return 'N/A';
        const department = departments.find(d => String(d._id) === String(departmentId));
        return department?.name || 'N/A';
    };

    const handleViewDetail = (student: Student) => {
        setSelectedStudent(student);
        setDetailModalVisible(true);
    };

    const handleEdit = (student: Student) => {
        setSelectedStudent(student);
        setEditForm({
            fullName: student.fullName,
            phone: student.phone,
            address: student.address,
            dateOfBirth: student.dateOfBirth,
            placeOfBirth: student.placeOfBirth,
            class: student.class,
            status: student.status,
            courseYear: student.academicInfo?.courseYear || '', 
        });
        setEditModalVisible(true);
    };

    const handleUpdateStudent = async () => {
        if (!selectedStudent) return;

        const token = await AsyncStorage.getItem('token');
        if (!token) {
            Alert.alert('Lỗi', 'Vui lòng đăng nhập lại');
            router.replace('/login');
            return;
        }

        try {
            const payload = {
                ...editForm,
                academicInfo: {
                    ...selectedStudent.academicInfo, 
                    courseYear: editForm.courseYear 
                }
            };

            const response = await fetch(`${API_URL}/students/${selectedStudent._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();
            if (data.success) {
                Alert.alert('Thành công', 'Cập nhật thông tin sinh viên thành công');
                setEditModalVisible(false);
                loadStudents();
                loadClasses(); 
            } else {
                Alert.alert('Thất bại', data.message || 'Không thể cập nhật');
            }
        } catch (error) {
            console.error('Update student error:', error);
            Alert.alert('Lỗi', 'Không thể kết nối đến server');
        }
    };

    const handleDeleteStudent = (student: Student) => {
        Alert.alert(
            'Xác nhận xóa',
            `Bạn có chắc muốn xóa sinh viên "${student.fullName}"?`,
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: async () => {
                        const token = await AsyncStorage.getItem('token');
                        if (!token) {
                            Alert.alert('Lỗi', 'Vui lòng đăng nhập lại');
                            router.replace('/login');
                            return;
                        }

                        try {
                            const response = await fetch(`${API_URL}/students/${student._id}`, {
                                method: 'DELETE',
                                headers: { Authorization: `Bearer ${token}` },
                            });

                            const data = await response.json();
                            if (data.success) {
                                Alert.alert('Thành công', 'Xóa sinh viên thành công');
                                loadStudents();
                                loadClasses();
                            } else {
                                Alert.alert('Thất bại', data.message || 'Không thể xóa');
                            }
                        } catch (error) {
                            console.error('Delete student error:', error);
                            Alert.alert('Lỗi', 'Không thể kết nối đến server');
                        }
                    },
                },
            ]
        );
    };

    const handleApproveRequest = async (request: UpdateRequest) => {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
            Alert.alert('Lỗi', 'Vui lòng đăng nhập lại');
            router.replace('/login');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/students/update-requests/${request._id}/approve`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await response.json();
            if (data.success) {
                Alert.alert('Thành công', 'Đã duyệt yêu cầu cập nhật');
                loadUpdateRequests();
                loadStudents();
                setRequestModalVisible(false);
            } else {
                Alert.alert('Thất bại', data.message || 'Không thể duyệt yêu cầu');
            }
        } catch (error) {
            console.error('Approve request error:', error);
            Alert.alert('Lỗi', 'Không thể kết nối đến server');
        }
    };

    const handleRejectRequest = async (request: UpdateRequest) => {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
            Alert.alert('Lỗi', 'Vui lòng đăng nhập lại');
            router.replace('/login');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/students/update-requests/${request._id}/reject`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await response.json();
            if (data.success) {
                Alert.alert('Thành công', 'Đã từ chối yêu cầu cập nhật');
                loadUpdateRequests();
                setRequestModalVisible(false);
            } else {
                Alert.alert('Thất bại', data.message || 'Không thể từ chối yêu cầu');
            }
        } catch (error) {
            console.error('Reject request error:', error);
            Alert.alert('Lỗi', 'Không thể kết nối đến server');
        }
    };

    const pendingRequests = updateRequests.filter((r) => r.status === 'pending');

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
            </View>
        );
    }

    const handleBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/admin/dashboard');
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={28} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Quản lý sinh viên</Text>
                <TouchableOpacity onPress={() => router.push('/admin/create-student')}>
                    <Ionicons name="add-circle" size={28} color="#007AFF" />
                </TouchableOpacity>
            </View>

            {/* Thống kê */}
            <View style={styles.statsContainer}>
                <TouchableOpacity 
                    style={[styles.statCard, selectedClass === 'All' && { borderColor: '#007AFF', borderWidth: 1 }]}
                    onPress={() => setSelectedClass('All')}
                >
                    <Text style={styles.statNumber}>{students.length}</Text>
                    <Text style={styles.statLabel}>Tổng SV</Text>
                </TouchableOpacity>
                <View style={[styles.statCard, styles.statCardActive]}>
                    <Text style={styles.statNumber}>
                        {students.filter((s) => s.status === 'active').length}
                    </Text>
                    <Text style={styles.statLabel}>Đang học</Text>
                </View>
                <View style={[styles.statCard, styles.statCardInactive]}>
                    <Text style={styles.statNumber}>
                        {students.filter((s) => s.status === 'inactive').length}
                    </Text>
                    <Text style={styles.statLabel}>Nghỉ học</Text>
                </View>
                <TouchableOpacity
                    style={[styles.statCard, styles.statCardRequest]}
                    onPress={() => setRequestModalVisible(true)}
                >
                    <Text style={styles.statNumber}>{pendingRequests.length}</Text>
                    <Text style={styles.statLabel}>Yêu cầu</Text>
                    {pendingRequests.length > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{pendingRequests.length}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* Search */}
            <Searchbar
                placeholder={selectedClass === 'All' ? "Tìm kiếm..." : `Tìm sinh viên lớp ${selectedClass}...`}
                onChangeText={handleSearch}
                value={searchQuery}
                style={styles.searchBar}
                iconColor="#007AFF"
            />

            {/* LOGIC HIỂN THỊ CHÍNH (Đã được chia 2 trường hợp) */}
            {selectedClass === 'All' ? (
                /* --- TRƯỜNG HỢP 1: HIỂN THỊ BỘ LỌC KHOA & DANH SÁCH LỚP --- */
                <View style={styles.listContainer}>
                    {/* Bộ lọc Khoa */}
                    <View style={{ marginBottom: 12 }}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {faculties.map((faculty) => (
                                <Chip
                                    key={faculty._id}
                                    selected={selectedFacultyFilter === String(faculty._id)}
                                    onPress={() => setSelectedFacultyFilter(String(faculty._id))}
                                    style={{ 
                                        marginRight: 8, 
                                        backgroundColor: selectedFacultyFilter === String(faculty._id) ? '#007AFF' : '#E8E8E8', 
                                        borderRadius: 20 
                                    }}
                                    textStyle={{ 
                                        color: selectedFacultyFilter === String(faculty._id) ? '#FFF' : '#333' 
                                    }}
                                >
                                    {faculty.name}
                                </Chip>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Danh sách lớp thuộc Khoa đã chọn */}
                    <ScrollView refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={loadData} />}>
                        {!selectedFacultyFilter ? (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="funnel-outline" size={64} color="#ccc" />
                                <Text style={styles.emptyText}>Vui lòng chọn Khoa</Text>
                            </View>
                        ) : classesInSelectedFaculty.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="folder-open-outline" size={64} color="#ccc" />
                                <Text style={styles.emptyText}>Chưa có lớp nào trong Khoa này</Text>
                            </View>
                        ) : (
                            classesInSelectedFaculty.map((cls) => {
                                // Tính sĩ số
                                const studentCount = students.filter(s => s.class === cls).length;
                                // Tìm Khoa Name để hiển thị
                                const facName = getFacultyName(selectedFacultyFilter);

                                return (
                                    <TouchableOpacity
                                        key={cls}
                                        style={{
                                            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                                            backgroundColor: '#FFF', padding: 16, marginBottom: 12, borderRadius: 12,
                                            shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2
                                        }}
                                        onPress={() => {
                                            setSelectedClass(cls);
                                            setSearchQuery(''); // Xóa thanh tìm kiếm khi vào lớp
                                        }}
                                    >
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                            <Ionicons name="school" size={28} color="#007AFF" />
                                            <View>
                                                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1a1a2e' }}>Lớp {cls}</Text>
                                                <Text style={{ fontSize: 13, color: '#666', marginTop: 2 }}>{facName} • {studentCount} sinh viên</Text>
                                            </View>
                                        </View>
                                        <Ionicons name="chevron-forward" size={24} color="#ccc" />
                                    </TouchableOpacity>
                                );
                            })
                        )}
                        <View style={styles.footer} />
                    </ScrollView>
                </View>
            ) : (
                /* --- TRƯỜNG HỢP 2: HIỂN THỊ DANH SÁCH SINH VIÊN TRONG LỚP --- */
                <View style={styles.listContainer}>
                    {/* Thanh tiêu đề lớp */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#E8E8E8' }}>
                        <TouchableOpacity onPress={() => setSelectedClass('All')} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Ionicons name="arrow-back" size={20} color="#007AFF" />
                            <Text style={{ fontSize: 14, color: '#007AFF', fontWeight: '500' }}>Quay lại</Text>
                        </TouchableOpacity>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1a1a2e', marginLeft: 'auto' }}>Lớp {selectedClass}</Text>
                    </View>

                    {/* Danh sách sinh viên */}
                    <ScrollView refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={loadData} />}>
                        {filteredStudents.map((student) => (
                            <Card key={student._id} style={styles.studentCard}>
                                <Card.Content>
                                   <View style={styles.studentHeader}>
                                        <View style={styles.studentInfo}>
                                            <View style={styles.avatar}>
                                                <Text style={styles.avatarText}>
                                                    {student.fullName.charAt(0)}
                                                </Text>
                                            </View>
                                            
                                            <View style={styles.studentTextContainer}>
                                                {/* ĐÃ BỎ numberOfLines={1} ĐỂ TÊN ĐƯỢC XUỐNG DÒNG */}
                                                <Text style={styles.studentName}>{student.fullName}</Text>
                                                
                                                <Text style={styles.studentId}>MSSV: {student.studentId}</Text>
                                            </View>
                                        </View>

                                        <Chip
                                            style={[
                                                styles.statusChip,
                                                student.status === 'active' ? styles.statusActive : styles.statusInactive,
                                            ]}
                                            textStyle={styles.statusChipText}
                                        >
                                            {student.status === 'active' ? 'Đang học' : 'Nghỉ học'}
                                        </Chip>
                                    </View>

                                    <View style={styles.studentActions}>
                                        <TouchableOpacity
                                            style={[styles.actionButton, styles.actionView]}
                                            onPress={() => handleViewDetail(student)}
                                        >
                                            <Ionicons name="eye" size={20} color="#007AFF" />
                                            <Text style={styles.actionText}>Xem</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[styles.actionButton, styles.actionEdit]}
                                            onPress={() => handleEdit(student)}
                                        >
                                            <Ionicons name="pencil" size={20} color="#FF8A4C" />
                                            <Text style={styles.actionText}>Sửa</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[styles.actionButton, styles.actionDelete]}
                                            onPress={() => handleDeleteStudent(student)}
                                        >
                                            <Ionicons name="trash" size={20} color="#FF3B30" />
                                            <Text style={styles.actionText}>Xóa</Text>
                                        </TouchableOpacity>
                                    </View>
                                </Card.Content>
                            </Card>
                        ))}

                        {filteredStudents.length === 0 && (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="people-outline" size={64} color="#ccc" />
                                <Text style={styles.emptyText}>Chưa có sinh viên nào</Text>
                            </View>
                        )}
                        <View style={styles.footer} />
                    </ScrollView>
                </View>
            )}

            {/* ============================================== */}
            {/* CÁC MODAL BÊN DƯỚI */}
            {/* ============================================== */}

           {/* Modal chi tiết sinh viên */}
            <Modal
                animationType="slide"
                transparent
                visible={detailModalVisible}
                onRequestClose={() => setDetailModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <ScrollView style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Thông tin sinh viên</Text>
                            <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                                <Ionicons name="close" size={28} color="#333" />
                            </TouchableOpacity>
                        </View>

                        {selectedStudent && (
                            <>
                                {/* 1. Thông tin học vấn */}
                                <Card style={styles.infoCard}>
                                    <Card.Title title="📚 Thông tin học vấn" />
                                    <Card.Content>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Trạng thái:</Text>
                                            <Chip style={selectedStudent.status === 'active' ? styles.statusActive : styles.statusInactive}>
                                                {selectedStudent.status === 'active' ? 'Đang học' : 'Nghỉ học'}
                                            </Chip>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Mã hồ sơ:</Text>
                                            <Text style={styles.infoValue}>{selectedStudent._id}</Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Ngày vào trường:</Text>
                                            <Text style={styles.infoValue}>
                                                {selectedStudent.createdAt ? new Date(selectedStudent.createdAt).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                                            </Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Lớp học:</Text>
                                            <Text style={styles.infoValue}>{selectedStudent.class || 'Chưa cập nhật'}</Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Cơ sở:</Text>
                                            <Text style={styles.infoValue}>Trường Đại học Kỹ thuật - Công nghệ Cần Thơ</Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Bậc đào tạo:</Text>
                                            <Text style={styles.infoValue}>Đại học chính quy</Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Loại hình đào tạo:</Text>
                                            <Text style={styles.infoValue}>Chính quy</Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Khoa:</Text>
                                            <Text style={styles.infoValue}>{getFacultyName(selectedStudent.facultyId as string)}</Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Ngành:</Text>
                                            <Text style={styles.infoValue}>{getDepartmentName(selectedStudent.departmentId as string)}</Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Chuyên ngành:</Text>
                                            <Text style={styles.infoValue}>{getDepartmentName(selectedStudent.departmentId as string)}</Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Khóa học:</Text>
                                            <Text style={styles.infoValue}>
                                                {selectedStudent.academicInfo?.courseYear || 
                                                (selectedStudent.class ? `Khóa ${selectedStudent.class.replace(/[^0-9]/g, '').substring(0, 2)}` : 'Chưa cập nhật')}
                                            </Text>
                                        </View>
                                    </Card.Content>
                                </Card>

                                {/* 2. Thông tin cá nhân */}
                                <Card style={styles.infoCard}>
                                    <Card.Title title="👤 Thông tin cá nhân" />
                                    <Card.Content>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Ngày sinh:</Text>
                                            <Text style={styles.infoValue}>{selectedStudent.dateOfBirth || 'Chưa cập nhật'}</Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Dân tộc:</Text>
                                            <Text style={styles.infoValue}>{selectedStudent.personalInfo?.ethnicity || 'Kinh'}</Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Tôn giáo:</Text>
                                            <Text style={styles.infoValue}>{selectedStudent.personalInfo?.religion || 'Không'}</Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Quốc tịch:</Text>
                                            <Text style={styles.infoValue}>{selectedStudent.personalInfo?.nationality || 'Việt Nam'}</Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Số CCCD:</Text>
                                            <Text style={styles.infoValue}>{selectedStudent.personalInfo?.cccd || 'Chưa cập nhật'}</Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Ngày cấp:</Text>
                                            <Text style={styles.infoValue}>{selectedStudent.personalInfo?.cccdIssueDate || 'Chưa cập nhật'}</Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Nơi cấp:</Text>
                                            <Text style={styles.infoValue}>{selectedStudent.personalInfo?.cccdIssuePlace || 'Chưa cập nhật'}</Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Diện chính sách:</Text>
                                            <Text style={styles.infoValue}>{selectedStudent.personalInfo?.policyType || 'Không'}</Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Điện thoại:</Text>
                                            <Text style={styles.infoValue}>{selectedStudent.phone || 'Chưa cập nhật'}</Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Email:</Text>
                                            <Text style={styles.infoValue}>{selectedStudent.email || 'Chưa cập nhật'}</Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Địa chỉ:</Text>
                                            <Text style={styles.infoValue}>{selectedStudent.address || 'Chưa cập nhật'}</Text>
                                        </View>
                                    </Card.Content>
                                </Card>

                                {/* 3. Thông tin gia đình */}
                                <Card style={styles.infoCard}>
                                    <Card.Title title="👨‍👩‍👦 Thông tin gia đình" />
                                    <Card.Content>
                                        <Text style={[styles.sectionTitle, { color: '#007AFF' }]}>Thông tin Cha</Text>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Họ và tên:</Text>
                                            <Text style={styles.infoValue}>{selectedStudent.familyInfo?.father?.name || 'Chưa cập nhật'}</Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Năm sinh:</Text>
                                            <Text style={styles.infoValue}>{selectedStudent.familyInfo?.father?.birthYear || 'Chưa cập nhật'}</Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Nghề nghiệp:</Text>
                                            <Text style={styles.infoValue}>{selectedStudent.familyInfo?.father?.occupation || 'Chưa cập nhật'}</Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Điện thoại:</Text>
                                            <Text style={styles.infoValue}>{selectedStudent.familyInfo?.father?.phone || 'Chưa cập nhật'}</Text>
                                        </View>

                                        <Text style={[styles.sectionTitle, { marginTop: 16, color: '#e83e8c' }]}>Thông tin Mẹ</Text>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Họ và tên:</Text>
                                            <Text style={styles.infoValue}>{selectedStudent.familyInfo?.mother?.name || 'Chưa cập nhật'}</Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Năm sinh:</Text>
                                            <Text style={styles.infoValue}>{selectedStudent.familyInfo?.mother?.birthYear || 'Chưa cập nhật'}</Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Nghề nghiệp:</Text>
                                            <Text style={styles.infoValue}>{selectedStudent.familyInfo?.mother?.occupation || 'Chưa cập nhật'}</Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Điện thoại:</Text>
                                            <Text style={styles.infoValue}>{selectedStudent.familyInfo?.mother?.phone || 'Chưa cập nhật'}</Text>
                                        </View>
                                    </Card.Content>
                                </Card>
                            </>
                        )}
                        
                        {/* 4. Nút đóng an toàn, che mọi lỗi dư thừa */}
                        <View style={{ paddingHorizontal: 16, marginTop: 24, marginBottom: 30 }}>
                            <Button 
                                mode="contained" 
                                onPress={() => setDetailModalVisible(false)}
                                style={{ backgroundColor: '#007AFF', borderRadius: 8, paddingVertical: 4 }}
                                labelStyle={{ fontSize: 16, fontWeight: 'bold' }}
                            >
                                Đóng
                            </Button>
                        </View>
                        
                    </ScrollView>
                </View>
            </Modal>

            {/* Modal chỉnh sửa sinh viên */}
            <Modal
                animationType="slide"
                transparent
                visible={editModalVisible}
                onRequestClose={() => setEditModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <ScrollView style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Sửa thông tin sinh viên</Text>
                            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                                <Ionicons name="close" size={28} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <View style={{ padding: 16 }}>
                            <TextInput
                                label="Họ và tên"
                                value={editForm.fullName}
                                onChangeText={(text) => setEditForm({ ...editForm, fullName: text })}
                                style={{ marginBottom: 12 }}
                                mode="outlined"
                            />
                            <TextInput
                                label="Số điện thoại"
                                value={editForm.phone}
                                onChangeText={(text) => setEditForm({ ...editForm, phone: text })}
                                keyboardType="phone-pad"
                                style={{ marginBottom: 12 }}
                                mode="outlined"
                            />
                            <TextInput
                                label="Ngày sinh"
                                value={editForm.dateOfBirth}
                                // Nhập tay dạng chuỗi vì Model Backend của bạn đang để String
                                onChangeText={(text) => setEditForm({ ...editForm, dateOfBirth: text })} 
                                placeholder="DD/MM/YYYY (VD: 15/08/2003)"
                                style={{ marginBottom: 12 }}
                                mode="outlined"
                            />
                            <TextInput
                                label="Lớp học"
                                value={editForm.class}
                                onChangeText={(text) => setEditForm({ ...editForm, class: text })}
                                style={{ marginBottom: 12 }}
                                mode="outlined"
                            />
                            <TextInput
                                label="Khóa học (VD: Khóa 23)"
                                value={editForm.courseYear}
                                onChangeText={(text) => setEditForm({ ...editForm, courseYear: text })}
                                style={{ marginBottom: 12 }}
                                mode="outlined"
                            />
                            <TextInput
                                label="Địa chỉ liên hệ"
                                value={editForm.address}
                                onChangeText={(text) => setEditForm({ ...editForm, address: text })}
                                multiline
                                numberOfLines={3}
                                style={{ marginBottom: 16 }}
                                mode="outlined"
                            />

                            <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>Trạng thái:</Text>
                            <View style={{ flexDirection: 'row', marginBottom: 20 }}>
                                <Chip
                                    selected={editForm.status === 'active'}
                                    onPress={() => setEditForm({ ...editForm, status: 'active' })}
                                    style={{ marginRight: 12 }}
                                >
                                    Đang học
                                </Chip>
                                <Chip
                                    selected={editForm.status === 'inactive'}
                                    onPress={() => setEditForm({ ...editForm, status: 'inactive' })}
                                >
                                    Nghỉ học
                                </Chip>
                            </View>

                            <Button mode="contained" onPress={handleUpdateStudent} style={{ backgroundColor: '#007AFF', padding: 4 }}>
                                Lưu Thay Đổi
                            </Button>
                        </View>
                        <View style={{ height: 40 }} />
                    </ScrollView>
                </View>
            </Modal>

            {/* Modal hiển thị danh sách yêu cầu cập nhật */}
            <Modal
                animationType="slide"
                transparent
                visible={requestModalVisible}
                onRequestClose={() => setRequestModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { maxHeight: '80%' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Yêu cầu cập nhật ({pendingRequests.length})</Text>
                            <TouchableOpacity onPress={() => setRequestModalVisible(false)}>
                                <Ionicons name="close" size={28} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={{ padding: 12 }}>
                            {pendingRequests.map((req) => (
                                <Card key={req._id} style={{ marginBottom: 12, elevation: 2 }}>
                                    <Card.Content>
                                        <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{req.studentName}</Text>
                                        <Text style={{ color: '#666', marginVertical: 4 }}>MSSV: {req.studentId}</Text>
                                        
                                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 }}>
                                            <Button 
                                                mode="outlined" 
                                                textColor="#FF3B30" 
                                                onPress={() => handleRejectRequest(req)}
                                                style={{ marginRight: 8, borderColor: '#FF3B30' }}
                                            >
                                                Từ chối
                                            </Button>
                                            <Button 
                                                mode="contained" 
                                                buttonColor="#34C759" 
                                                onPress={() => handleApproveRequest(req)}
                                            >
                                                Duyệt
                                            </Button>
                                        </View>
                                    </Card.Content>
                                </Card>
                            ))}

                            {pendingRequests.length === 0 && (
                                <View style={{ alignItems: 'center', marginVertical: 40 }}>
                                    <Ionicons name="checkmark-circle-outline" size={64} color="#34C759" />
                                    <Text style={{ marginTop: 8, color: '#666' }}>Không có yêu cầu nào đang chờ xử lý</Text>
                                </View>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}