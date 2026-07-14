// app/admin/profile.jsx
import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Alert,
    ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../../contexts/AuthContext";
import { API_URL } from "../../config/api";

const AdminProfileScreen = () => {
    const { user, logout, isLoading: authLoading } = useAuth();
    const [adminData, setAdminData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.id) {
            loadAdminProfile();
        }
    }, [user]);


    const loadAdminProfile = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('token');

            // Nếu admin cũng có studentId, có thể dùng API này
            const response = await fetch(
                `${API_URL}/students/${user?.id}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            const data = await response.json();

            if (data.success && data.student) {
                // Student API trả về đầy đủ thông tin
                setAdminData(data.student);
            } else {
                setAdminData(user);
            }
        } catch (error) {
            console.log("Error loading admin profile:", error);
            setAdminData(user);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    router.replace('/login');
  };

    const handleBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace("/admin/dashboard");
        }
    };

    // Lấy thông tin từ adminData hoặc user
    const getData = () => adminData || user;

    if (authLoading || loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={styles.loadingText}>Đang tải thông tin...</Text>
            </View>
        );
    }

    const data = getData();



    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Hồ sơ cá nhân</Text>
                </View>

                {/* Avatar và tên */}
                <View style={styles.profileCard}>
                    <View style={styles.avatarContainer}>
                        {data?.avatar ? (
                            <Image source={{ uri: data.avatar }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarText}>
                                    {data?.fullName?.charAt(0) || data?.username?.charAt(0) || "A"}
                                </Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.fullName}>{data?.fullName || data?.username || "Admin"}</Text>
                    <View style={styles.roleBadge}>
                        <Text style={styles.roleText}>
                            {data?.role === "admin" ? "Quản trị viên" : "Người dùng"}
                        </Text>
                    </View>
                </View>

                {/* Thông tin cơ bản */}
                <View style={styles.infoSection}>
                    <Text style={styles.sectionTitle}>Thông tin cơ bản</Text>

                    <View style={styles.infoItem}>
                        <Ionicons name="mail-outline" size={20} color="#666" />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Email</Text>
                            <Text style={styles.infoValue}>{data?.email || "Chưa cập nhật"}</Text>
                        </View>
                    </View>

                    <View style={styles.infoItem}>
                        <Ionicons name="person-outline" size={20} color="#666" />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Username</Text>
                            <Text style={styles.infoValue}>{data?.fullName || "Chưa cập nhật"}</Text>
                        </View>
                    </View>

                    <View style={styles.infoItem}>
                        <Ionicons name="call-outline" size={20} color="#666" />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Số điện thoại</Text>
                            <Text style={styles.infoValue}>
                                {data?.phone || user?.phone || "Chưa cập nhật"}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.infoItem}>
                        <Ionicons name="calendar-outline" size={20} color="#666" />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Ngày sinh</Text>
                            <Text style={styles.infoValue}>
                                {data?.dateOfBirth || data?.personalInfo?.dateOfBirth || "Chưa cập nhật"}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.infoItem}>
                        <Ionicons name="location-outline" size={20} color="#666" />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Địa chỉ</Text>
                            <Text style={styles.infoValue}>
                                {data?.address || data?.personalInfo?.address || data?.personalInfo?.permanentResidence || "Chưa cập nhật"}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.infoItem}>
                        <Ionicons name="person-circle-outline" size={20} color="#666" />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Giới tính</Text>
                            <Text style={styles.infoValue}>
                                {data?.gender === "male" ? "Nam" : data?.gender === "female" ? "Nữ" : data?.gender || data?.personalInfo?.gender || "Chưa cập nhật"}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Thông tin hệ thống */}
                <View style={styles.infoSection}>
                    <Text style={styles.sectionTitle}>Thông tin hệ thống</Text>

                    <View style={styles.infoItem}>
                        <Ionicons name="shield-checkmark-outline" size={20} color="#666" />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Quyền hạn</Text>
                            <Text style={styles.infoValue}>
                                {data?.role === "admin" ? "Quản trị viên" : "Người dùng"}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.infoItem}>
                        <Ionicons name="id-card-outline" size={20} color="#666" />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Mã số</Text>
                            <Text style={styles.infoValue}>
                                {data?.studentId || data?.id || "Chưa cập nhật"}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Nút đăng xuất */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={24} color="#ff4444" />
                    <Text style={styles.logoutText}>Đăng xuất</Text>
                </TouchableOpacity>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        © 2024 - Hệ thống quản lý đào tạo
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f5f5",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f5f5f5",
    },
    loadingText: {
        marginTop: 10,
        fontSize: 14,
        color: "#666",
    },
    header: {
        backgroundColor: "#4CAF50",
        padding: 16,
        paddingTop: 40,
        paddingBottom: 20,
    },
    backButton: {
        marginBottom: 8,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: "bold",
        color: "white",
    },
    profileCard: {
        backgroundColor: "white",
        margin: 16,
        padding: 20,
        borderRadius: 12,
        alignItems: "center",
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    avatarContainer: {
        marginBottom: 12,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: "#4CAF50",
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: "#4CAF50",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 3,
        borderColor: "#4CAF50",
    },
    avatarText: {
        fontSize: 40,
        fontWeight: "bold",
        color: "white",
    },
    fullName: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 6,
    },
    roleBadge: {
        backgroundColor: "#e8f5e9",
        paddingHorizontal: 16,
        paddingVertical: 4,
        borderRadius: 12,
    },
    roleText: {
        fontSize: 14,
        color: "#4CAF50",
        fontWeight: "500",
    },
    infoSection: {
        backgroundColor: "white",
        margin: 16,
        marginTop: 0,
        padding: 16,
        borderRadius: 12,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
        paddingBottom: 8,
    },
    infoItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#f5f5f5",
    },
    infoContent: {
        marginLeft: 12,
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        color: "#999",
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 15,
        color: "#333",
    },
    logoutButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "white",
        margin: 16,
        marginTop: 0,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#ff4444",
        gap: 8,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: "500",
        color: "#ff4444",
    },
    footer: {
        padding: 20,
        alignItems: "center",
    },
    footerText: {
        fontSize: 12,
        color: "#999",
    },
});

export default AdminProfileScreen;