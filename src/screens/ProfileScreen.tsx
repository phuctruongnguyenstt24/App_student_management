// src/screens/ProfileScreen.tsx
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, TextInput, Button, Avatar, IconButton } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
type Props = {
  navigation: any;
};

export default function ProfileScreen({ navigation } : Props) {
  const { user, updateUser, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || 'Nguyễn Văn A',
    studentId: user?.studentId || '20210001',
    dob: user?.dob || '01/01/2000',
    faculty: user?.faculty || 'Công nghệ thông tin',
    class: user?.class || 'CTTT-K61',
    email: user?.email || 'student@university.edu.vn',
    phone: user?.phone || '0123456789',
  });

  const handleSave = () => {
    updateUser(formData);
    setIsEditing(false);
  };

  const handleLogout = () => {
    logout();
    navigation.replace('Login');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.avatarContainer}>
        <Avatar.Text size={100} label={formData.name.charAt(0)} style={styles.avatar} />
        <IconButton icon="camera" mode="contained" onPress={() => navigation.navigate('Settings')} />
      </View>

      <Card style={styles.card}>
        <Card.Title title="Thông tin cá nhân" />
        <Card.Content>
          {isEditing ? (
            <>
              <TextInput label="Họ tên" value={formData.name} onChangeText={(text) => setFormData({...formData, name: text})} mode="outlined" style={styles.input} />
              <TextInput label="MSSV" value={formData.studentId} onChangeText={(text) => setFormData({...formData, studentId: text})} mode="outlined" style={styles.input} />
              <TextInput label="Ngày sinh" value={formData.dob} onChangeText={(text) => setFormData({...formData, dob: text})} mode="outlined" style={styles.input} />
              <TextInput label="Khoa" value={formData.faculty} onChangeText={(text) => setFormData({...formData, faculty: text})} mode="outlined" style={styles.input} />
              <TextInput label="Lớp" value={formData.class} onChangeText={(text) => setFormData({...formData, class: text})} mode="outlined" style={styles.input} />
              <TextInput label="Email" value={formData.email} onChangeText={(text) => setFormData({...formData, email: text})} mode="outlined" style={styles.input} />
              <TextInput label="Số điện thoại" value={formData.phone} onChangeText={(text) => setFormData({...formData, phone: text})} mode="outlined" style={styles.input} />
              <View style={styles.buttonGroup}>
                <Button mode="contained" onPress={handleSave} style={styles.button}>Lưu</Button>
                <Button mode="outlined" onPress={() => setIsEditing(false)} style={styles.button}>Hủy</Button>
              </View>
            </>
          ) : (
            <>
              <View style={styles.infoRow}>
                <Text variant="labelLarge">Họ tên:</Text>
                <Text variant="bodyLarge">{formData.name}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text variant="labelLarge">MSSV:</Text>
                <Text variant="bodyLarge">{formData.studentId}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text variant="labelLarge">Ngày sinh:</Text>
                <Text variant="bodyLarge">{formData.dob}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text variant="labelLarge">Khoa:</Text>
                <Text variant="bodyLarge">{formData.faculty}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text variant="labelLarge">Lớp:</Text>
                <Text variant="bodyLarge">{formData.class}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text variant="labelLarge">Email:</Text>
                <Text variant="bodyLarge">{formData.email}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text variant="labelLarge">Số điện thoại:</Text>
                <Text variant="bodyLarge">{formData.phone}</Text>
              </View>
              <Button mode="contained" onPress={() => setIsEditing(true)} style={styles.editButton}>
                Chỉnh sửa thông tin
              </Button>
            </>
          )}
        </Card.Content>
      </Card>

      <Button mode="outlined" onPress={handleLogout} style={styles.logoutButton} textColor="#d32f2f">
        Đăng xuất
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  avatarContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 16,
  },
  avatar: {
    backgroundColor: '#2196F3',
  },
  card: {
    margin: 16,
  },
  input: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  buttonGroup: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 8,
  },
  button: {
    flex: 1,
  },
  editButton: {
    marginTop: 16,
  },
  logoutButton: {
    margin: 16,
    borderColor: '#d32f2f',
  },
});