// app/admin/student-management.tsx
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
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
    Dialog,
    Portal,
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
    facultyId: string;  // ← sửa thành có thể là object hoặc string
    departmentId:  string;  // ← sửa thành có thể là object hoặc string
    class: string;
    phone: string;
    address: string;
    dateOfBirth: string;
    placeOfBirth: string;
    status: 'active' | 'inactive';
    createdAt: string;
    updatedAt: string;
    // Thông tin bổ sung
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

export default function StudentManagementScreen() {
    const [students, setStudents] = useState<Student[]>([]);
    const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
    const [faculties, setFaculties] = useState<Faculty[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [updateRequests, setUpdateRequests] = useState<UpdateRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [requestModalVisible, setRequestModalVisible] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<UpdateRequest | null>(null);

    // Form edit
    const [editForm, setEditForm] = useState<Partial<Student>>({});

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            await Promise.all([
                loadStudents(),
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
        const response = await fetch(`${API_URL}/auth/students`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
         
        
        if (data.success) {
            setStudents(data.students || []);
            setFilteredStudents(data.students || []);
            
            
             
        }
    } catch (error) {
        console.error('Load students error:', error);
        throw error;
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
        console.error('❌ Load faculties error:', error);
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

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        if (query.trim() === '') {
            setFilteredStudents(students);
        } else {
            const filtered = students.filter(
                (student) =>
                    student.fullName.toLowerCase().includes(query.toLowerCase()) ||
                    student.studentId.toLowerCase().includes(query.toLowerCase()) ||
                    student.email.toLowerCase().includes(query.toLowerCase())
            );
            setFilteredStudents(filtered);
        }
    };

const getFacultyName = (facultyId: string) => {
    console.log('🔍 Looking for facultyId:', facultyId, 'Type:', typeof facultyId);
    console.log('📚 Available faculties:', faculties.map(f => ({ 
        id: f._id, 
        idType: typeof f._id,
        name: f.name 
    })));
    
    const faculty = faculties.find(f => String(f._id) === String(facultyId));
    console.log('🎯 Found:', faculty?.name || 'NOT FOUND');
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
            const response = await fetch(`${API_URL}/auth/students/${selectedStudent._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(editForm),
            });

            const data = await response.json();
            if (data.success) {
                Alert.alert('Thành công', 'Cập nhật thông tin sinh viên thành công');
                setEditModalVisible(false);
                loadStudents();
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
                            const response = await fetch(`${API_URL}/auth/students/${student._id}`, {
                                method: 'DELETE',
                                headers: { Authorization: `Bearer ${token}` },
                            });

                            const data = await response.json();
                            if (data.success) {
                                Alert.alert('Thành công', 'Xóa sinh viên thành công');
                                loadStudents();
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
                <View style={styles.statCard}>
                    <Text style={styles.statNumber}>{students.length}</Text>
                    <Text style={styles.statLabel}>Tổng SV</Text>
                </View>
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
                placeholder="Tìm kiếm sinh viên..."
                onChangeText={handleSearch}
                value={searchQuery}
                style={styles.searchBar}
                iconColor="#007AFF"
            />

            {/* Danh sách sinh viên */}
            <ScrollView
                style={styles.listContainer}
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={loadData} />
                }
            >
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
                                    <View>
                                        <Text style={styles.studentName}>{student.fullName}</Text>
                                        <Text style={styles.studentId}>MSSV: {student.studentId}</Text>
                                        <Text style={styles.studentDept}>{ (student.departmentId as any)?.name || 'N/A' }</Text>
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
                                {/* Thông tin học vấn */}
                                <Card style={styles.infoCard}>
                                    <Card.Title title="📚 Thông tin học vấn" />
                                    <Card.Content>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Trạng thái:</Text>
                                            <Chip
                                                style={selectedStudent.status === 'active' ? styles.statusActive : styles.statusInactive}
                                            >
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
                                            <Text style={styles.infoValue}>{(selectedStudent.facultyId as any)?.name || 'N/A'}</Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Ngành:</Text>
                                            <Text style={styles.infoValue}> {(selectedStudent.departmentId as any )?.name || 'N/A'}</Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Chuyên ngành:</Text>
                                            <Text style={styles.infoValue}>{(selectedStudent.departmentId as any )?.name || 'N/A'}</Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Khóa học:</Text>
                                            <Text style={styles.infoValue}>{selectedStudent.academicInfo?.courseYear || 'Chưa cập nhật'}</Text>
                                        </View>
                                    </Card.Content>
                                </Card>

                                {/* Thông tin cá nhân */}
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
                                            <Text style={styles.infoLabel}>Khu vực:</Text>
                                            <Text style={styles.infoValue}>{selectedStudent.personalInfo?.region || 'Chưa cập nhật'}</Text>
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
                                            <Text style={styles.infoLabel}>Đối tượng:</Text>
                                            <Text style={styles.infoValue}>{selectedStudent.personalInfo?.object || 'Chưa cập nhật'}</Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Diện chính sách:</Text>
                                            <Text style={styles.infoValue}>{selectedStudent.personalInfo?.policyType || 'Không'}</Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Ngày vào Đoàn:</Text>
                                            <Text style={styles.infoValue}>{selectedStudent.personalInfo?.unionJoinDate || 'Chưa cập nhật'}</Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Ngày vào Đảng:</Text>
                                            <Text style={styles.infoValue}>{selectedStudent.personalInfo?.partyJoinDate || 'Chưa cập nhật'}</Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Điện thoại:</Text>
                                            <Text style={styles.infoValue}>{selectedStudent.phone || 'Chưa cập nhật'}</Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Email:</Text>
                                            <Text style={styles.infoValue}>{selectedStudent.email}</Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Địa chỉ liên hệ:</Text>
                                            <Text style={styles.infoValue}>{selectedStudent.address || 'Chưa cập nhật'}</Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Nơi sinh:</Text>
                                            <Text style={styles.infoValue}>{selectedStudent.placeOfBirth || 'Chưa cập nhật'}</Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Hộ khẩu thường trú:</Text>
                                            <Text style={styles.infoValue}>{selectedStudent.personalInfo?.permanentResidence || 'Chưa cập nhật'}</Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Tên ngân hàng:</Text>
                                            <Text style={styles.infoValue}>{selectedStudent.personalInfo?.bankName || 'Chưa cập nhật'}</Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Chi nhánh:</Text>
                                            <Text style={styles.infoValue}>{selectedStudent.personalInfo?.bankBranch || 'Chưa cập nhật'}</Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Chủ tài khoản:</Text>
                                            <Text style={styles.infoValue}>{selectedStudent.personalInfo?.accountHolder || 'Chưa cập nhật'}</Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Số tài khoản:</Text>
                                            <Text style={styles.infoValue}>{selectedStudent.personalInfo?.accountNumber || 'Chưa cập nhật'}</Text>
                                        </View>
                                    </Card.Content>
                                </Card>

                                {/* Thông tin gia đình */}
                                <Card style={styles.infoCard}>
                                    <Card.Title title="👨‍👩‍👧‍👦 Quan hệ gia đình" />
                                    <Card.Content>
                                        <Text style={styles.sectionTitle}>Cha</Text>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Họ tên:</Text>
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
                                            <Text style={styles.infoLabel}>Quốc tịch:</Text>
                                            <Text style={styles.infoValue}>{selectedStudent.familyInfo?.father?.nationality || 'Việt Nam'}</Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Dân tộc:</Text>
                                            <Text style={styles.infoValue}>{selectedStudent.familyInfo?.father?.ethnicity || 'Kinh'}</Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Tôn giáo:</Text>
                                            <Text style={styles.infoValue}>{selectedStudent.familyInfo?.father?.religion || 'Không'}</Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Cơ quan công tác:</Text>
                                            <Text style={styles.infoValue}>{selectedStudent.familyInfo?.father?.workplace || 'Chưa cập nhật'}</Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Chức vụ:</Text>
                                            <Text style={styles.infoValue}>{selectedStudent.familyInfo?.father?.position || 'Chưa cập nhật'}</Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Số điện thoại:</Text>
                                            <Text style={styles.infoValue}>{selectedStudent.familyInfo?.father?.phone || 'Chưa cập nhật'}</Text>
                                        </View>

                                        <Text style={[styles.sectionTitle, styles.motherTitle]}>Mẹ</Text>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Họ tên:</Text>
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
                                            <Text style={styles.infoLabel}>Quốc tịch:</Text>
                                            <Text style={styles.infoValue}>{selectedStudent.familyInfo?.mother?.nationality || 'Việt Nam'}</Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Dân tộc:</Text>
                                            <Text style={styles.infoValue}>{selectedStudent.familyInfo?.mother?.ethnicity || 'Kinh'}</Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Tôn giáo:</Text>
                                            <Text style={styles.infoValue}>{selectedStudent.familyInfo?.mother?.religion || 'Không'}</Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Cơ quan công tác:</Text>
                                            <Text style={styles.infoValue}>{selectedStudent.familyInfo?.mother?.workplace || 'Chưa cập nhật'}</Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Chức vụ:</Text>
                                            <Text style={styles.infoValue}>{selectedStudent.familyInfo?.mother?.position || 'Chưa cập nhật'}</Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Số điện thoại:</Text>
                                            <Text style={styles.infoValue}>{selectedStudent.familyInfo?.mother?.phone || 'Chưa cập nhật'}</Text>
                                        </View>
                                    </Card.Content>
                                </Card>

                                <Button
                                    mode="contained"
                                    onPress={() => setDetailModalVisible(false)}
                                    style={styles.closeButton}
                                >
                                    Đóng
                                </Button>
                            </>
                        )}
                        <View style={styles.footer} />
                    </ScrollView>
                </View>
            </Modal>

            {/* Modal sửa thông tin */}
            <Portal>
                <Dialog visible={editModalVisible} onDismiss={() => setEditModalVisible(false)}>
                    <Dialog.Title>Sửa thông tin sinh viên</Dialog.Title>
                    <Dialog.ScrollArea>
                        <ScrollView>
                            <TextInput
                                label="Họ và tên"
                                value={editForm.fullName}
                                onChangeText={(text) => setEditForm({ ...editForm, fullName: text })}
                                mode="outlined"
                                style={styles.editInput}
                            />
                            <TextInput
                                label="Ngày sinh"
                                value={editForm.dateOfBirth}
                                onChangeText={(text) => setEditForm({ ...editForm, dateOfBirth: text })}
                                mode="outlined"
                                style={styles.editInput}
                                placeholder="DD/MM/YYYY"
                            />
                            <TextInput
                                label="Nơi sinh"
                                value={editForm.placeOfBirth}
                                onChangeText={(text) => setEditForm({ ...editForm, placeOfBirth: text })}
                                mode="outlined"
                                style={styles.editInput}
                            />
                            <TextInput
                                label="Lớp"
                                value={editForm.class}
                                onChangeText={(text) => setEditForm({ ...editForm, class: text })}
                                mode="outlined"
                                style={styles.editInput}
                            />
                            <TextInput
                                label="Số điện thoại"
                                value={editForm.phone}
                                onChangeText={(text) => setEditForm({ ...editForm, phone: text })}
                                mode="outlined"
                                style={styles.editInput}
                                keyboardType="phone-pad"
                            />
                            <TextInput
                                label="Địa chỉ"
                                value={editForm.address}
                                onChangeText={(text) => setEditForm({ ...editForm, address: text })}
                                mode="outlined"
                                style={styles.editInput}
                                multiline
                            />
                            <View style={styles.statusSelector}>
                                <TouchableOpacity
                                    style={[
                                        styles.statusOption,
                                        editForm.status === 'active' && styles.statusOptionActive,
                                    ]}
                                    onPress={() => setEditForm({ ...editForm, status: 'active' })}
                                >
                                    <Ionicons
                                        name={editForm.status === 'active' ? 'checkmark-circle' : 'ellipse-outline'}
                                        size={20}
                                        color={editForm.status === 'active' ? '#28a745' : '#999'}
                                    />
                                    <Text>Đang học</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.statusOption,
                                        editForm.status === 'inactive' && styles.statusOptionInactive,
                                    ]}
                                    onPress={() => setEditForm({ ...editForm, status: 'inactive' })}
                                >
                                    <Ionicons
                                        name={editForm.status === 'inactive' ? 'checkmark-circle' : 'ellipse-outline'}
                                        size={20}
                                        color={editForm.status === 'inactive' ? '#dc3545' : '#999'}
                                    />
                                    <Text>Nghỉ học</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </Dialog.ScrollArea>
                    <Dialog.Actions>
                        <Button onPress={() => setEditModalVisible(false)}>Hủy</Button>
                        <Button onPress={handleUpdateStudent}>Cập nhật</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>

            {/* Modal yêu cầu cập nhật */}
            <Modal
                animationType="slide"
                transparent
                visible={requestModalVisible}
                onRequestClose={() => setRequestModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Yêu cầu cập nhật thông tin</Text>
                            <TouchableOpacity onPress={() => setRequestModalVisible(false)}>
                                <Ionicons name="close" size={28} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView>
                            {pendingRequests.length === 0 ? (
                                <View style={styles.emptyContainer}>
                                    <Ionicons name="checkmark-circle-outline" size={64} color="#28a745" />
                                    <Text style={styles.emptyText}>Không có yêu cầu nào</Text>
                                </View>
                            ) : (
                                pendingRequests.map((request) => (
                                    <Card key={request._id} style={styles.requestCard}>
                                        <Card.Content>
                                            <View style={styles.requestHeader}>
                                                <View>
                                                    <Text style={styles.requestStudent}>{request.studentName}</Text>
                                                    <Text style={styles.requestId}>MSSV: {request.studentId}</Text>
                                                </View>
                                                <Chip style={styles.requestPending}>
                                                    Chờ duyệt
                                                </Chip>
                                            </View>
                                            <View style={styles.requestFields}>
                                                <Text style={styles.requestLabel}>Các trường cần cập nhật:</Text>
                                                {request.fields.map((field, index) => (
                                                    <View key={index} style={styles.requestFieldTag}>
                                                        <Text style={styles.requestFieldText}>{field}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                            <View style={styles.requestActions}>
                                                <Button
                                                    mode="outlined"
                                                    onPress={() => handleRejectRequest(request)}
                                                    style={styles.requestReject}
                                                    labelStyle={{ color: '#dc3545' }}
                                                >
                                                    Từ chối
                                                </Button>
                                                <Button
                                                    mode="contained"
                                                    onPress={() => handleApproveRequest(request)}
                                                    style={styles.requestApprove}
                                                >
                                                    Duyệt
                                                </Button>
                                            </View>
                                        </Card.Content>
                                    </Card>
                                ))
                            )}
                            <View style={styles.footer} />
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}