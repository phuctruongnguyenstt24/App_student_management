import { Ionicons } from '@expo/vector-icons';
import {
    Image,
    SafeAreaView,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { styles } from '../../../a_styles/style_student_info';

const studentInfo = [
  { label: 'Trạng thái', value: 'Đang học' },
  { label: 'Giới tính', value: 'Nam' },
  { label: 'Ngày sinh', value: '06/06/2001' },
  { label: 'Lớp', value: 'DH20 - MT03' },
  { label: 'Bậc đào tạo', value: 'Đại học' },
  { label: 'Khoa', value: 'Design' },
  { label: 'Chuyên ngành', value: 'Thiết kế đồ họa' },
  { label: 'Địa chỉ', value: 'Nguyễn Văn Linh, Quận 7' },
  { label: 'SĐT', value: '0901605003' },
  { label: 'Nơi sinh', value: 'Tỉnh Tiền Giang' },
];

export default function StudentInfoScreen() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Thông tin sinh viên</Text>

        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}>
        {/* Card */}
        <View style={styles.card}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <Image
              source={{
                uri: 'https://i.pravatar.cc/300',
              }}
              style={styles.avatar}
            />

            <TouchableOpacity style={styles.cameraButton}>
              <Ionicons name="camera-outline" size={18} color="#555" />
            </TouchableOpacity>
          </View>

          <Text style={styles.name}>Lâm Chí Hào</Text>

          <Text style={styles.studentId}>MSSV: DH12344568</Text>

          <View style={styles.infoContainer}>
            {studentInfo.map((item, index) => (
              <View key={index} style={styles.row}>
                <Text style={styles.label}>{item.label}</Text>

                <Text style={styles.value}>{item.value}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}