// app/admin/courses.tsx
import { View, Text, TouchableOpacity, ScrollView, TextInput, Modal, Alert, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback } from 'react';
import { styles } from '../../a_styles/style_courses';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

// API base URL
const host = Constants.expoConfig?.hostUri?.split(':')[0];
const API_URL = `http://${host}:5000/api`;

interface Course {
  _id: string;
  courseCode: string;
  courseName: string;
  credits: number;
  department: string;
  description?: string;
  semester?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function CoursesScreen() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  
  // Form states
  const [courseCode, setCourseCode] = useState('');
  const [courseName, setCourseName] = useState('');
  const [credits, setCredits] = useState('');
  const [department, setDepartment] = useState('');
  const [description, setDescription] = useState('');
  const [semester, setSemester] = useState('');

  // Fetch courses
  const fetchCourses = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        router.replace('/login');
        return;
      }

      const response = await fetch(`${API_URL}/courses`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (data.success) {
        setCourses(data.data || []);
      } else {
        Alert.alert('Lỗi', data.message || 'Không thể tải danh sách môn học');
      }
    } catch (error) {
      console.error('Fetch courses error:', error);
      Alert.alert('Lỗi', 'Không thể kết nối đến server');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCourses();
  }, []);

  // Reset form
  const resetForm = () => {
    setCourseCode('');
    setCourseName('');
    setCredits('');
    setDepartment('');
    setDescription('');
    setSemester('');
    setEditingCourse(null);
  };

  // Open create modal
  const openCreateModal = () => {
    resetForm();
    setModalVisible(true);
  };

  // Open edit modal
  const openEditModal = (course: Course) => {
    setEditingCourse(course);
    setCourseCode(course.courseCode);
    setCourseName(course.courseName);
    setCredits(course.credits.toString());
    setDepartment(course.department || '');
    setDescription(course.description || '');
    setSemester(course.semester || '');
    setModalVisible(true);
  };

  // Handle create/edit course
  const handleSaveCourse = async () => {
    // Validation
    if (!courseCode || !courseName || !credits) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin bắt buộc');
      return;
    }

    if (isNaN(Number(credits)) || Number(credits) <= 0) {
      Alert.alert('Lỗi', 'Số tín chỉ phải là số nguyên dương');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        router.replace('/login');
        return;
      }

      const courseData = {
        courseCode,
        courseName,
        credits: Number(credits),
        department,
        description,
        semester,
      };

      const url = editingCourse 
        ? `${API_URL}/courses/${editingCourse._id}`
        : `${API_URL}/courses`;
      
      const method = editingCourse ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(courseData),
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert(
          'Thành công', 
          editingCourse ? 'Cập nhật môn học thành công' : 'Thêm môn học thành công'
        );
        setModalVisible(false);
        resetForm();
        fetchCourses();
      } else {
        Alert.alert('Lỗi', data.message || 'Không thể lưu môn học');
      }
    } catch (error) {
      console.error('Save course error:', error);
      Alert.alert('Lỗi', 'Không thể kết nối đến server');
    }
  };

  // Handle delete course
  const handleDeleteCourse = (course: Course) => {
    Alert.alert(
      'Xác nhận xóa',
      `Bạn có chắc chắn muốn xóa môn học "${course.courseName}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              if (!token) {
                router.replace('/login');
                return;
              }

              const response = await fetch(`${API_URL}/courses/${course._id}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              });

              const data = await response.json();

              if (data.success) {
                Alert.alert('Thành công', 'Xóa môn học thành công');
                fetchCourses();
              } else {
                Alert.alert('Lỗi', data.message || 'Không thể xóa môn học');
              }
            } catch (error) {
              console.error('Delete course error:', error);
              Alert.alert('Lỗi', 'Không thể kết nối đến server');
            }
          },
        },
      ]
    );
  };

  // Render loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quản lý môn học</Text>
        <TouchableOpacity onPress={openCreateModal} style={styles.addButton}>
          <Ionicons name="add-circle" size={28} color="#4A90E2" />
        </TouchableOpacity>
      </View>

      {/* Body */}
      <ScrollView 
        style={styles.body}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {courses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="book-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Chưa có môn học nào</Text>
            <Text style={styles.emptySubText}>Nhấn nút + để thêm môn học mới</Text>
          </View>
        ) : (
          courses.map((course) => (
            <View key={course._id} style={styles.courseCard}>
              <View style={styles.courseHeader}>
                <View style={styles.courseCodeContainer}>
                  <Text style={styles.courseCode}>{course.courseCode}</Text>
                </View>
                <View style={styles.courseActions}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => openEditModal(course)}
                  >
                    <Ionicons name="pencil-outline" size={20} color="#4A90E2" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleDeleteCourse(course)}
                  >
                    <Ionicons name="trash-outline" size={20} color="#dc3545" />
                  </TouchableOpacity>
                </View>
              </View>
              
              <Text style={styles.courseName}>{course.courseName}</Text>
              
              <View style={styles.courseInfo}>
                <View style={styles.infoItem}>
                  <Ionicons name="star-outline" size={16} color="#666" />
                  <Text style={styles.infoText}>{course.credits} tín chỉ</Text>
                </View>
                {course.department && (
                  <View style={styles.infoItem}>
                    <Ionicons name="business-outline" size={16} color="#666" />
                    <Text style={styles.infoText}>{course.department}</Text>
                  </View>
                )}
                {course.semester && (
                  <View style={styles.infoItem}>
                    <Ionicons name="calendar-outline" size={16} color="#666" />
                    <Text style={styles.infoText}>HK {course.semester}</Text>
                  </View>
                )}
              </View>
              
              {course.description && (
                <Text style={styles.courseDescription} numberOfLines={2}>
                  {course.description}
                </Text>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Create/Edit Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          resetForm();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingCourse ? 'Chỉnh sửa môn học' : 'Thêm môn học mới'}
              </Text>
              <TouchableOpacity 
                onPress={() => {
                  setModalVisible(false);
                  resetForm();
                }}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Mã môn học <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  placeholder="VD: CT101"
                  value={courseCode}
                  onChangeText={setCourseCode}
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tên môn học <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  placeholder="VD: Nhập môn lập trình"
                  value={courseName}
                  onChangeText={setCourseName}
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Số tín chỉ <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  placeholder="VD: 3"
                  value={credits}
                  onChangeText={setCredits}
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Khoa/Bộ môn</Text>
                <TextInput
                  style={styles.input}
                  placeholder="VD: Khoa Công nghệ thông tin"
                  value={department}
                  onChangeText={setDepartment}
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Học kỳ</Text>
                <TextInput
                  style={styles.input}
                  placeholder="VD: 2024.1"
                  value={semester}
                  onChangeText={setSemester}
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Mô tả</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Mô tả chi tiết về môn học..."
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  placeholderTextColor="#999"
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  resetForm();
                }}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveCourse}
              >
                <Text style={styles.saveButtonText}>
                  {editingCourse ? 'Cập nhật' : 'Thêm mới'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}