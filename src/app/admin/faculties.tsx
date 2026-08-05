// app/admin/faculties.tsx
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { styles } from '../../a_styles/style_faculties';
import { API_URL } from '../../config/api';

interface Faculty {
  _id: string;
  name: string;
  code: string;
}

interface Department {
  _id: string;
  name: string;
  code: string;
  facultyId: string;
}                  


export default function FacultiesScreen() {
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [facultyModal, setFacultyModal] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null);
  const [deptModal, setDeptModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [selectedFacultyId, setSelectedFacultyId] = useState('');

  // Form states
  const [facultyName, setFacultyName] = useState('');
  const [facultyCode, setFacultyCode] = useState('');
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');

  // Fetch data
  const fetchData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) { router.replace('/login'); return; }

      const [facultiesRes, deptsRes] = await Promise.all([
        fetch(`${API_URL}/faculties`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/departments`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const facultiesData = await facultiesRes.json();
      const deptsData = await deptsRes.json();

      if (facultiesData.success) setFaculties(facultiesData.faculties || []);
      if (deptsData.success) setDepartments(deptsData.departments || []);
    } catch (error) {
      console.error('Fetch error:', error);
      Alert.alert('Lỗi', 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  // Reset forms
  const resetFacultyForm = () => {
    setFacultyName(''); setFacultyCode(''); setEditingFaculty(null);
  };

  const resetDeptForm = () => {
    setDeptName(''); setDeptCode(''); setEditingDept(null); setSelectedFacultyId('');
  };

  // ============= FACULTY CRUD =============
  const handleSaveFaculty = async () => {
    if (!facultyName.trim() || !facultyCode.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên và mã khoa');
      return;
    }
    try {
      const token = await AsyncStorage.getItem('token');
      const url = editingFaculty ? `${API_URL}/faculties/${editingFaculty._id}` : `${API_URL}/faculties`;
      const response = await fetch(url, {
        method: editingFaculty ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: facultyName.trim(), code: facultyCode.trim().toUpperCase() }),
      });
      const data = await response.json();
      if (data.success) {
        Alert.alert('Thành công', editingFaculty ? 'Cập nhật khoa thành công' : 'Thêm khoa thành công');
        setFacultyModal(false);
        resetFacultyForm();
        fetchData();
      } else {
        Alert.alert('Lỗi', data.message);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể kết nối đến server');
    }
  };

  const handleDeleteFaculty = (faculty: Faculty) => {
    const hasDepartments = departments.some(d => d.facultyId === faculty._id);
    if (hasDepartments) {
      Alert.alert('Không thể xóa', 'Khoa này đang có ngành. Vui lòng xóa ngành trước.');
      return;
    }
    Alert.alert('Xác nhận', `Xóa khoa "${faculty.name}"?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa', style: 'destructive',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch(`${API_URL}/faculties/${faculty._id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (data.success) {
              Alert.alert('Thành công', 'Xóa khoa thành công');
              fetchData();
            } else {
              Alert.alert('Lỗi', data.message);
            }
          } catch (error) {
            Alert.alert('Lỗi', 'Không thể kết nối đến server');
          }
        },
      },
    ]);
  };

  // ============= DEPARTMENT CRUD =============
  const handleSaveDepartment = async () => {
    if (!deptName.trim() || !deptCode.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên và mã ngành');
      return;
    }
    if (!selectedFacultyId) {
      Alert.alert('Lỗi', 'Vui lòng chọn khoa');
      return;
    }
    try {
      const token = await AsyncStorage.getItem('token');
      const url = editingDept ? `${API_URL}/departments/${editingDept._id}` : `${API_URL}/departments`;
      const response = await fetch(url, {
        method: editingDept ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: deptName.trim(), code: deptCode.trim().toUpperCase(), facultyId: selectedFacultyId }),
      });
      const data = await response.json();
      if (data.success) {
        Alert.alert('Thành công', editingDept ? 'Cập nhật ngành thành công' : 'Thêm ngành thành công');
        setDeptModal(false);
        resetDeptForm();
        fetchData();
      } else {
        Alert.alert('Lỗi', data.message);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể kết nối đến server');
    }
  };

  const handleDeleteDepartment = (dept: Department) => {
    Alert.alert('Xác nhận', `Xóa ngành "${dept.name}"?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa', style: 'destructive',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch(`${API_URL}/departments/${dept._id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (data.success) {
              Alert.alert('Thành công', 'Xóa ngành thành công');
              fetchData();
            } else {
              Alert.alert('Lỗi', data.message);
            }
          } catch (error) {
            Alert.alert('Lỗi', 'Không thể kết nối đến server');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quản lý Khoa & Ngành</Text>
        <TouchableOpacity
          onPress={() => { resetFacultyForm(); setFacultyModal(true); }}
          style={styles.addFacultyButton}
        >
          <Ionicons name="add-circle" size={24} color="#4A90E2" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.body}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.sectionContainer}>
          {faculties.map((faculty) => (
            <View key={faculty._id} style={styles.facultyCard}>
              <View style={styles.facultyHeader}>
                <View style={styles.facultyInfo}>
                  <View style={styles.facultyTop}>
                    <View style={styles.codeChip}>
                      <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>{faculty.code}</Text>
                    </View>
                    <View style={styles.facultyActions}>
                      <TouchableOpacity
                        onPress={() => {
                          setEditingFaculty(faculty);
                          setFacultyCode(faculty.code);
                          setFacultyName(faculty.name);
                          setFacultyModal(true);
                        }}
                      >
                        <Ionicons name="pencil-outline" size={18} color="#4A90E2" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeleteFaculty(faculty)}>
                        <Ionicons name="trash-outline" size={18} color="#dc3545" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          resetDeptForm();
                          setSelectedFacultyId(faculty._id);
                          setDeptModal(true);
                        }}
                      >
                        <Ionicons name="add-circle-outline" size={20} color="#28a745" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text style={styles.facultyName}>{faculty.name}</Text>
                </View>
              </View>

              <View style={styles.departmentList}>
                {departments
                  .filter(d => d.facultyId === faculty._id)
                  .map((dept) => (
                    <View key={dept._id} style={styles.departmentItem}>
                      <View style={styles.departmentInfo}>
                        <Ionicons name="bookmark-outline" size={14} color="#666" />
                        <Text style={styles.departmentName}>{dept.name}</Text>
                        <View style={styles.smallChip}>
                          <Text style={{ fontSize: 11, color: '#555' }}>{dept.code}</Text>
                        </View>
                      </View>
                      <View style={styles.deptActions}>
                        <TouchableOpacity
                          onPress={() => {
                            setEditingDept(dept);
                            setDeptName(dept.name);
                            setDeptCode(dept.code);
                            setSelectedFacultyId(dept.facultyId);
                            setDeptModal(true);
                          }}
                        >
                          <Ionicons name="pencil-outline" size={16} color="#4A90E2" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDeleteDepartment(dept)}>
                          <Ionicons name="trash-outline" size={16} color="#dc3545" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                {departments.filter(d => d.facultyId === faculty._id).length === 0 && (
                  <Text style={styles.noDepartmentText}>Chưa có ngành</Text>
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Modal Khoa */}
      <Modal visible={facultyModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingFaculty ? 'Sửa Khoa' : 'Thêm Khoa'}</Text>
              <TouchableOpacity onPress={() => { setFacultyModal(false); resetFacultyForm(); }}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <TextInput style={styles.input} placeholder="Tên khoa" value={facultyName} onChangeText={setFacultyName} />
              <TextInput style={[styles.input, { marginTop: 12 }]} placeholder="Mã khoa" value={facultyCode} onChangeText={setFacultyCode} autoCapitalize="characters" />
            </View>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => { setFacultyModal(false); resetFacultyForm(); }}>
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleSaveFaculty}>
                <Text style={styles.saveButtonText}>{editingFaculty ? 'Cập nhật' : 'Thêm'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Ngành */}
      <Modal visible={deptModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingDept ? 'Sửa Ngành' : 'Thêm Ngành'}</Text>
              <TouchableOpacity onPress={() => { setDeptModal(false); resetDeptForm(); }}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <TextInput style={styles.input} placeholder="Tên ngành" value={deptName} onChangeText={setDeptName} />
              <TextInput style={[styles.input, { marginTop: 12 }]} placeholder="Mã ngành" value={deptCode} onChangeText={setDeptCode} autoCapitalize="characters" />
              <View style={styles.facultyPicker}>
                <Text style={styles.label}>Thuộc khoa</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll}>
                  {faculties.map(f => (
                    <TouchableOpacity
                      key={f._id}
                      style={[styles.pickerItem, selectedFacultyId === f._id && styles.pickerItemSelected]}
                      onPress={() => setSelectedFacultyId(f._id)}
                    >
                      <Text style={[styles.pickerText, selectedFacultyId === f._id && styles.pickerTextSelected]}>{f.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => { setDeptModal(false); resetDeptForm(); }}>
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleSaveDepartment}>
                <Text style={styles.saveButtonText}>{editingDept ? 'Cập nhật' : 'Thêm'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}