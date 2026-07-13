import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRouter } from "expo-router"; //import useRouter từ expo-router để điều hướng đến các màn hình khác
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

import { styles as globalStyles } from '../../a_styles/style_student_info'; //style chung cho phần đầu app (đầu app đồng bộ ui với nhau)


export default function AllFeaturesScreen() {
  const navigation = useNavigation();
  const router = useRouter(); // Sử dụng useRouter thay vì useNavigation

  const features = [
  {
    title: "Xem điểm",
    icon: "school-outline",
    color: "#4F6EF7",
    href: "Score",
  },
  {
    title: "Lịch học/\nlịch thi",
    icon: "calendar-outline",
    color: "#F28C45",
    href: "Schedule",
  },
  {
    title: "Thanh toán\nhọc phí",
    icon: "cash-outline",
    color: "#33C06B",
    href: "Tuition",
  },
  {
    title: "Thành tích",
    icon: "star",
    color: "#F27C63",
    href: "Achievement",
  },
  {
    title: "Phiếu thu\n tổng hợp",
    icon: "document-text",
    color: "#20B28A",
    href: "Receipt",
  },
  {
    title: "Chương\ntrình khung",
    icon: "book",
    color: "#D63B3B",
    href: "../tabs/CurriculumStudentScreen",
  },
  {
    title: "Thống kê\nđiểm danh",
    icon: "person",
    color: "#F5B73A",
    href: "../tabs/AttendanceScreen",
  },
  {
    title: "Rèn luyện",
    icon: "ribbon",
    color: "#EF4B4B",
    href: "Training",
  },
  {
    title: "Tin tức",
    icon: "newspaper",
    color: "#F2B233",
    href: "../tabs/NewsScreen", // Sử dụng href thay vì screen
  },
];

 
  return (
<SafeAreaView style={globalStyles.container}>
  {/* Header */}
  <View style={globalStyles.header}>
    <TouchableOpacity onPress={() => navigation.goBack()}>
      <Ionicons name="chevron-back" size={24} color="#fff" />
    </TouchableOpacity>

    <Text style={globalStyles.headerTitle}>Tất cả tính năng</Text>

    <View style={{ width: 24 }} />
  </View>

  {/*contentContainerStyle={{ paddingBottom: 400 }}> ==> tang phẩn trắng nội dung xung quanh card (bottom ==> ở dưới )*/}

  <View style={globalStyles.card}>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 400 }}>
      <View style={styles.grid}>
      {features.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={styles.item}
          onPress={() => router.push(item.href as any)}
        >
          
          <Ionicons
            name={item.icon as keyof typeof Ionicons.glyphMap}
            size={26}
            color={item.color}
          />

          <Text style={styles.itemText}>
            {item.title}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  </ScrollView>
  </View>
</SafeAreaView>
  );
}
// Styles for the grid and items (styles cho lưới và các mục(nội dung bên trong))==> header dùng globalStyles 
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: "#fff",
  },

  item: {
    width: "25%",
    height: 95,
    borderRightWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: "#E5E5E5",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },

  itemText: {
    marginTop: 8,
    fontSize: 12,
    color: "#333",
    textAlign: "center",
    lineHeight: 16,
    paddingHorizontal: 4,
  },
});
