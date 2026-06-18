// src/screens/CourseManagementScreen.tsx
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, DataTable, Button, FAB, TextInput, Dialog, Portal, IconButton } from 'react-native-paper';

type Props = {
  navigation: any;
};

type Course = {
  id: number;
  name: string;
  credits: number;
  instructor: string;
};

export default function CourseManagementScreen({ navigation } : Props) {
 const [courses, setCourses] = useState<Course[]>([]);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({ name: '', credits: '', instructor: '' });

  const showDialog = (course: Course | null = null) => {
    if (course) {
      setEditingCourse(course);
      setFormData({ name: course.name, credits: course.credits.toString(), instructor: course.instructor });
    } else {
      setEditingCourse(null);
      setFormData({ name: '', credits: '', instructor: '' });
    }
    setDialogVisible(true);
  };

  const hideDialog = () => {
    setDialogVisible(false);
    setEditingCourse(null);
    setFormData({ name: '', credits: '', instructor: '' });
  };

  const saveCourse = () => {
    const newCourse = {
      id: editingCourse ? editingCourse.id : Date.now(),
      name: formData.name,
      credits: parseInt(formData.credits),
      instructor: formData.instructor,
    };
    
    if (editingCourse) {
      setCourses(courses.map(c => c.id === editingCourse.id ? newCourse : c));
    } else {
      setCourses([...courses, newCourse]);
    }
    hideDialog();
  };

  const deleteCourse = (id:number) => {
    setCourses(courses.filter(c => c.id !== id));
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <Card style={styles.card}>
          <Card.Title title="Danh sách môn học" />
          <Card.Content>
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>Môn học</DataTable.Title>
                <DataTable.Title numeric>Tín chỉ</DataTable.Title>
                <DataTable.Title>Giảng viên</DataTable.Title>
                <DataTable.Title numeric>Thao tác</DataTable.Title>
              </DataTable.Header>

              {courses.map(course => (
                <DataTable.Row key={course.id}>
                  <DataTable.Cell>{course.name}</DataTable.Cell>
                  <DataTable.Cell numeric>{course.credits}</DataTable.Cell>
                  <DataTable.Cell>{course.instructor}</DataTable.Cell>
                  <DataTable.Cell numeric>
                    <View style={styles.actions}>
                      <IconButton icon="pencil" size={20} onPress={() => showDialog(course)} />
                      <IconButton icon="delete" size={20} onPress={() => deleteCourse(course.id)} />
                    </View>
                  </DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          </Card.Content>
        </Card>
      </ScrollView>

      <FAB icon="plus" style={styles.fab} onPress={() => showDialog()} />

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={hideDialog}>
          <Dialog.Title>{editingCourse ? 'Sửa môn học' : 'Thêm môn học'}</Dialog.Title>
          <Dialog.Content>
            <TextInput label="Tên môn học" value={formData.name} onChangeText={(text) => setFormData({...formData, name: text})} mode="outlined" style={styles.input} />
            <TextInput label="Số tín chỉ" value={formData.credits} onChangeText={(text) => setFormData({...formData, credits: text})} mode="outlined" keyboardType="numeric" style={styles.input} />
            <TextInput label="Giảng viên" value={formData.instructor} onChangeText={(text) => setFormData({...formData, instructor: text})} mode="outlined" style={styles.input} />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={hideDialog}>Hủy</Button>
            <Button onPress={saveCourse}>Lưu</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 16,
  },
  actions: {
    flexDirection: 'row',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  input: {
    marginBottom: 12,
  },
});