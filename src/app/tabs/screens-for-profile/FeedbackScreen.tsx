// screens/FeedbackScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { API_URL } from '../../../config/api';
import { useAuth } from '../../../contexts/AuthContext';

export default function FeedbackScreen() {
    const [feedback, setFeedback] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [studentInfo, setStudentInfo] = useState({
        fullName: '',
        studentId: '',
        email: '',
        phone: ''
    });
    const [isLoadingUserInfo, setIsLoadingUserInfo] = useState(true);
    const { user, token, isLoading: authLoading } = useAuth(); // Lấy isLoading từ AuthContext

    // Lấy thông tin người dùng khi component mount
    useEffect(() => {
        // Nếu auth đang loading, chờ
        if (authLoading) {
            return;
        }

        // Nếu đã có user từ context, sử dụng luôn
        if (user) {
            setStudentInfo({
                fullName: user.fullName || user.name || '',
                studentId: user.studentId || user.student_id || user.mssv || '',
                email: user.email || '',
                phone: user.phone || user.phoneNumber || ''
            });
            setIsLoadingUserInfo(false);
            return;
        }

        // Nếu không có user nhưng có token, gọi API
        if (token) {
            loadUserInfoFromAPI();
        } else {
            // Không có token, chuyển về login
            Alert.alert('Lỗi', 'Vui lòng đăng nhập lại để tiếp tục.');
            router.replace('/login');
        }
    }, [authLoading, user, token]);

    const loadUserInfoFromAPI = async () => {
        try {
            setIsLoadingUserInfo(true);
            
            const response = await fetch(`${API_URL}/profile`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setStudentInfo({
                    fullName: data.fullName || data.name || '',
                    studentId: data.studentId || data.student_id || data.mssv || '',
                    email: data.email || '',
                    phone: data.phone || data.phoneNumber || ''
                });
            } else {
                // Nếu API lỗi, thử lấy từ AsyncStorage
                const userData = await AsyncStorage.getItem('userData');
                if (userData) {
                    const parsed = JSON.parse(userData);
                    setStudentInfo({
                        fullName: parsed.fullName || parsed.name || '',
                        studentId: parsed.studentId || parsed.student_id || parsed.mssv || '',
                        email: parsed.email || '',
                        phone: parsed.phone || parsed.phoneNumber || ''
                    });
                }
            }
        } catch (error) {
            console.error('Lỗi khi lấy thông tin người dùng:', error);
        } finally {
            setIsLoadingUserInfo(false);
        }
    };

    const handleSubmit = async () => {
        if (!feedback.trim()) {
            Alert.alert("Thông báo", "Vui lòng nhập nội dung góp ý trước khi gửi!");
            return;
        }

        // Kiểm tra thông tin người gửi
        if (!studentInfo.fullName || !studentInfo.studentId) {
            Alert.alert(
                "Thông báo",
                "Không tìm thấy thông tin sinh viên. Vui lòng đăng nhập lại.",
                [{ text: 'OK', onPress: () => router.replace('/login') }]
            );
            return;
        }

        setIsSubmitting(true);
        try {
            const authToken = token || await AsyncStorage.getItem('token');
            
            const feedbackData = {
                content: feedback.trim(),
                studentName: studentInfo.fullName,
                studentId: studentInfo.studentId,
                email: studentInfo.email,
                phone: studentInfo.phone,
                timestamp: new Date().toISOString()
            };

            const response = await fetch(`${API_URL}/feedback`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(feedbackData)
            });

            if (response.ok) {
                Alert.alert(
                    "Cảm ơn bạn!",
                    `Đã ghi nhận góp ý của bạn.\n\nSinh viên: ${studentInfo.fullName}\nMSSV: ${studentInfo.studentId}`,
                    [
                        { 
                            text: 'OK', 
                            onPress: () => {
                                setFeedback('');
                                router.back();
                            } 
                        }
                    ]
                );
            } else {
                const errorData = await response.json();
                Alert.alert("Lỗi", errorData.message || "Không thể gửi góp ý. Vui lòng thử lại.");
            }
        } catch (error) {
            console.error('Lỗi gửi feedback:', error);
            Alert.alert("Lỗi", "Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBack = () => {
        router.replace('/tabs/ProfileScreen');
    };

    // Hiển thị loading khi auth đang tải hoặc đang tải thông tin user
    if (authLoading || isLoadingUserInfo) {
        return (
            <SafeAreaView style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color="#214D8A" />
                <Text style={styles.loadingText}>Đang tải thông tin...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Ionicons name='arrow-back' size={24} color="#0c0707" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Góp ý ứng dụng</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.formContainer}>
                    <View style={styles.infoSection}>
                        <Text style={styles.infoTitle}>👤 Thông tin người gửi</Text>
                        
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Họ và tên:</Text>
                            <Text style={styles.infoValue}>{studentInfo.fullName || 'Chưa cập nhật'}</Text>
                        </View>
                        
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>MSSV:</Text>
                            <Text style={styles.infoValue}>{studentInfo.studentId || 'Chưa cập nhật'}</Text>
                        </View>
                        
                        {studentInfo.email && (
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Email:</Text>
                                <Text style={styles.infoValue}>{studentInfo.email}</Text>
                            </View>
                        )}
                        
                        {studentInfo.phone && (
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>SĐT:</Text>
                                <Text style={styles.infoValue}>{studentInfo.phone}</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.divider} />

                    {/* Nội dung góp ý */}
                    <Text style={styles.description}>
                        ✍️ Bạn có góp ý gì để ứng dụng tốt hơn không?
                    </Text>

                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Nhập nội dung góp ý của bạn..."
                            placeholderTextColor="#999"
                            multiline
                            numberOfLines={6}
                            value={feedback}
                            onChangeText={setFeedback}
                            textAlignVertical="top"
                        />
                        <Text style={styles.charCount}>
                            {feedback.length} ký tự
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.submitButton, isSubmitting && { opacity: 0.7 }]}
                        onPress={handleSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ?
                            <ActivityIndicator color="#fff" /> :
                            <Text style={styles.submitButtonText}>Gửi Góp Ý</Text>
                        }
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#666',
    },
    header: {
        backgroundColor: '#f5f5f5',
        paddingVertical: 20,
        paddingHorizontal: 20,
        paddingTop: 10,
        marginTop:15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#e8e8e8',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0c0707',
    },
    formContainer: {
        backgroundColor: '#fff',
        margin: 16,
        padding: 20,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    infoSection: {
        marginBottom: 16,
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#214D8A',
        marginBottom: 12,
    },
    infoRow: {
        flexDirection: 'row',
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    infoLabel: {
        fontSize: 14,
        color: '#666',
        width: 90,
        fontWeight: '500',
    },
    infoValue: {
        flex: 1,
        fontSize: 14,
        color: '#333',
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: '#e8e8e8',
        marginVertical: 16,
    },
    description: {
        fontSize: 16,
        color: '#333',
        marginBottom: 15,
    },
    inputContainer: {
        backgroundColor: '#F5F6FA',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        minHeight: 150,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: '#333',
        padding: 0,
        minHeight: 120,
    },
    charCount: {
        textAlign: 'right',
        fontSize: 12,
        color: '#999',
        marginTop: 4,
    },
    submitButton: {
        backgroundColor: '#214D8A',
        borderRadius: 10,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 30,
        marginBottom: 10,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});