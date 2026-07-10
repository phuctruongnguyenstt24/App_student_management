// app/admin/FeedbackManagementScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { API_URL } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';

// Interface cho feedback - đồng bộ với backend
interface Feedback {
    _id: string;
    user: {
        _id: string;
        fullName?: string;
        studentId?: string;
        email?: string;
        phone?: string;
    };
    content: string;
    status: 'pending' | 'reviewed' | 'resolved';
    createdAt: string;
    updatedAt: string;
}

// Interface response từ backend
interface FeedbackResponse {
    success: boolean;
    count: number;
    feedbacks: Feedback[];
}

export default function FeedbackManagementScreen() {
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [filteredFeedbacks, setFilteredFeedbacks] = useState<Feedback[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<string>('all');
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [stats, setStats] = useState({ total: 0, pending: 0, reviewed: 0, resolved: 0 });
    const { token } = useAuth();

    // Helper: Lấy token
    const getToken = async () => token || await AsyncStorage.getItem('token');

    // Helper: Fetch với auth
    const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
        const authToken = await getToken();
        if (!authToken) throw new Error('No token');
        
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
        return response;
    };

    // Lấy danh sách feedback
    const loadFeedbacks = useCallback(async () => {
        try {
            const response = await fetchWithAuth('/feedback');
            
            if (!response.ok) {
                if (response.status === 403) {
                    Alert.alert('Lỗi', 'Bạn không có quyền truy cập');
                    router.replace('/tabs/HomeScreen');
                    return;
                }
                throw new Error('Không thể tải danh sách');
            }

            const data: FeedbackResponse = await response.json();
            if (data.success) {
                setFeedbacks(data.feedbacks);
                updateStats(data.feedbacks);
                filterFeedbacks(data.feedbacks, selectedStatus);
            }
        } catch (error) {
            console.error('Lỗi tải feedback:', error);
            Alert.alert('Lỗi', 'Không thể kết nối đến máy chủ');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [selectedStatus]);

    // Cập nhật thống kê
    const updateStats = (data: Feedback[]) => {
        setStats({
            total: data.length,
            pending: data.filter(f => f.status === 'pending').length,
            reviewed: data.filter(f => f.status === 'reviewed').length,
            resolved: data.filter(f => f.status === 'resolved').length
        });
    };

    // Lọc feedback
    const filterFeedbacks = (data: Feedback[], status: string) => {
        setFilteredFeedbacks(status === 'all' ? data : data.filter(f => f.status === status));
    };

    useEffect(() => {
        loadFeedbacks();
    }, []);

    // Refresh
    const onRefresh = () => {
        setIsRefreshing(true);
        loadFeedbacks();
    };

    // Xử lý lọc
    const handleStatusFilter = (status: string) => {
        setSelectedStatus(status);
        filterFeedbacks(feedbacks, status);
    };

    // Mở modal
    const openFeedbackDetail = (feedback: Feedback) => {
        setSelectedFeedback(feedback);
        setReplyContent('');
        setIsModalVisible(true);
    };

    // Cập nhật trạng thái
    const updateFeedbackStatus = async (feedbackId: string, status: string) => {
        try {
            const response = await fetchWithAuth(`/feedback/${feedbackId}`, {
                method: 'PUT',
                body: JSON.stringify({ status })
            });

            if (response.ok) {
                await loadFeedbacks();
                Alert.alert('Thành công', 'Đã cập nhật trạng thái');
            } else {
                Alert.alert('Lỗi', 'Không thể cập nhật trạng thái');
            }
        } catch (error) {
            console.error('Lỗi cập nhật:', error);
            Alert.alert('Lỗi', 'Không thể kết nối đến máy chủ');
        }
    };

   

    // Xóa feedback
    const deleteFeedback = async (feedbackId: string) => {
        Alert.alert(
            'Xác nhận xóa',
            'Bạn có chắc muốn xóa góp ý này?',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const response = await fetchWithAuth(`/feedback/${feedbackId}`, {
                                method: 'DELETE'
                            });

                            if (response.ok) {
                                Alert.alert('Thành công', 'Đã xóa góp ý');
                                await loadFeedbacks();
                            } else {
                                Alert.alert('Lỗi', 'Không thể xóa góp ý');
                            }
                        } catch (error) {
                            console.error('Lỗi xóa:', error);
                            Alert.alert('Lỗi', 'Không thể kết nối đến máy chủ');
                        }
                    }
                }
            ]
        );
    };

    // Format date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Constants
    const STATUS_CONFIG = {
        pending: { color: '#FFA500', label: 'Chờ xử lý' },
        reviewed: { color: '#2196F3', label: 'Đã xem' },
        resolved: { color: '#4CAF50', label: 'Đã giải quyết' }
    };

    const getStatusColor = (status: keyof typeof STATUS_CONFIG) => STATUS_CONFIG[status]?.color || '#999';
    const getStatusText = (status: keyof typeof STATUS_CONFIG) => STATUS_CONFIG[status]?.label || status;

    // Render item feedback
    const renderFeedbackItem = ({ item }: { item: Feedback }) => (
        <TouchableOpacity style={styles.feedbackItem} onPress={() => openFeedbackDetail(item)}>
            <View style={styles.feedbackHeader}>
                <View style={styles.userInfo}>
                    <Ionicons name="person-circle-outline" size={32} color="#214D8A" />
                    <View style={styles.userText}>
                        <Text style={styles.userName}>{item.user?.fullName || 'Không có tên'}</Text>
                        {item.user?.studentId && (
                            <Text style={styles.userId}>MSSV: {item.user.studentId}</Text>
                        )}
                    </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                    <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
                </View>
            </View>
            <Text style={styles.feedbackContent} numberOfLines={2}>{item.content}</Text>
            <View style={styles.feedbackFooter}>
                <Text style={styles.feedbackDate}>{formatDate(item.createdAt)}</Text>
                <TouchableOpacity onPress={() => deleteFeedback(item._id)}>
                    <Ionicons name="trash-outline" size={20} color="#FF4444" />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    if (isLoading) {
        return (
            <SafeAreaView style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color="#214D8A" />
                <Text style={styles.loadingText}>Đang tải danh sách góp ý...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#0c0707" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Quản lý góp ý</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Thống kê */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsContainer}>
                {[
                    { key: 'all', label: 'Tất cả', count: stats.total },
                    { key: 'pending', label: 'Chờ xử lý', count: stats.pending, color: '#FFA500' },
                    { key: 'reviewed', label: 'Đã xem', count: stats.reviewed, color: '#2196F3' },
                    { key: 'resolved', label: 'Đã giải quyết', count: stats.resolved, color: '#4CAF50' }
                ].map(stat => (
                    <TouchableOpacity
                        key={stat.key}
                        style={[styles.statCard, selectedStatus === stat.key && styles.statCardActive]}
                        onPress={() => handleStatusFilter(stat.key)}
                    >
                        <Text style={[styles.statNumber, stat.color && { color: stat.color }]}>
                            {stat.count}
                        </Text>
                        <Text style={styles.statLabel}>{stat.label}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Danh sách feedback */}
            <FlatList
                data={filteredFeedbacks}
                keyExtractor={item => item._id}
                refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
                renderItem={renderFeedbackItem}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="chatbubble-outline" size={64} color="#ccc" />
                        <Text style={styles.emptyText}>Chưa có góp ý nào</Text>
                    </View>
                }
            />

            {/* Modal chi tiết */}
            <Modal visible={isModalVisible} animationType="slide" transparent onRequestClose={() => setIsModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Chi tiết góp ý</Text>
                            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        {selectedFeedback && (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                {/* Thông tin người gửi */}
                                <View style={styles.modalUserSection}>
                                    {[
                                        { label: 'Người gửi:', value: selectedFeedback.user?.fullName || 'Không có tên' },
                                        ...(selectedFeedback.user?.studentId ? [{ label: 'MSSV:', value: selectedFeedback.user.studentId }] : []),
                                        ...(selectedFeedback.user?.email ? [{ label: 'Email:', value: selectedFeedback.user.email }] : []),
                                        { label: 'Ngày gửi:', value: formatDate(selectedFeedback.createdAt) }
                                    ].map((item, index) => (
                                        <View key={index} style={styles.modalUserRow}>
                                            <Text style={styles.modalLabel}>{item.label}</Text>
                                            <Text style={styles.modalValue}>{item.value}</Text>
                                        </View>
                                    ))}
                                    <View style={styles.modalUserRow}>
                                        <Text style={styles.modalLabel}>Trạng thái:</Text>
                                        <View style={[styles.statusBadgeSmall, { backgroundColor: getStatusColor(selectedFeedback.status) }]}>
                                            <Text style={styles.statusTextSmall}>{getStatusText(selectedFeedback.status)}</Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Nội dung feedback */}
                                <View style={styles.modalContentSection}>
                                    <Text style={styles.modalSectionTitle}>📝 Nội dung góp ý</Text>
                                    <View style={styles.modalContentBox}>
                                        <Text style={styles.modalContentText}>{selectedFeedback.content}</Text>
                                    </View>
                                </View>

                                {/* Cập nhật trạng thái */}
                                <View style={styles.modalActionSection}>
                                    <Text style={styles.modalSectionTitle}>⚡ Cập nhật trạng thái</Text>
                                    <View style={styles.statusButtons}>
                                        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                                            <TouchableOpacity
                                                key={key}
                                                style={[
                                                    styles.statusButton,
                                                    selectedFeedback.status === key && styles.statusButtonActive,
                                                    { borderColor: config.color }
                                                ]}
                                                onPress={() => updateFeedbackStatus(selectedFeedback._id, key)}
                                            >
                                                <Text style={[
                                                    styles.statusButtonText,
                                                    selectedFeedback.status === key && { color: config.color }
                                                ]}>
                                                    {config.label}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
 
                          
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    centered: { justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, fontSize: 16, color: '#666' },
    header: {
        backgroundColor: '#f5f5f5',
        paddingVertical: 20,
        paddingHorizontal: 20,
        paddingTop: 10,
        marginTop: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#e8e8e8',
    },
    backButton: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0c0707' },
    statsContainer: { backgroundColor: '#fff', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e8e8e8' },
    statCard: {
        backgroundColor: '#f5f5f5',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        alignItems: 'center',
        minWidth: 80,
        borderWidth: 2,
        borderColor: 'transparent',
        marginHorizontal: 6,
    },
    statCardActive: { backgroundColor: '#e8f0fe', borderColor: '#214D8A' },
    statNumber: { fontSize: 24, fontWeight: 'bold', color: '#214D8A' },
    statLabel: { fontSize: 12, color: '#666', marginTop: 2 },
    feedbackItem: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginTop: 12,
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    feedbackHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    userInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    userText: { marginLeft: 10, flex: 1 },
    userName: { fontSize: 15, fontWeight: 'bold', color: '#333' },
    userId: { fontSize: 12, color: '#666', marginTop: 1 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    statusText: { color: '#fff', fontSize: 11, fontWeight: '600' },
    feedbackContent: { fontSize: 14, color: '#333', lineHeight: 20, marginVertical: 8 },
    feedbackFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 8 },
    feedbackDate: { fontSize: 12, color: '#999' },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
    emptyText: { fontSize: 16, color: '#999', marginTop: 12 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '90%',
        minHeight: '70%',
    },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#e8e8e8' },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#214D8A' },
    modalUserSection: { backgroundColor: '#f8f9fa', padding: 12, borderRadius: 10, marginBottom: 16 },
    modalUserRow: { flexDirection: 'row', paddingVertical: 4, alignItems: 'center' },
    modalLabel: { fontSize: 14, color: '#666', width: 85, fontWeight: '500' },
    modalValue: { fontSize: 14, color: '#333', flex: 1 },
    statusBadgeSmall: { paddingHorizontal: 10, paddingVertical: 2, borderRadius: 12 },
    statusTextSmall: { color: '#fff', fontSize: 11, fontWeight: '600' },
    modalContentSection: { marginBottom: 16 },
    modalSectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 8 },
    modalContentBox: { backgroundColor: '#f8f9fa', padding: 12, borderRadius: 10, minHeight: 80 },
    modalContentText: { fontSize: 14, color: '#333', lineHeight: 22 },
    modalActionSection: { marginBottom: 16 },
    statusButtons: { flexDirection: 'row', flexWrap: 'wrap' },
    statusButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 2, marginRight: 8, marginBottom: 4, backgroundColor: 'transparent' },
    statusButtonActive: { backgroundColor: '#f0f7ff' },
    statusButtonText: { fontSize: 13, color: '#666', fontWeight: '500' },
    modalReplySection: { marginBottom: 20 },
    replyInput: { backgroundColor: '#f8f9fa', borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#333', minHeight: 80, marginBottom: 12 },
    replyButton: { backgroundColor: '#214D8A', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
    replyButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});