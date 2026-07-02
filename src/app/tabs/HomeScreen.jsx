//Import thư viện
import React, { useEffect, useState, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "expo-router"; // Thay đổi import

const { width } = Dimensions.get("window");

export default function HomeScreen() {
  const router = useRouter(); // Sử dụng useRouter thay vì useNavigation
  const { user } = useAuth();
  
  // State cho quảng cáo
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const scrollViewRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Dữ liệu quảng cáo
  const banners = [
    {
      id: 1,
      title: "Tăng band TOEIC",
      subtitle: "Với kho đề thi thử",
      buttonText: "i-exams.vn",
      color: "#C218F0",
      image: "🎯",
    },
    {
      id: 2,
      title: "Học bổng 50%",
      subtitle: "Đăng ký ngay hôm nay",
      buttonText: "Xem chi tiết",
      color: "#FF6B6B",
      image: "🏆",
    },
    {
      id: 3,
      title: "Khóa học mới",
      subtitle: "Lập trình di động React Native",
      buttonText: "Đăng ký",
      color: "#4ECDC4",
      image: "📱",
    },
  ];

  // Lấy tên và MSSV
  let studentName = user?.fullName || "Sinh viên";
  let studentId = user?.studentId || "---";

  // Danh sách chức năng với đường dẫn expo-router
  const features = [
    {
      icon: "document-text-outline",
      title: "Xem điểm",
      color: "#4F7BFF",
      href: "/screens/ScoreScreen", // Sử dụng href thay vì screen
    },
    {
      icon: "calendar-outline",
      title: "Lịch học",
      color: "#FF8A4C",
      href: "/screens/ScheduleScreen",
    },
    {
      icon: "cash-outline",
      title: "Học phí",
      color: "#28C76F",
      href: "/screens/TuitionScreen",
    },
    {
      icon: "star-outline",
      title: "Thành tích",
      color: "#FF9F43",
      href: "/screens/AchievementScreen",
    },
    {
      icon: "reader-outline",
      title: "Phiếu thu",
      color: "#00CFE8",
      href: "/screens/ReceiptScreen",
    },
    {
      icon: "book-outline",
      title: "Chương trình",
      color: "#EA5455",
      href: "/screens/ProgramScreen",
    },
    {
      icon: "person-outline",
      title: "Điểm danh",
      color: "#FFB400",
      href: "/screens/AttendanceScreen",
    },
    {
      icon: "grid-outline",
      title: "Tất cả",
      color: "#7367F0",
      href: "/screens/AllFeaturesScreen",
    },
  ];

  // Animation cho banner
  useEffect(() => {
    // Animation fade in khi load
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Tự động chuyển banner
    const interval = setInterval(() => {
      if (scrollViewRef.current) {
        const nextIndex = (currentBannerIndex + 1) % banners.length;
        setCurrentBannerIndex(nextIndex);
        scrollViewRef.current.scrollTo({
          x: nextIndex * width * 0.9,
          animated: true,
        });
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [currentBannerIndex]);

  // Xử lý khi chuyển banner
  const handleScroll = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / (width * 0.9));
    setCurrentBannerIndex(index);
  };

  // Hàm điều hướng với expo-router
  const handleNavigate = (href) => {
    if (href) {
      router.push(href); // Sử dụng router.push
    }
  };

  // Render dot indicator
  const renderDots = () => {
    return banners.map((_, index) => (
      <View
        key={index}
        style={[
          styles.dot,
          {
            backgroundColor: index === currentBannerIndex ? "#FFF" : "rgba(255,255,255,0.4)",
            width: index === currentBannerIndex ? 20 : 8,
          },
        ]}
      />
    ));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <FontAwesome5 name="user-graduate" size={24} color="#fff" />
            </View>

            <View>
              <Text style={styles.greeting}>Xin chào,</Text>
              <Text style={styles.studentName}>
                {studentName}
              </Text>
              <Text style={styles.studentId}>
                {studentId ? `MSSV: ${studentId}` : ''}
              </Text>
            </View>
          </View>

          <TouchableOpacity onPress={() => router.push("/screens/NotificationScreen")}>
            <Ionicons
              name="notifications"
              size={24}
              color="white"
            />
          </TouchableOpacity>
        </View>

        {/* Card môn học - navigate đến chi tiết môn học */}
        <TouchableOpacity 
          style={styles.courseCard}
          onPress={() => router.push({
            pathname: "/screens/CourseDetailScreen",
            params: { courseId: "KCSQPM" }
          })}
        >
          <View>
            <Text style={styles.courseTitle}>
              Kiểm soát chất lượng phần mềm
            </Text>

            <Text style={styles.courseInfo}>
              Tiết 1 - 6
            </Text>

            <Text style={styles.courseRoom}>
              Phòng PM Mở 2
            </Text>
          </View>

          <Ionicons
            name="arrow-forward"
            size={22}
            color="#3B5BDB"
          />
        </TouchableOpacity>

        {/* Chức năng */}
        <Text style={styles.sectionTitle}>Chức năng</Text>

        <View style={styles.grid}>
          {features.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.featureItem}
              onPress={() => handleNavigate(item.href)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.iconWrapper,
                  { backgroundColor: `${item.color}20` },
                ]}
              >
                <Ionicons
                  name={item.icon}
                  size={24}
                  color={item.color}
                />
              </View>

              <Text style={styles.featureText}>
                {item.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Banner với hiệu ứng slideshow */}
        <Animated.View 
          style={[
            styles.bannerContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateX: slideAnim }],
            }
          ]}
        >
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled={false}
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            //contentContainerStyle={styles.bannerScrollContent}
          >
            {banners.map((banner) => (
              <TouchableOpacity
                key={banner.id}
                style={[
                  styles.banner,
                  { backgroundColor: banner.color }
                ]}
                onPress={() => {
                  // Xử lý khi click vào banner
                  console.log(`Banner ${banner.id} clicked`);
                }}
                activeOpacity={0.9}
              >
                <View style={styles.bannerContent}>
                  <Text style={styles.bannerEmoji}>{banner.image}</Text>
                  <Text style={styles.bannerTitle}>
                    {banner.title}
                  </Text>
                  <Text style={styles.bannerSubtitle}>
                    {banner.subtitle}
                  </Text>
                  <TouchableOpacity 
                    style={styles.bannerButton}
                    onPress={() => {
                      // Xử lý khi click button banner
                      if (banner.id === 1) {
                        // Mở link i-exams
                      } else if (banner.id === 2) {
                        router.push("/screens/ScholarshipScreen");
                      } else {
                        router.push("/screens/CourseScreen");
                      }
                    }}
                  >
                    <Text style={styles.bannerButtonText}>
                      {banner.buttonText}
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          {/* Dot indicators */}
          <View style={styles.dotsContainer}>
            {renderDots()}
          </View>
        </Animated.View>

        {/* Tin tức mới */}
        <View style={styles.newsSection}>
          <Text style={styles.sectionTitle}>Tin tức mới</Text>
          <TouchableOpacity 
            style={styles.newsItem}
            onPress={() => router.push("/screens/NewsDetailScreen")}
          >
            <View style={styles.newsDot} />
            <Text style={styles.newsText}>
              Thông báo lịch thi cuối kỳ
            </Text>
            <Text style={styles.newsTime}>2h trước</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.newsItem}
            onPress={() => router.push("/screens/NewsDetailScreen")}
          >
            <View style={styles.newsDot} />
            <Text style={styles.newsText}>
              Đăng ký môn học học kỳ mới
            </Text>
            <Text style={styles.newsTime}>5h trước</Text>
          </TouchableOpacity>
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

  header: {
    backgroundColor: "#214D8A",
    padding: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 55,
    height: 55,
    borderRadius: 27,
    backgroundColor: "#3B6CB7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  greeting: {
    color: "#EAEAEA",
    fontSize: 14,
  },

  studentName: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },

  studentId: {
    color: "#DDD",
    fontSize: 13,
  },

  courseCard: {
    marginHorizontal: 20,
    marginTop: -20,
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  courseTitle: {
    fontWeight: "700",
    fontSize: 15,
  },

  courseInfo: {
    color: "#666",
    marginTop: 5,
  },

  courseRoom: {
    color: "#888",
    marginTop: 2,
  },

  sectionTitle: {
    marginTop: 25,
    marginLeft: 20,
    fontSize: 20,
    fontWeight: "bold",
    color: "#1a1a2e",
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    marginTop: 15,
  },

  featureItem: {
    width: "22%",
    alignItems: "center",
    marginBottom: 25,
  },

  iconWrapper: {
    width: 55,
    height: 55,
    borderRadius: 27,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },

  featureText: {
    textAlign: "center",
    fontSize: 12,
    color: "#1a1a2e",
  },

  // Banner styles
  bannerContainer: {
    marginTop: 10,
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: "hidden",
  },

  bannerScrollContent: {
    paddingHorizontal: 0,
  },

  banner: {
    width: width * 0.9,
    borderRadius: 16,
    padding: 20,
    marginRight: 10,
    minHeight: 160,
  },

  bannerContent: {
    flex: 1,
  },

  bannerEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },

  bannerTitle: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
  },

  bannerSubtitle: {
    color: "white",
    marginTop: 5,
    opacity: 0.9,
  },

  bannerButton: {
    marginTop: 15,
    backgroundColor: "#fff",
    alignSelf: "flex-start",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },

  bannerButtonText: {
    color: "#C218F0",
    fontWeight: "bold",
  },

  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 10,
    backgroundColor: "rgba(0,0,0,0.1)",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },

  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
    transition: "all 0.3s ease",
  },

  // News styles
  newsSection: {
    marginTop: 10,
    marginHorizontal: 20,
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 15,
    elevation: 2,
  },

  newsItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },

  newsDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4F7BFF",
    marginRight: 10,
  },

  newsText: {
    flex: 1,
    fontSize: 14,
    color: "#1a1a2e",
  },

  newsTime: {
    fontSize: 12,
    color: "#999",
  },

  footer: {
    height: 20,
  },
});