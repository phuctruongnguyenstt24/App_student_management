import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_URL } from '../../config/api';
import { useAuth } from "../../contexts/AuthContext";


export default function ProfileScreen() {
    const router = useRouter();
    const { user, logout, token } = useAuth();
    const [student, setStudent] = useState<any>(null);
    const [avatar, setAvatar] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [loading, setLoading] = useState(true);

    // Lấy thông tin từ student hoặc user
    const studentName = student?.fullName || user?.fullName || "Nguyễn Trường Phúc";
    const studentId = student?.studentId || user?.studentId || "KTPM2311047";

   const menuItems = [
        {
            id: 1,
            icon: "person-outline",
            title: "Thông tin sinh viên",
            // Giữ nguyên, không truyền view thì sẽ hiển thị thông tin sinh viên
            onPress: () => router.push("/tabs/screens-for-profile/StudentInfoScreen"),
        },
        {
            id: 2,
            title: 'Đổi mật khẩu',
            icon: 'lock-closed-outline',
            onPress: () => router.push({
                pathname: '/tabs/screens-for-profile/StudentInfoScreen',
                params: { view: 'password' } // ✅ Kích hoạt giao diện đổi mật khẩu
            }),
        },
        {
            id: 3,
            icon: "document-text-outline",
            title: "Điều khoản và chính sách sử dụng",
            // ✅ Kích hoạt hành động mở link web điều khoản
            onPress: () => router.push({
                pathname: '/tabs/screens-for-profile/StudentInfoScreen',
                params: { view: 'terms' } 
            }),
        },
        {
            id: 4,
            icon: "chatbubble-outline",
            title: "Góp ý ứng dụng",
            // ✅ Kích hoạt giao diện form Góp ý
            onPress: () => router.push({
                pathname: '/tabs/screens-for-profile/StudentInfoScreen',
                params: { view: 'feedback' } 
            }),
        },
        {
            id: 5,
            icon: "notifications-outline",
            title: "Thông báo",
            onPress: () => router.push("/tabs/screens-for-profile/StudentInfoScreen"),
        },
        {
            id: 6,
            icon: "log-out-outline",
            title: "Đăng xuất",
            onPress: () => {
                logout();
                router.replace("/login");
            },
            isLogout: true,
        },
    ];

    // Hàm lấy thông tin student từ API (giống StudentInfoScreen)
    const loadStudent = async () => {
        try {
            setLoading(true);

            // 1. Get the token from AsyncStorage
            const token = await AsyncStorage.getItem('token');

            // 2. Query using user?.id (MongoDB ObjectId) and pass the Authorization header
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
            console.log('Student API:', data);

            if (data.success) {
                // 3. Extract the nested student object
                setStudent(data.student);
                
                // 4. Cập nhật avatar từ student data
                if (data.student?.avatar) {
                    let avatarUrl = data.student.avatar;
                    // Nếu avatar là đường dẫn tương đối, thêm API_URL
                    if (!avatarUrl.startsWith('http')) {
                        avatarUrl = `${API_URL}${avatarUrl}`;
                    }
                    setAvatar(avatarUrl);
                    // Lưu vào AsyncStorage để cache
                    await AsyncStorage.setItem('student_avatar', avatarUrl);
                } else {
                    setAvatar(null);
                }
            }
        } catch (error) {
            console.log('Error loading student:', error);
            // Nếu có lỗi, thử load từ cache
            await loadAvatarFromCache();
        } finally {
            setLoading(false);
        }
    };

    // Hàm load avatar từ cache
    const loadAvatarFromCache = async () => {
        try {
            const savedAvatar = await AsyncStorage.getItem('student_avatar');
            if (savedAvatar) {
                setAvatar(savedAvatar);
            }
        } catch (err) {
            console.log('Error loading avatar from cache:', err);
        }
    };

    const pickImage = async () => {
        try {
            const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (!permission.granted) {
                Alert.alert('Thông báo', 'Cần cấp quyền truy cập thư viện ảnh');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.7,
                base64: false,
            });

            if (!result.canceled) {
                const asset = result.assets[0];
                await uploadAvatar(asset);
            }
        } catch (error) {
            console.error('Pick image error:', error);
            Alert.alert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại.');
        }
    };

    const uploadAvatar = async (asset: any) => {
        try {
            setIsUploading(true);

            const formData = new FormData();
            const uri = asset.uri;
            const fileName = uri.split('/').pop() || 'avatar.jpg';
            const fileType = asset.type || 'image/jpeg';
            
            // Lấy token từ AsyncStorage
            const token = await AsyncStorage.getItem('token');
            
            formData.append('avatar', {
                uri: uri,
                type: fileType,
                name: fileName,
            } as any);

            console.log('Uploading avatar:', {
                uri,
                fileName,
                fileType,
                token: token ? 'exists' : 'missing'
            });

            const response = await fetch(`${API_URL}/auth/upload-avatar`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
                body: formData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Server error:', errorText);
                throw new Error(`Upload failed: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log('Upload success:', data);

            if (!data.avatar) {
                throw new Error('Server không trả về URL ảnh');
            }

            // Cập nhật avatar
            let avatarUrl = data.avatar;
            if (!avatarUrl.startsWith('http')) {
                avatarUrl = `${API_URL}${avatarUrl}`;
            }
            
            setAvatar(avatarUrl);
            
            // Lưu vào AsyncStorage
            await AsyncStorage.setItem('student_avatar', avatarUrl);
            
            // Cập nhật student state
            if (student) {
                setStudent({ ...student, avatar: avatarUrl });
            }
            
            // Cập nhật user context nếu có
            if (user) {
                user.avatar = avatarUrl;
            }

            Alert.alert('Thành công', 'Cập nhật ảnh đại diện thành công!');
        } catch (error: any) {
            console.error('Upload error:', error);
            Alert.alert(
                'Lỗi upload', 
                error.message || 'Không thể tải ảnh lên. Vui lòng thử lại.'
            );
        } finally {
            setIsUploading(false);
        }
    };

    useEffect(() => {
        // Load từ cache trước để hiển thị nhanh
        loadAvatarFromCache();
        // Sau đó load student data từ API
        if (user?.id) {
            loadStudent();
        }
    }, [user?.id]);

    useFocusEffect(
        useCallback(() => {
            // Refresh khi quay lại màn hình
            if (user?.id) {
                loadStudent();
            }
        }, [user?.id])
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#214D8A" />
                    <Text style={styles.loadingText}>Đang tải...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            <Image
                                         source={
                                             student?.avatar
                                               ? { uri: student.avatar }
                                               : require('../../../assets/images/Nhan_imported_image/account_circle_withbackground.png')
                                           }
                                           style={styles.avatar}
                                       />
                        </View>
                        <TouchableOpacity
                            style={styles.editButton}
                            onPress={pickImage}
                            disabled={isUploading}
                        >
                            {isUploading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Ionicons name="camera-outline" size={20} color="#fff" />
                            )}
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.studentName}>{studentName}</Text>
                    <Text style={styles.studentId}>MSSV: {studentId}</Text>
                </View>

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

                <View style={styles.versionContainer}>
                    <Text style={styles.versionText}>Phiên bản 1.4.8</Text>
                </View>

                <View style={styles.footer} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F5F6FA",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#214D8A',
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
        borderWidth: 3,
        borderColor: '#FFF',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
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
        marginBottom: 20,
    },
    versionText: {
        fontSize: 14,
        color: "#999",
    },
    footer: {
        height: 20,
    },
});