//Import thư viện (useEffect: chạy một đoạn code khi component load hoặc thay đổi dữ liệu. useState: tạo biến trạng thái.)
import React, { useEffect, useState } from "react";
//Dùng để lưu dữ liệu trên điện thoại.
import AsyncStorage from "@react-native-async-storage/async-storage";
//Các component giao diện:
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
//Giúp giao diện không bị che bởi:Status bar
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
//Lấy dữ liệu user sau khi login (từ function đã export)
import { useAuth } from "../../contexts/AuthContext";

export default function HomeScreen() {

  // Lấy user từ AuthContext sau khi login
  const { user } = useAuth();
  let studentName;
  let studentId;
  //Kiểm tra user có tồn tại không
  if (user != null) {
      //Lấy dữ liệu từ user nếu có tồn tại
      studentName = user.fullName;
      studentId = user.studentId;
  } else {
      //Không có thì hiện data mẫu
      studentName = "Sinh viên";
      studentId = "---";
  }

  const features = [
    {
      icon: "document-text-outline",
      title: "Xem điểm",
      color: "#4F7BFF",
    },
    {
      icon: "calendar-outline",
      title: "Lịch học",
      color: "#FF8A4C",
    },
    {
      icon: "cash-outline",
      title: "Học phí",
      color: "#28C76F",
    },
    {
      icon: "star-outline",
      title: "Thành tích",
      color: "#FF9F43",
    },
    {
      icon: "reader-outline",
      title: "Phiếu thu",
      color: "#00CFE8",
    },
    {
      icon: "book-outline",
      title: "Chương trình",
      color: "#EA5455",
    },
    {
      icon: "person-outline",
      title: "Điểm danh",
      color: "#FFB400",
    },
    {
      icon: "grid-outline",
      title: "Tất cả",
      color: "#7367F0",
    },
  ];

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

          <TouchableOpacity>
            <Ionicons
              name="notifications"
              size={24}
              color="white"
            />
          </TouchableOpacity>
        </View>

        {/* Card môn học */}
        <View style={styles.courseCard}>
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
        </View>

        {/* Chức năng */}
        <Text style={styles.sectionTitle}>Chức năng</Text>

        <View style={styles.grid}>
          {features.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.featureItem}
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

        {/* Banner */}
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>
            Tăng band TOEIC
          </Text>

          <Text style={styles.bannerSubtitle}>
            Với kho đề thi thử
          </Text>

          <TouchableOpacity style={styles.bannerButton}>
            <Text style={styles.bannerButtonText}>
              i-exams.vn
            </Text>
          </TouchableOpacity>
        </View>
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
  },

  banner: {
    margin: 20,
    backgroundColor: "#C218F0",
    borderRadius: 16,
    padding: 20,
  },

  bannerTitle: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
  },

  bannerSubtitle: {
    color: "white",
    marginTop: 5,
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
});



/*
Các component giao diện:
Component	        Chức năng
View	            Khung chứa giao diện
Text	            Hiển thị chữ
StyleSheet	        Viết CSS
ScrollView	        Cuộn màn hình
TouchableOpacity	Button có hiệu ứng bấm
*/