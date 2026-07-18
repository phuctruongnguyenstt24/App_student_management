import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from '../../a_styles/style_admin_management';

// ✅ Import API_URL từ api.ts
import { API_URL } from '../../config/api';

interface Admin {
    _id: string;
    username: string;
    fullName: string;
    email: string;
    phone: string;
    address: string;
    role: string;
    status: string;
    avatar: string;
    createdAt: string;
}

export default function AdminManagement() {
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
    const [formData, setFormData] = useState({
        username: '',
        fullName: '',
        email: '',
        password: '',
        phone: '',
        address: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [userName, setUserName] = useState('');
    const [currentDate, setCurrentDate] = useState('');
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [avatar, setAvatar] = useState('');

    useEffect(() => {
        getUserInfo();
        getCurrentDate();
        fetchAdmins();
    }, []);

    const getUserInfo = async () => {
        try {
            const userData = await AsyncStorage.getItem('user');
            if (userData) {
                const user = JSON.parse(userData);
                setUserName(user.fullName || user.username || 'Admin');
                setAvatar(user.avatar || '');
            }
        } catch (error) {
            console.error('Error getting user info:', error);
        }
    };

    const getCurrentDate = () => {
        const now = new Date();
        const options: Intl.DateTimeFormatOptions = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        setCurrentDate(now.toLocaleDateString('vi-VN', options));
    };

    // ✅ Lấy danh sách Admin - Gọi trực tiếp
    const fetchAdmins = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('token');

            const response = await fetch(`${API_URL}/admin`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            console.log('📋 Danh sách admin:', data);

            if (data.success) {
                setAdmins(data.admins || []);
            } else {
                Alert.alert('Lỗi', data.message || 'Không thể tải danh sách admin');
            }
        } catch (error: any) {
            console.error('❌ Error fetching admins:', error);
            Alert.alert('Lỗi', 'Không thể kết nối đến server');
        } finally {
            setLoading(false);
        }
    };

    // ✅ Tạo Admin mới - Gọi trực tiếp
    const handleCreateAdmin = async () => {
        // Validate
        if (!formData.username || !formData.fullName || !formData.email || !formData.password) {
            Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin bắt buộc');
            return;
        }

        if (formData.password.length < 5) {
            Alert.alert('Lỗi', 'Mật khẩu phải có ít nhất 5 ký tự');
            return;
        }

        try {
            const token = await AsyncStorage.getItem('token');

            const response = await fetch(`${API_URL}/admin/create`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            console.log('✅ Tạo admin:', data);

            if (data.success) {
                Alert.alert('Thành công', 'Tạo tài khoản Admin thành công');
                setShowModal(false);
                resetForm();
                fetchAdmins();
            } else {
                Alert.alert('Lỗi', data.message || 'Không thể tạo admin');
            }
        } catch (error) {
            console.error('❌ Error creating admin:', error);
            Alert.alert('Lỗi', 'Có lỗi xảy ra khi tạo admin');
        }
    };

    // ✅ Cập nhật Admin - Gọi trực tiếp
    const handleUpdateAdmin = async () => {
        if (!editingAdmin?._id) {
            Alert.alert('Lỗi', 'Không tìm thấy admin để cập nhật');
            return;
        }

        try {
            const token = await AsyncStorage.getItem('token');

            const updateData = {
                fullName: formData.fullName,
                phone: formData.phone,
                address: formData.address
            };

            const response = await fetch(`${API_URL}/admin/${editingAdmin._id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });

            const data = await response.json();
            console.log('✅ Cập nhật admin:', data);

            if (data.success) {
                Alert.alert('Thành công', 'Cập nhật admin thành công');
                setShowModal(false);
                resetForm();
                fetchAdmins();
            } else {
                Alert.alert('Lỗi', data.message || 'Không thể cập nhật admin');
            }
        } catch (error) {
            console.error('❌ Error updating admin:', error);
            Alert.alert('Lỗi', 'Có lỗi xảy ra khi cập nhật admin');
        }
    };

    // ✅ Xóa Admin - Gọi trực tiếp
    const handleDeleteAdmin = (id: string, username: string) => {
        Alert.alert(
            'Xóa Admin',
            `Bạn có chắc muốn xóa admin "${username}"?`,
            [
                { text: 'Hủy', style: 'cancel' },
                { text: 'Xóa', style: 'destructive', onPress: () => confirmDeleteAdmin(id) }
            ]
        );
    };

    const confirmDeleteAdmin = async (id: string) => {
        try {
            const token = await AsyncStorage.getItem('token');

            const response = await fetch(`${API_URL}/admin/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            console.log('🗑️ Xóa admin:', data);

            if (data.success) {
                Alert.alert('Thành công', 'Xóa admin thành công');
                fetchAdmins();
            } else {
                Alert.alert('Lỗi', data.message || 'Không thể xóa admin');
            }
        } catch (error) {
            console.error('❌ Error deleting admin:', error);
            Alert.alert('Lỗi', 'Có lỗi xảy ra khi xóa admin');
        }
    };

    // ✅ Toggle trạng thái Admin - Thu hồi quyền khi vô hiệu hóa
    const handleToggleStatus = (id: string, currentStatus: string, username: string) => {
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        const action = newStatus === 'active' ? 'kích hoạt và cấp lại quyền admin' : 'vô hiệu hóa và thu hồi quyền admin';

        Alert.alert(
            'Xác nhận thay đổi',
            `Bạn có chắc muốn ${action} tài khoản "${username}"?`,
            [
                { text: 'Hủy', style: 'cancel' },
                { text: 'Xác nhận', onPress: () => confirmToggleStatus(id) }
            ]
        );
    };

    const confirmToggleStatus = async (id: string) => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('token');

            const response = await fetch(`${API_URL}/admin/${id}/toggle-status`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            console.log('🔄 Toggle status:', data);

            if (data.success) {
                Alert.alert('Thành công', data.message);
                fetchAdmins();
            } else {
                Alert.alert('Lỗi', data.message || 'Không thể thay đổi trạng thái');
            }
        } catch (error) {
            console.error('❌ Error toggling status:', error);
            Alert.alert('Lỗi', 'Có lỗi xảy ra');
        } finally {
            setLoading(false);
        }
    };
    const resetForm = () => {
        setFormData({
            username: '',
            fullName: '',
            email: '',
            password: '',
            phone: '',
            address: ''
        });
        setEditingAdmin(null);
        setShowPassword(false);
    };

    const handleEdit = (admin: Admin) => {
        setEditingAdmin(admin);
        setFormData({
            username: admin.username,
            fullName: admin.fullName,
            email: admin.email,
            password: '',
            phone: admin.phone || '',
            address: admin.address || ''
        });
        setShowModal(true);
    };

    const handleLogout = async () => {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
        router.replace('/login');
    };

    const toggleProfileMenu = () => {
        setShowProfileMenu(!showProfileMenu);
    };

    const filteredAdmins = admins.filter(admin =>
        admin.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        admin.email?.toLowerCase().includes(search.toLowerCase()) ||
        admin.username?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <SafeAreaView style={styles.safeContainer} edges={['top', 'right']}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <TouchableOpacity onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={28} color="#333" />
                        </TouchableOpacity>
                        <View style={{ marginLeft: 12 }}>
                            <Text style={styles.greeting}>{userName.toUpperCase()}</Text>
                            <Text style={styles.dateText}>{currentDate}</Text>
                        </View>
                    </View>
                    <View style={styles.headerRight}>
                        <TouchableOpacity style={styles.notificationButton}>
                            <Ionicons name="notifications-outline" size={28} color="#333" />
                            <View style={styles.notificationBadge}>
                                <Text style={styles.badgeText}>3</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={toggleProfileMenu}>

                        </TouchableOpacity>
                    </View>
                </View>

                {/* Body */}
                <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="shield-outline" size={24} color="#6C63FF" />
                        <Text style={styles.sectionTitle}>Quản lý Admin</Text>
                    </View>

                    {/* Search và Add Button */}
                    <View style={styles.actionBar}>
                        <View style={styles.searchContainer}>
                            <Ionicons name="search-outline" size={20} color="#888" style={styles.searchIcon} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Tìm kiếm admin..."
                                value={search}
                                onChangeText={setSearch}
                                placeholderTextColor="#999"
                            />
                        </View>
                        <TouchableOpacity
                            style={styles.addButton}
                            onPress={() => {
                                resetForm();
                                setShowModal(true);
                            }}
                        >
                            <Ionicons name="add" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {/* Loading */}
                    {loading ? (
                        <ActivityIndicator size="large" color="#6C63FF" style={styles.loading} />
                    ) : filteredAdmins.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="people-outline" size={60} color="#ccc" />
                            <Text style={styles.emptyText}>Chưa có admin nào</Text>
                        </View>
                    ) : (
                        /* Admin List */
                        filteredAdmins.map((admin) => (
                            <View key={admin._id} style={styles.adminCard}>
                                <View style={styles.adminHeader}>
                                    <View style={styles.adminInfo}>
                                        <View style={styles.avatarContainer}>
                                            <Image
                                                source={{ uri: admin.avatar }}
                                                style={styles.adminAvatar}
                                            />
                                        </View>
                                        <View>
                                            <Text style={styles.adminName}>{admin.fullName}</Text>
                                            <Text style={styles.adminUsername}>@{admin.username}</Text>
                                            <Text style={styles.adminEmail}>{admin.email}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.adminStatus}>
                                        <View style={[
                                            styles.statusBadge,
                                            admin.status === 'active' ? styles.statusActive : styles.statusInactive
                                        ]}>
                                            <Text style={styles.statusText}>
                                                {admin.status === 'active' ? 'Hoạt động' : 'Vô hiệu hóa'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.adminDetails}>
                                    {admin.phone && (
                                        <View style={styles.detailItem}>
                                            <Ionicons name="call-outline" size={16} color="#666" />
                                            <Text style={styles.detailText}>{admin.phone}</Text>
                                        </View>
                                    )}
                                    {admin.address && (
                                        <View style={styles.detailItem}>
                                            <Ionicons name="location-outline" size={16} color="#666" />
                                            <Text style={styles.detailText}>{admin.address}</Text>
                                        </View>
                                    )}
                                    <View style={styles.detailItem}>
                                        <Ionicons name="calendar-outline" size={16} color="#666" />
                                        <Text style={styles.detailText}>
                                            {new Date(admin.createdAt).toLocaleDateString('vi-VN')}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.adminActions}>
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.actionToggle]}
                                        onPress={() => handleToggleStatus(admin._id, admin.status, admin.username)}
                                    >
                                        <Ionicons
                                            name={admin.status === 'active' ? 'close-circle-outline' : 'checkmark-circle-outline'}
                                            size={20}
                                            color={admin.status === 'active' ? '#ff6b6b' : '#51cf66'}
                                        />
                                        <Text style={[styles.actionText, { color: admin.status === 'active' ? '#ff6b6b' : '#51cf66' }]}>
                                            {admin.status === 'active' ? 'Vô hiệu hóa' : 'Kích hoạt'}
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.actionEdit]}
                                        onPress={() => handleEdit(admin)}
                                    >
                                        <Ionicons name="pencil-outline" size={20} color="#4A90E2" />
                                        <Text style={styles.actionEditText}>Sửa</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.actionDelete]}
                                        onPress={() => handleDeleteAdmin(admin._id, admin.username)}
                                    >
                                        <Ionicons name="trash-outline" size={20} color="#dc3545" />
                                        <Text style={styles.actionDeleteText}>Xóa</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))
                    )}
                </ScrollView>

                {/* Modal Create/Edit Admin */}
                <Modal
                    visible={showModal}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setShowModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>
                                    {editingAdmin ? 'Chỉnh sửa Admin' : 'Tạo Admin mới'}
                                </Text>
                                <TouchableOpacity onPress={() => setShowModal(false)}>
                                    <Ionicons name="close" size={28} color="#333" />
                                </TouchableOpacity>
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false}>
                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Tên đăng nhập *</Text>
                                    <View style={styles.inputContainer}>
                                        <Ionicons name="person-outline" size={20} color="#888" style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Nhập tên đăng nhập"
                                            value={formData.username}
                                            onChangeText={(text) => setFormData({ ...formData, username: text })}
                                            editable={!editingAdmin}
                                            placeholderTextColor="#999"
                                            autoCapitalize="none"
                                        />
                                    </View>
                                </View>

                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Họ tên *</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Nhập họ tên"
                                        value={formData.fullName}
                                        onChangeText={(text) => setFormData({ ...formData, fullName: text })}
                                        placeholderTextColor="#999"
                                    />
                                </View>

                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Email *</Text>
                                    <View style={styles.inputContainer}>
                                        <Ionicons name="mail-outline" size={20} color="#888" style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Nhập email"
                                            value={formData.email}
                                            onChangeText={(text) => setFormData({ ...formData, email: text })}
                                            keyboardType="email-address"
                                            editable={!editingAdmin}
                                            placeholderTextColor="#999"
                                            autoCapitalize="none"
                                        />
                                    </View>
                                </View>

                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>
                                        {editingAdmin ? 'Mật khẩu (để trống nếu không đổi)' : 'Mật khẩu *'}
                                    </Text>
                                    <View style={styles.inputContainer}>
                                        <Ionicons name="lock-closed-outline" size={20} color="#888" style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Nhập mật khẩu"
                                            value={formData.password}
                                            onChangeText={(text) => setFormData({ ...formData, password: text })}
                                            secureTextEntry={!showPassword}
                                            placeholderTextColor="#999"
                                        />
                                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                                            <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color="#888" />
                                        </TouchableOpacity>
                                    </View>
                                    {!editingAdmin && (
                                        <Text style={styles.hintText}>Mật khẩu phải có ít nhất 5 ký tự</Text>
                                    )}
                                </View>

                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Số điện thoại</Text>
                                    <View style={styles.inputContainer}>
                                        <Ionicons name="call-outline" size={20} color="#888" style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Nhập số điện thoại"
                                            value={formData.phone}
                                            onChangeText={(text) => setFormData({ ...formData, phone: text })}
                                            keyboardType="phone-pad"
                                            placeholderTextColor="#999"
                                        />
                                    </View>
                                </View>

                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Địa chỉ</Text>
                                    <View style={styles.inputContainer}>
                                        <Ionicons name="location-outline" size={20} color="#888" style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Nhập địa chỉ"
                                            value={formData.address}
                                            onChangeText={(text) => setFormData({ ...formData, address: text })}
                                            placeholderTextColor="#999"
                                        />
                                    </View>
                                </View>

                                <View style={styles.modalActions}>
                                    <TouchableOpacity
                                        style={[styles.modalButton, styles.modalButtonCancel]}
                                        onPress={() => setShowModal(false)}
                                    >
                                        <Text style={styles.modalButtonText}>Hủy</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.modalButton, styles.modalButtonSubmit]}
                                        onPress={editingAdmin ? handleUpdateAdmin : handleCreateAdmin}
                                    >
                                        <Text style={[styles.modalButtonText, { color: '#fff' }]}>
                                            {editingAdmin ? 'Cập nhật' : 'Tạo Admin'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </ScrollView>
                        </View>
                    </View>
                </Modal>

                {/* Profile Menu Popup */}
                {showProfileMenu && (
                    <TouchableOpacity
                        style={styles.overlay}
                        activeOpacity={1}
                        onPress={toggleProfileMenu}
                    >
                        <View style={styles.profileMenu}>
                            <View style={styles.profileHeader}>
                                <Image
                                    source={{ uri: avatar }}
                                    style={styles.profileAvatar}
                                />
                                <View>
                                    <Text style={styles.profileName}>{userName}</Text>
                                    <Text style={styles.profileRole}>Quản trị viên</Text>
                                </View>
                            </View>

                            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/admin/AdminProfileScreen' as any)}>
                                <Ionicons name="person-outline" size={22} color="#333" />
                                <Text style={styles.menuItemText}>Thông tin cá nhân</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/admin/ChangePasswordScreen' as any)}>
                                <Ionicons name="lock-closed-outline" size={22} color="#333" />
                                <Text style={styles.menuItemText}>Đổi mật khẩu</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={handleLogout}>
                                <Ionicons name="log-out-outline" size={22} color="#dc3545" />
                                <Text style={[styles.menuItemText, styles.logoutText]}>Đăng xuất</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
}