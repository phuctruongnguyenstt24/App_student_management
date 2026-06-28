// app/admin/create-student.tsx
import { useState, useEffect } from 'react';
import Constants from 'expo-constants';
import { styles } from '../../a_styles/style_create_std';
import {
    View,
    StyleSheet,
    ScrollView,
    Alert,
    TouchableOpacity,
    Modal,
    TextInput as RNTextInput,
} from 'react-native';
import {
    Text,
    Card,
    Button,
    TextInput,
    List,
    IconButton,
    Chip,
    Divider,
    ActivityIndicator,
} from 'react-native-paper';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const host = Constants.expoConfig?.hostUri?.split(':')[0];
const API_URL = `http://${host}:5000/api`;

// Types
interface Faculty {
    _id: string;
    name: string;
    code: string;
    departments: Department[];
    createdAt: string;
}

interface Department {
    _id: string;
    name: string;
    code: string;
    facultyId: string;
    createdAt: string;
}

interface StudentFormData {
    fullName: string;
    studentId: string;
    email: string;
    password: string;
    facultyId: string;
    departmentId: string;
    class: string;
    phone: string;
    address: string;
    year: string;
    sequenceNumber: string;
}

export default function CreateStudentScreen() {
    const [formData, setFormData] = useState<StudentFormData>({
        fullName: '',
        studentId: '',
        email: '',
        password: '',
        facultyId: '',
        departmentId: '',
        class: '',
        phone: '',
        address: '',
        year: new Date().getFullYear().toString(),
        sequenceNumber: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [isCheckingSequence, setIsCheckingSequence] = useState(false);

    // State cho danh sách Khoa và Ngành
    const [faculties, setFaculties] = useState<Faculty[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);

    // State cho modal quản lý Khoa/Ngành
    const [modalVisible, setModalVisible] = useState(false);
    const [modalType, setModalType] = useState<'faculty' | 'department'>('faculty');
    const [editingItem, setEditingItem] = useState<any>(null);
    const [modalName, setModalName] = useState('');
    const [modalCode, setModalCode] = useState('');
    const [selectedFacultyId, setSelectedFacultyId] = useState('');

    // State để lưu tất cả MSSV đã tồn tại
    const [existingStudentIds, setExistingStudentIds] = useState<string[]>([]);

    // Load dữ liệu
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsFetching(true);
        try {
            await Promise.all([loadFaculties(), loadDepartments(), loadExistingStudents()]);
        } catch (error) {
            console.error('Load data error:', error);
        } finally {
            setIsFetching(false);
        }
    };

    const loadFaculties = async () => {
        const token = await AsyncStorage.getItem('token');
        try {
            const response = await fetch(`${API_URL}/faculties`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (data.success) {
                setFaculties(data.faculties);
            }
        } catch (error) {
            console.error('Load faculties error:', error);
        }
    };

    const loadDepartments = async () => {
        const token = await AsyncStorage.getItem('token');
        try {
            const response = await fetch(`${API_URL}/departments`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (data.success) {
                setDepartments(data.departments);
            }
        } catch (error) {
            console.error('Load departments error:', error);
        }
    };

    // Load tất cả MSSV đã tồn tại
    const loadExistingStudents = async () => {
        const token = await AsyncStorage.getItem('token');
        try {
            const response = await fetch(`${API_URL}/auth/students`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (data.success) {
                const studentIds = data.students.map((s: any) => s.studentId.toUpperCase());
                setExistingStudentIds(studentIds);
            }
        } catch (error) {
            console.error('Load students error:', error);
        }
    };

    // Hàm tìm STT tiếp theo không trùng
    const findNextSequenceNumber = (year: string, departmentCode: string) => {
        if (!year || !departmentCode) return '001';

        const prefix = `${departmentCode.toUpperCase()}${year.slice(-2)}`;
        const matchingIds = existingStudentIds.filter(id => id.startsWith(prefix));

        if (matchingIds.length === 0) {
            return '001';
        }

        let maxSequence = 0;
        matchingIds.forEach(id => {
            const sequenceStr = id.slice(-3);
            const sequenceNum = parseInt(sequenceStr, 10);
            if (sequenceNum > maxSequence) {
                maxSequence = sequenceNum;
            }
        });

        const nextSequence = maxSequence + 1;
        return nextSequence.toString().padStart(3, '0');
    };

    // Tự động tìm STT khi năm học hoặc ngành thay đổi
    useEffect(() => {
        if (formData.year && formData.departmentId) {
            const selectedDept = departments.find(d => d._id === formData.departmentId);
            if (selectedDept) {
                const newSequence = findNextSequenceNumber(formData.year, selectedDept.code);
                setFormData(prev => ({
                    ...prev,
                    sequenceNumber: newSequence,
                }));
            }
        }
    }, [formData.year, formData.departmentId, departments, existingStudentIds]);

    // Hàm tạo MSSV tự động
    const generateMSSV = (year: string, departmentCode: string, sequenceNumber: string) => {
        if (!year || !departmentCode || !sequenceNumber) return '';
        const yearShort = year.slice(-2);
        const mssv = `${departmentCode.toUpperCase()}${yearShort}${sequenceNumber.padStart(3, '0')}`;
        return mssv;
    };

    // Xóa tiếng việt trong tên
    const removeVietnameseTones = (str: string) => {
        return str
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/Đ/g, 'D');
    }

    // Xử lý tạo email tự động
    const generateEmail = (fullName: string, departmentCode: string, studentId: string) => {
        if (!fullName || !departmentCode || !studentId) return '';

        const cleanName = removeVietnameseTones(fullName).trim().toLowerCase();
        const parts = cleanName.split(/\s+/);
        if (parts.length < 2) {
            return `${cleanName}${departmentCode.toLowerCase()}${studentId}@student.ctuet.edu.vn`
        }

        const lastName = parts[parts.length - 1] || '';
        const initial = parts.slice(0, parts.length - 1).map(word => word[0]).join('');
        const username = `${initial}${lastName}${departmentCode}${studentId}`.toLowerCase();

        return `${username}@student.ctuet.edu.vn`;
    };

    // Xử lý tạo password tự động (7 số cuối của MSSV)
    const generatePassword = (studentId: string) => {
        if (!studentId) return '';
        const numbers = studentId.replace(/[^0-9]/g, '');
        return numbers.slice(-7);
    };

    // Kiểm tra STT có bị trùng không
    const checkSequenceExists = (year: string, departmentCode: string, sequenceNumber: string) => {
        const yearShort = year.slice(-2);
        const prefix = `${departmentCode.toUpperCase()}${yearShort}`;
        const fullMSSV = `${prefix}${sequenceNumber.padStart(3, '0')}`;
        return existingStudentIds.includes(fullMSSV);
    };

    // Xử lý khi người dùng nhập STT thủ công
    const handleManualSequenceChange = (text: string) => {
        const numericText = text.replace(/[^0-9]/g, '');
        if (numericText.length <= 3) {
            setFormData(prev => ({ ...prev, sequenceNumber: numericText }));

            if (numericText.length === 3 && formData.year && formData.departmentId) {
                const selectedDept = departments.find(d => d._id === formData.departmentId);
                if (selectedDept) {
                    const exists = checkSequenceExists(formData.year, selectedDept.code, numericText);
                    if (exists) {
                        Alert.alert('Lưu ý', `STT ${numericText} đã tồn tại. Vui lòng chọn STT khác.`);
                        const nextSeq = findNextSequenceNumber(formData.year, selectedDept.code);
                        setFormData(prev => ({ ...prev, sequenceNumber: nextSeq }));
                    }
                }
            }
        }
    };

    // Tự động tạo MSSV, email và password khi thông tin thay đổi
    useEffect(() => {
        if (formData.fullName && formData.departmentId && formData.year && formData.sequenceNumber) {
            const selectedDept = departments.find(d => d._id === formData.departmentId);
            if (selectedDept) {
                const mssv = generateMSSV(formData.year, selectedDept.code, formData.sequenceNumber);
                const email = generateEmail(formData.fullName, selectedDept.code, mssv);
                const password = generatePassword(mssv);

                setFormData(prev => ({
                    ...prev,
                    studentId: mssv,
                    email: email,
                    password: password,
                }));
            }
        }
    }, [formData.fullName, formData.departmentId, formData.year, formData.sequenceNumber]);

    // Tạo sinh viên
    const handleCreateStudent = async () => {
        if (!formData.fullName || !formData.studentId || !formData.facultyId || !formData.departmentId) {
            Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin bắt buộc');
            return;
        }

        if (!formData.year) {
            Alert.alert('Lỗi', 'Vui lòng chọn năm học');
            return;
        }

        if (!formData.sequenceNumber || formData.sequenceNumber.length < 3) {
            Alert.alert('Lỗi', 'Số thứ tự phải có ít nhất 3 ký tự (VD: 001)');
            return;
        }

        const selectedDept = departments.find(d => d._id === formData.departmentId);

        if (!selectedDept) {
            Alert.alert('Lỗi', 'Không tìm thấy ngành học. Vui lòng chọn lại.');
            return;
        }

        if (selectedDept) {
            const exists = checkSequenceExists(formData.year, selectedDept.code, formData.sequenceNumber);
            if (exists) {
                Alert.alert(
                    'Lỗi trùng STT',
                    `STT ${formData.sequenceNumber} đã tồn tại. Vui lòng tải lại trang để lấy STT tự động mới.`
                );
                const newSeq = findNextSequenceNumber(formData.year, selectedDept.code);
                setFormData(prev => ({ ...prev, sequenceNumber: newSeq }));
                return;
            }
        }

        setIsLoading(true);
        const token = await AsyncStorage.getItem('token');

        if (!token) {
            Alert.alert('Lỗi', 'Không tìm thấy token. Vui lòng đăng nhập lại.');
            setIsLoading(false);
            return;
        }

        try {
            console.log('📝 Creating student with data:', {
                fullName: formData.fullName.trim(),
                studentId: formData.studentId.trim().toUpperCase(),
                email: formData.email.trim(),
                facultyId: formData.facultyId,
                departmentId: formData.departmentId,
            });

            const response = await fetch(`${API_URL}/auth/create-student`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    fullName: formData.fullName.trim(),
                    studentId: formData.studentId.trim().toUpperCase(),
                    email: formData.email.trim(),
                    password: formData.password,
                    facultyId: formData.facultyId,
                    departmentId: formData.departmentId,
                    class: formData.class,
                    phone: formData.phone,
                    address: formData.address,
                }),
            });

            const data = await response.json();
            console.log('📦 Response:', data);

            if (data.success) {
                setExistingStudentIds(prev => [...prev, formData.studentId.toUpperCase()]);

                Alert.alert(
                    'Thành công',
                    `Tạo tài khoản sinh viên thành công!\n\nMSSV: ${formData.studentId.toUpperCase()}\nEmail: ${formData.email}\nMật khẩu: ${formData.password}`,
                    [
                        {
                            text: 'OK',
                            onPress: () => {
                                const newSeq = findNextSequenceNumber(formData.year, selectedDept.code);
                                setFormData({
                                    fullName: '',
                                    studentId: '',
                                    email: '',
                                    password: '',
                                    facultyId: '',
                                    departmentId: '',
                                    class: '',
                                    phone: '',
                                    address: '',
                                    year: formData.year,
                                    sequenceNumber: newSeq,
                                });
                                loadExistingStudents();
                            },
                        },
                    ]
                );
            } else {
                Alert.alert('Thất bại', data.message || 'Không thể tạo tài khoản');
            }
        } catch (error) {
            console.error('Create student error:', error);
            Alert.alert('Lỗi', 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
        } finally {
            setIsLoading(false);
        }
    };

    // Modal quản lý Khoa/Ngành
    const handleSaveModal = async () => {
        if (!modalName.trim() || !modalCode.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập tên và mã');
            return;
        }

        const token = await AsyncStorage.getItem('token');
        const url = modalType === 'faculty'
            ? `${API_URL}/faculties${editingItem ? `/${editingItem._id}` : ''}`
            : `${API_URL}/departments${editingItem ? `/${editingItem._id}` : ''}`;

        const method = editingItem ? 'PUT' : 'POST';
        const body: any = {
            name: modalName.trim(),
            code: modalCode.trim().toUpperCase(),
        };

        if (modalType === 'department' && selectedFacultyId) {
            body.facultyId = selectedFacultyId;
        }

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if (data.success) {
                Alert.alert('Thành công', `${modalType === 'faculty' ? 'Khoa' : 'Ngành'} đã được lưu`);
                setModalVisible(false);
                setModalName('');
                setModalCode('');
                setEditingItem(null);
                loadData();
            } else {
                Alert.alert('Thất bại', data.message);
            }
        } catch (error) {
            console.error('Save error:', error);
            Alert.alert('Lỗi', 'Không thể kết nối đến server');
        }
    };

    const handleDeleteItem = async (id: string, type: 'faculty' | 'department') => {
        Alert.alert(
            'Xác nhận xóa',
            `Bạn có chắc muốn xóa ${type === 'faculty' ? 'khoa' : 'ngành'} này?`,
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: async () => {
                        const token = await AsyncStorage.getItem('token');
                        const url = type === 'faculty'
                            ? `${API_URL}/faculties/${id}`
                            : `${API_URL}/departments/${id}`;

                        try {
                            const response = await fetch(url, {
                                method: 'DELETE',
                                headers: { Authorization: `Bearer ${token}` },
                            });
                            const data = await response.json();
                            if (data.success) {
                                Alert.alert('Thành công', 'Đã xóa thành công');
                                loadData();
                            } else {
                                Alert.alert('Thất bại', data.message);
                            }
                        } catch (error) {
                            console.error('Delete error:', error);
                            Alert.alert('Lỗi', 'Không thể kết nối đến server');
                        }
                    },
                },
            ]
        );
    };

    const getYearOptions = () => {
        const years = [];
        const currentYear = new Date().getFullYear();
        for (let year = 2020; year <= 2030; year++) {
            years.push(year.toString());
        }
        return years;
    };

    if (isFetching) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
            </View>
        );
    }

    // Kiểm tra STT hiện tại có trùng không
    const isSequenceDuplicate = () => {
        if (!formData.sequenceNumber || formData.sequenceNumber.length < 3) return false;
        if (!formData.year || !formData.departmentId) return false;
        const selectedDept = departments.find(d => d._id === formData.departmentId);
        if (!selectedDept) return false;
        return checkSequenceExists(formData.year, selectedDept.code, formData.sequenceNumber);
    };

    return (
        <ScrollView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={28} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Tạo tài khoản sinh viên</Text>
                <View style={styles.headerRight} />
            </View>

            {/* Form tạo sinh viên */}
            <Card style={styles.card}>
                <Card.Content>
                    {/* Họ tên */}
                    <TextInput
                        label="Họ và tên"
                        value={formData.fullName}
                        onChangeText={text => setFormData(prev => ({ ...prev, fullName: text }))}
                        mode="outlined"
                        style={styles.input}
                    />

                    {/* Chọn Năm học */}
                    <View style={styles.pickerContainer}>
                        <Text style={styles.pickerLabel}>Năm học</Text>
                        <View style={styles.pickerRow}>
                            <View style={styles.pickerWrapper}>
                                <List.Section style={styles.pickerList}>
                                    <List.Accordion
                                        title={formData.year ? `${formData.year} - ${parseInt(formData.year) + 1}` : 'Chọn năm học'}
                                        left={props => <List.Icon {...props} icon="calendar" />}
                                    >
                                        {getYearOptions().map(year => (
                                            <List.Item
                                                key={year}
                                                title={`${year} - ${parseInt(year) + 1}`}
                                                description={`Năm học ${year}`}
                                                onPress={() => {
                                                    setFormData(prev => ({ ...prev, year: year }));
                                                }}
                                            />
                                        ))}
                                    </List.Accordion>
                                </List.Section>
                            </View>
                        </View>
                    </View>

                    {/* Số thứ tự (3 số cuối) */}
                    <View>
                        <TextInput
                            label="Số thứ tự (3 số, VD: 001, 002, ...)"
                            value={formData.sequenceNumber}
                            onChangeText={handleManualSequenceChange}
                            mode="outlined"
                            style={[
                                styles.input,
                                isSequenceDuplicate() && styles.inputError,
                            ]}
                            keyboardType="numeric"
                            maxLength={3}
                            right={
                                <TextInput.Icon
                                    icon={isSequenceDuplicate() ? "alert-circle" : "check-circle"}
                                    color={isSequenceDuplicate() ? "#dc3545" : "#28a745"}
                                />
                            }
                        />
                        {isSequenceDuplicate() && (
                            <Text style={styles.errorText}>⚠️ STT này đã tồn tại! Vui lòng chọn STT khác.</Text>
                        )}
                        {formData.sequenceNumber && formData.sequenceNumber.length === 3 && !isSequenceDuplicate() && (
                            <Text style={styles.successText}>✅ STT hợp lệ, chưa tồn tại</Text>
                        )}
                    </View>

                    {/* Chọn Khoa */}
                    <View style={styles.pickerContainer}>
                        <Text style={styles.pickerLabel}>Khoa</Text>
                        <View style={styles.pickerRow}>
                            <View style={styles.pickerWrapper}>
                                <List.Section style={styles.pickerList}>
                                    <List.Accordion
                                        title={formData.facultyId ? faculties.find(f => f._id === formData.facultyId)?.name || 'Chọn khoa' : 'Chọn khoa'}
                                        left={props => <List.Icon {...props} icon="school" />}
                                    >
                                        {faculties.map(faculty => (
                                            <List.Item
                                                key={faculty._id}
                                                title={faculty.name}
                                                description={faculty.code}
                                                onPress={() => {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        facultyId: faculty._id,
                                                        departmentId: '',
                                                    }));
                                                    setSelectedFacultyId(faculty._id);
                                                }}
                                            />
                                        ))}
                                    </List.Accordion>
                                </List.Section>
                            </View>
                            <IconButton
                                icon="plus-circle"
                                size={32}
                                iconColor="#007AFF"
                                onPress={() => {
                                    setModalType('faculty');
                                    setModalName('');
                                    setModalCode('');
                                    setEditingItem(null);
                                    setModalVisible(true);
                                }}
                            />
                        </View>
                    </View>

                    {/* Chọn Ngành */}
                    <View style={styles.pickerContainer}>
                        <Text style={styles.pickerLabel}>Ngành</Text>
                        <View style={styles.pickerRow}>
                            <View style={styles.pickerWrapper}>
                                <List.Section style={styles.pickerList}>
                                    <List.Accordion
                                        title={
                                            formData.departmentId
                                                ? departments.find(d => d._id === formData.departmentId)?.name || 'Chọn ngành'
                                                : 'Chọn ngành'
                                        }
                                        left={props => <List.Icon {...props} icon="book-open" />}
                                    >
                                        {departments
                                            .filter(d => d.facultyId === formData.facultyId)
                                            .map(dept => (
                                                <List.Item
                                                    key={dept._id}
                                                    title={dept.name}
                                                    description={dept.code}
                                                    onPress={() => {
                                                        setFormData(prev => ({ ...prev, departmentId: dept._id }));
                                                    }}
                                                />
                                            ))}
                                    </List.Accordion>
                                </List.Section>
                            </View>
                            {formData.facultyId && (
                                <IconButton
                                    icon="plus-circle"
                                    size={32}
                                    iconColor="#007AFF"
                                    onPress={() => {
                                        setModalType('department');
                                        setModalName('');
                                        setModalCode('');
                                        setEditingItem(null);
                                        setSelectedFacultyId(formData.facultyId);
                                        setModalVisible(true);
                                    }}
                                />
                            )}
                        </View>
                    </View>

                    {/* MSSV tự động */}
                    <TextInput
                        label="MSSV (tự động)"
                        value={formData.studentId.toUpperCase()}
                        mode="outlined"
                        style={styles.input}
                        disabled
                        right={<TextInput.Icon icon="badge-account" />}
                    />

                    {/* Email tự động */}
                    <TextInput
                        label="Email (tự động)"
                        value={formData.email}
                        mode="outlined"
                        style={styles.input}
                        disabled
                        right={<TextInput.Icon icon="email" />}
                    />

                    {/* Password tự động */}
                    <TextInput
                        label="Mật khẩu (tự động)"
                        value={formData.password}
                        mode="outlined"
                        style={styles.input}
                        disabled
                        secureTextEntry
                        right={<TextInput.Icon icon="lock" />}
                    />

                    {/* Lớp */}
                    <TextInput
                        label="Lớp (VD: KTPM01)"
                        value={formData.class}
                        onChangeText={text => setFormData(prev => ({ ...prev, class: text }))}
                        mode="outlined"
                        style={styles.input}
                    />

                    {/* Số điện thoại */}
                    <TextInput
                        label="Số điện thoại"
                        value={formData.phone}
                        onChangeText={text => setFormData(prev => ({ ...prev, phone: text }))}
                        mode="outlined"
                        style={styles.input}
                        keyboardType="phone-pad"
                    />

                    {/* Địa chỉ */}
                    <TextInput
                        label="Địa chỉ"
                        value={formData.address}
                        onChangeText={text => setFormData(prev => ({ ...prev, address: text }))}
                        mode="outlined"
                        style={styles.input}
                        multiline
                        numberOfLines={2}
                    />

                    <Button
                        mode="contained"
                        onPress={handleCreateStudent}
                        loading={isLoading}
                        disabled={isLoading || isSequenceDuplicate()}
                        style={styles.createButton}
                    >
                        Tạo tài khoản
                    </Button>
                </Card.Content>
            </Card>

            {/* Modal thêm/sửa Khoa/Ngành */}
            <Modal
                animationType="slide"
                transparent
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            {editingItem ? 'Sửa' : 'Thêm'} {modalType === 'faculty' ? 'Khoa' : 'Ngành'}
                        </Text>

                        <TextInput
                            label="Tên"
                            value={modalName}
                            onChangeText={setModalName}
                            mode="outlined"
                            style={styles.modalInput}
                        />

                        <TextInput
                            label="Mã"
                            value={modalCode}
                            onChangeText={setModalCode}
                            mode="outlined"
                            style={styles.modalInput}
                            autoCapitalize="characters"
                        />

                        {modalType === 'department' && (
                            <View style={styles.modalPicker}>
                                <Text style={styles.modalPickerLabel}>Thuộc khoa</Text>
                                <List.Section>
                                    <List.Accordion
                                        title={faculties.find(f => f._id === selectedFacultyId)?.name || 'Chọn khoa'}
                                    >
                                        {faculties.map(f => (
                                            <List.Item
                                                key={f._id}
                                                title={f.name}
                                                description={f.code}
                                                onPress={() => setSelectedFacultyId(f._id)}
                                            />
                                        ))}
                                    </List.Accordion>
                                </List.Section>
                            </View>
                        )}

                        <View style={styles.modalButtons}>
                            <Button
                                mode="outlined"
                                onPress={() => setModalVisible(false)}
                                style={styles.modalCancel}
                            >
                                Hủy
                            </Button>
                            <Button
                                mode="contained"
                                onPress={handleSaveModal}
                                style={styles.modalSave}
                            >
                                {editingItem ? 'Cập nhật' : 'Thêm'}
                            </Button>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}