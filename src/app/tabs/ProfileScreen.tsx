import React from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    Switch,
    Alert
} from "react-native";
import * as ImagePicker from 'expo-image-picker';
import { useState, useEffect } from 'react';
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ProfileScreen() {
    const router = useRouter();
    const { user, logout } = useAuth();
    const [avatar, setAvatar] = useState<string | null>(null);

    // Dữ liệu giả định
    const studentName = user?.fullName || "Nguyễn Trường Phúc";
    const studentId = user?.studentId || "KTPM2311047";

    // Danh sách menu
    const menuItems = [
        {
            id: 1,
            icon: "person-outline",
            title: "Thông tin sinh viên",
            onPress: () => router.push("../screens-for-profile/StudentInfoScreen"),
        },
        // {
        //     id: 2,
        //     icon: "lock-closed-outline",
        //     title: "Đổi mật khẩu",
        //     onPress: () => router.push("/screens/ChangePasswordScreen"),
        // },
        // {
        //     id: 3,
        //     icon: "document-text-outline",
        //     title: "Điều khoản và chính sách sử dụng",
        //     onPress: () => router.push("/screens/TermsScreen"),
        // },
        // {
        //     id: 4,
        //     icon: "chatbubble-outline",
        //     title: "Góp ý ứng dụng",
        //     onPress: () => router.push("/screens/FeedbackScreen"),
        // },
        // {
        //     id: 5,
        //     icon: "notifications-outline",
        //     title: "Thông báo",
        //     onPress: () => router.push("/screens/NotificationScreen"),
        // },
        // {
        //     id: 6,
        //     icon: "log-out-outline",
        //     title: "Đăng xuất",
        //     onPress: () => {
        //         // Xử lý đăng xuất
        //         logout();
        //         router.replace("/screens/LoginScreen");
        //     },
        //     isLogout: true,
        // },
    ];

    const pickImage = async () => {
        const permission =
            await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
            Alert.alert(
                'Thông báo',
                'Cần cấp quyền truy cập thư viện ảnh'
            );
            return;
        }

        const result =
            await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 1,
            });

        if (!result.canceled) {
            const uri = result.assets[0].uri;

            setAvatar(uri);

            await AsyncStorage.setItem(
                'student_avatar',
                uri
            );
        }
    };
    useEffect(() => {
        loadAvatar();
    }, []);

    const loadAvatar = async () => {
        try {
            const saved =
                await AsyncStorage.getItem(
                    'student_avatar'
                );

            if (saved) {
                setAvatar(saved);
            }
        } catch (err) {
            console.log(err);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header với thông tin sinh viên */}
                <View style={styles.header}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            {avatar ? (
                                <Image
                                    source={{ uri: avatar }}
                                    style={styles.avatarImage}
                                />
                            ) : (
                                <Text style={styles.avatarText}>
                                    {studentName.charAt(0)}
                                </Text>
                            )}
                        </View>
                        <TouchableOpacity
                            style={styles.editButton}
                            onPress={pickImage}
                        >
                            <Ionicons
                                name="camera-outline"
                                size={20}
                                color="#fff"
                            />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.studentName}>{studentName}</Text>
                    <Text style={styles.studentId}>MSSV: {studentId}</Text>
                </View>

                {/* Menu items */}
                <View style={styles.menuContainer}>
                    {menuItems.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={[
                                styles.menuItem,
                                item.isLogout && styles.logoutItem,
                            ]}
                            onPress={item.onPress}
                            activeOpacity={0.7}
                        >
                            <View style={styles.menuItemLeft}>
                                <Ionicons
                                    name={item.icon as any}
                                    size={24}
                                    color={item.isLogout ? "#FF3B30" : "#214D8A"}
                                    style={styles.menuIcon}
                                />
                                <Text
                                    style={[
                                        styles.menuText,
                                        item.isLogout && styles.logoutText,
                                    ]}
                                >
                                    {item.title}
                                </Text>
                            </View>
                            {!item.isLogout && (
                                <Ionicons
                                    name="chevron-forward-outline"
                                    size={20}
                                    color="#999"
                                />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Version info */}
                <View style={styles.versionContainer}>
                    <Text style={styles.versionText}>Phiên bản 1.4.8</Text>
                </View>

                <View style={styles.footer} />
            </ScrollView>

            {/* Bottom Navigation */}

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F5F6FA",
    },

    header: {
        backgroundColor: "#214D8A",
        paddingVertical: 30,
        paddingHorizontal: 20,
        alignItems: "center",
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },

    avatarContainer: {
        position: "relative",
        marginBottom: 12,
    },

    avatar: {
        width: 110,
        height: 110,
        borderRadius: 55,
        overflow: 'hidden',
        backgroundColor: '#214D8A',
        justifyContent: 'center',
        alignItems: 'center',
    },

    avatarImage: {
        width: '100%',
        height: '100%',
    },

    avatarText: {
        color: '#fff',
        fontSize: 42,
        fontWeight: 'bold',
    },
    editButton: {
        position: "absolute",
        bottom: 0,
        right: 0,
        backgroundColor: "#4F7BFF",
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: "#FFF",
    },

    studentName: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#FFF",
        marginTop: 4,
    },

    studentId: {
        fontSize: 14,
        color: "#DDD",
        marginTop: 4,
    },

    menuContainer: {
        marginTop: 20,
        marginHorizontal: 16,
        backgroundColor: "#FFF",
        borderRadius: 16,
        paddingVertical: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },

    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#F0F0F0",
    },

    menuItemLeft: {
        flexDirection: "row",
        alignItems: "center",
    },

    menuIcon: {
        marginRight: 14,
    },

    menuText: {
        fontSize: 15,
        color: "#1a1a2e",
    },

    logoutItem: {
        borderBottomWidth: 0,
    },

    logoutText: {
        color: "#FF3B30",
    },

    versionContainer: {
        alignItems: "center",
        marginTop: 20,
        marginBottom: 80,
    },

    versionText: {
        fontSize: 14,
        color: "#999",
    },

    footer: {
        height: 20,
    },

    // Bottom Navigation
    bottomNav: {
        flexDirection: "row",
        backgroundColor: "#FFF",
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderTopWidth: 1,
        borderTopColor: "#E8E8E8",
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
    },

    bottomNavItem: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 4,
    },

    bottomNavLabel: {
        fontSize: 11,
        color: "#999",
        marginTop: 2,
    },

    bottomNavLabelActive: {
        color: "#214D8A",
        fontWeight: "600",
    },
});