import { Ionicons } from "@expo/vector-icons";
import { router } from 'expo-router';
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
// 1. THÊM IMPORT ASYNCSTORAGE
import AsyncStorage from "@react-native-async-storage/async-storage";

import { styles } from "../../a_styles/style_mng_framework";
import { API_URL } from "../../config/api";
import { useAuth } from "../../contexts/AuthContext";

const CurriculumManagementScreen = () => {
  const { user } = useAuth();
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal thêm/sửa môn học
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [editingSubject, setEditingSubject] = useState(null);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectCode, setNewSubjectCode] = useState("");
  const [newSubjectCredits, setNewSubjectCredits] = useState("3");
  const [newSubjectTheory, setNewSubjectTheory] = useState("45");
  const [newSubjectPractice, setNewSubjectPractice] = useState("0");
  const [newSubjectIsRequired, setNewSubjectIsRequired] = useState(true);
  const [selectedSemester, setSelectedSemester] = useState(null);

  // Modal thêm/sửa học kỳ
  const [semesterModalVisible, setSemesterModalVisible] = useState(false);
  const [semesterModalMode, setSemesterModalMode] = useState("add");
  const [editingSemester, setEditingSemester] = useState(null);
  const [newSemesterNumber, setNewSemesterNumber] = useState("");

  useEffect(() => {
    fetchCurriculum();
  }, []);

  const fetchCurriculum = async () => {
    try {
      const token = await AsyncStorage.getItem("token"); // 👈 Lấy token
      const response = await fetch(`${API_URL}/curriculum`, {
        headers: {
          "Authorization": `Bearer ${token}`, // 👈 Gắn token vào
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      setSemesters(data);
    } catch (error) {
      console.error("Error fetching curriculum:", error);
      Alert.alert("Lỗi", "Không thể tải chương trình khung");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchCurriculum();
  };

  const updateSemester = async (semesterNumber, subjects) => {
    try {
      const token = await AsyncStorage.getItem("token"); // 👈
      const response = await fetch(
        `${API_URL}/curriculum/semester/${semesterNumber}`,
        {
          method: "PUT",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`, // 👈
          },
          body: JSON.stringify({ subjects }),
        },
      );

      if (response.ok) {
        Alert.alert("Thành công", "Cập nhật học kỳ thành công");
        fetchCurriculum();
        return true;
      } else {
        const error = await response.json();
        Alert.alert("Lỗi", error.message || "Cập nhật thất bại");
        return false;
      }
    } catch (error) {
      console.error("Error updating semester:", error);
      Alert.alert("Lỗi", "Không thể cập nhật học kỳ");
      return false;
    }
  };

  const updateSubject = async (subjectId, updates) => {
    try {
      const token = await AsyncStorage.getItem("token"); // 👈
      const response = await fetch(
        `${API_URL}/curriculum/subject/${subjectId}`,
        {
          method: "PUT",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`, // 👈
          },
          body: JSON.stringify(updates),
        },
      );

      if (response.ok) {
        Alert.alert("Thành công", "Cập nhật môn học thành công");
        fetchCurriculum();
        return true;
      } else {
        const error = await response.json();
        Alert.alert("Lỗi", error.message || "Cập nhật thất bại");
        return false;
      }
    } catch (error) {
      console.error("Error updating subject:", error);
      Alert.alert("Lỗi", "Không thể cập nhật môn học");
      return false;
    }
  };

  const toggleCompletion = (subjectId, currentStatus) => {
    updateSubject(subjectId, { isCompleted: !currentStatus });
  };

  const openAddSubjectModal = (semester) => {
    setModalMode("add");
    setSelectedSemester(semester);
    setNewSubjectName("");
    setNewSubjectCode(`M${Date.now()}`);
    setNewSubjectCredits("3");
    setNewSubjectTheory("45");
    setNewSubjectPractice("0");
    setNewSubjectIsRequired(true);
    setEditingSubject(null);
    setModalVisible(true);
  };

  const openEditSubjectModal = (subject, semester) => {
    setModalMode("edit");
    setSelectedSemester(semester);
    setEditingSubject(subject);
    setNewSubjectName(subject.name);
    setNewSubjectCode(subject.code);
    setNewSubjectCredits(String(subject.credits));
    setNewSubjectTheory(String(subject.theoryHours));
    setNewSubjectPractice(String(subject.practiceHours));
    setNewSubjectIsRequired(subject.isRequired);
    setModalVisible(true);
  };

  const handleSaveSubject = async () => {
    if (!newSubjectName.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tên môn học");
      return;
    }
    if (!newSubjectCode.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập mã môn học");
      return;
    }

    const subjectData = {
      name: newSubjectName.trim(),
      code: newSubjectCode.trim(),
      credits: parseInt(newSubjectCredits) || 0,
      theoryHours: parseInt(newSubjectTheory) || 0,
      practiceHours: parseInt(newSubjectPractice) || 0,
      isRequired: newSubjectIsRequired,
      isCompleted: false,
      semester: selectedSemester.semesterNumber,
    };

    if (modalMode === "add") {
      const updatedSubjects = [...selectedSemester.subjects, subjectData];
      await updateSemester(selectedSemester.semesterNumber, updatedSubjects);
    } else {
      const subjectId = editingSubject._id || editingSubject.id;
      const updatedSubjects = selectedSemester.subjects.map((sub) =>
        (sub._id || sub.id) === subjectId ? { ...sub, ...subjectData } : sub,
      );
      await updateSemester(selectedSemester.semesterNumber, updatedSubjects);
    }

    setModalVisible(false);
    resetSubjectForm();
  };

  const resetSubjectForm = () => {
    setNewSubjectName("");
    setNewSubjectCode("");
    setNewSubjectCredits("3");
    setNewSubjectTheory("45");
    setNewSubjectPractice("0");
    setNewSubjectIsRequired(true);
    setEditingSubject(null);
    setSelectedSemester(null);
  };

  const deleteSubject = (subjectId, semester) => {
    Alert.alert("Xóa môn học", "Bạn có chắc chắn muốn xóa môn học này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            const updatedSubjects = semester.subjects.filter(
              (sub) => (sub._id || sub.id) !== subjectId,
            );
            await updateSemester(semester.semesterNumber, updatedSubjects);
          } catch (error) {
            console.error("Error deleting subject:", error);
            Alert.alert("Lỗi", "Không thể xóa môn học");
          }
        },
      },
    ]);
  };

  const openAddSemesterModal = () => {
    setSemesterModalMode("add");
    setNewSemesterNumber("");
    setEditingSemester(null);
    setSemesterModalVisible(true);
  };

  const openEditSemesterModal = (semester) => {
    setSemesterModalMode("edit");
    setEditingSemester(semester);
    setNewSemesterNumber(String(semester.semesterNumber));
    setSemesterModalVisible(true);
  };

  // 🚀 ĐÂY LÀ CHỖ ĐÃ SỬA CÁI LỖI "THÊM HỌC KỲ THẤT BẠI" NÈ
  const handleSaveSemester = async () => {
    if (!newSemesterNumber.trim() || isNaN(newSemesterNumber)) {
      Alert.alert("Lỗi", "Vui lòng nhập số học kỳ hợp lệ");
      return;
    }

    const semesterNumber = parseInt(newSemesterNumber);

    const exists = semesters.some(
      (s) =>
        s.semesterNumber === semesterNumber &&
        (semesterModalMode === "add" ||
          (editingSemester &&
            s.semesterNumber !== editingSemester.semesterNumber)),
    );

    if (exists) {
      Alert.alert("Lỗi", `Học kỳ ${semesterNumber} đã tồn tại`);
      return;
    }

    const token = await AsyncStorage.getItem("token"); // 👈 LẤY TOKEN Ở ĐÂY

    if (semesterModalMode === "add") {
      const newSemester = {
        semesterNumber: semesterNumber,
        subjects: [],
        totalCredits: 0,
      };

      try {
        const response = await fetch(`${API_URL}/curriculum`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}` // 👈 GẮN TOKEN VÀO ĐÂY
          },
          body: JSON.stringify(newSemester),
        });

        if (response.ok) {
          Alert.alert("Thành công", "Thêm học kỳ thành công");
          fetchCurriculum();
          setSemesterModalVisible(false);
          setNewSemesterNumber("");
        } else {
          // Lấy tin nhắn báo lỗi chi tiết từ backend thay vì thông báo chung chung
          const errData = await response.json().catch(() => ({}));
          Alert.alert("Lỗi", errData.message || "Thêm học kỳ thất bại");
        }
      } catch (error) {
        console.error("Error creating semester:", error);
        Alert.alert("Lỗi", "Không thể thêm học kỳ");
      }
    } else {
      try {
        const response = await fetch(
          `${API_URL}/curriculum/semester/${editingSemester.semesterNumber}`,
          {
            method: "PUT",
            headers: { 
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}` // 👈 GẮN TOKEN VÀO ĐÂY NỮA
            },
            body: JSON.stringify({
              semesterNumber: semesterNumber,
              subjects: editingSemester.subjects,
            }),
          },
        );

        if (response.ok) {
          Alert.alert("Thành công", "Cập nhật học kỳ thành công");
          fetchCurriculum();
          setSemesterModalVisible(false);
          setNewSemesterNumber("");
        } else {
          Alert.alert("Lỗi", "Cập nhật học kỳ thất bại");
        }
      } catch (error) {
        console.error("Error updating semester:", error);
        Alert.alert("Lỗi", "Không thể cập nhật học kỳ");
      }
    }
  };

  const deleteSemester = (semester) => {
    Alert.alert(
      "Xóa học kỳ",
      `Bạn có chắc chắn muốn xóa học kỳ ${semester.semesterNumber}? (Các môn học trong học kỳ sẽ bị xóa)`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("token"); // 👈
              const response = await fetch(
                `${API_URL}/curriculum/semester/${semester.semesterNumber}`,
                { 
                  method: "DELETE",
                  headers: {
                    "Authorization": `Bearer ${token}` // 👈
                  }
                },
              );

              if (response.ok) {
                Alert.alert("Thành công", "Xóa học kỳ thành công");
                fetchCurriculum();
              } else {
                Alert.alert("Lỗi", "Xóa học kỳ thất bại");
              }
            } catch (error) {
              console.error("Error deleting semester:", error);
              Alert.alert("Lỗi", "Không thể xóa học kỳ");
            }
          },
        },
      ],
    );
  };

  const renderSubjectCard = (subject, semester) => (
    <View key={subject._id || subject.id} style={styles.subjectCard}>
      <View style={styles.subjectHeader}>
        <View style={styles.subjectTitle}>
          <Text style={styles.subjectName}>{subject.name}</Text>
          <Text style={styles.subjectCode}>{subject.code}</Text>
        </View>
        <View style={styles.subjectActions}>
          <TouchableOpacity
            onPress={() =>
              toggleCompletion(subject._id || subject.id, subject.isCompleted)
            }
            style={[
              styles.statusButton,
              subject.isCompleted ? styles.completed : styles.incomplete,
            ]}
          >
            <Text style={styles.statusText}>
              {subject.isCompleted ? "Hoàn thành" : "Chưa hoàn thành"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => openEditSubjectModal(subject, semester)}
            style={styles.editButton}
          >
            <Ionicons name="pencil" size={20} color="#2196F3" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => deleteSubject(subject._id || subject.id, semester)}
            style={styles.deleteButton}
          >
            <Ionicons name="close-circle" size={20} color="#ff4444" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.subjectDetails}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Tín chỉ:</Text>
          <Text style={styles.detailValue}>{subject.credits}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Lý thuyết:</Text>
          <Text style={styles.detailValue}>{subject.theoryHours}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Thực hành:</Text>
          <Text style={styles.detailValue}>{subject.practiceHours}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Loại:</Text>
          <Text
            style={[
              styles.detailValue,
              subject.isRequired ? styles.requiredText : styles.electiveText,
            ]}
          >
            {subject.isRequired ? "Bắt buộc" : "Tự chọn"}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderSemester = (semester) => (
    <View key={semester._id || semester.id} style={styles.semesterCard}>
      <View style={styles.semesterHeader}>
        <Text style={styles.semesterTitle}>
          Học kỳ {semester.semesterNumber}
        </Text>
        <View style={styles.semesterHeaderRight}>
          <View style={styles.semesterStats}>
            <Text style={styles.statsText}>
              {semester.subjects.length} môn |
              {semester.subjects.reduce((sum, s) => sum + s.credits, 0)} TC
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => openEditSemesterModal(semester)}
            style={styles.editSemesterButton}
          >
            <Ionicons name="pencil" size={20} color="#2196F3" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => deleteSemester(semester)}
            style={styles.deleteSemesterButton}
          >
            <Ionicons name="trash-outline" size={20} color="#ff4444" />
          </TouchableOpacity>
        </View>
      </View>

      {semester.subjects.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Chưa có môn học nào</Text>
        </View>
      ) : (
        semester.subjects.map((subject) => renderSubjectCard(subject, semester))
      )}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => openAddSubjectModal(semester)}
      >
        <Ionicons name="add" size={24} color="#4CAF50" />
        <Text style={styles.addButtonText}>Thêm môn học</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  const handleback = () => {
    if(router.canGoBack()){
      router.replace('/admin/dashboard')
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleback} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#0c0707" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chương trình khung</Text>
          <Text style={styles.headerSubtitle}>
            Kỹ thuật phần mềm - Đại học chính quy
          </Text>

          <TouchableOpacity
            style={styles.addSemesterButton}
            onPress={openAddSemesterModal}
          >
            <Ionicons name="add-circle" size={24} color="white" />
            <Text style={styles.addSemesterText}>Thêm học kỳ</Text>
          </TouchableOpacity>
        </View>

        {semesters.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Chưa có học kỳ nào</Text>
          </View>
        ) : (
          semesters.map((semester) => renderSemester(semester))
        )}
      </ScrollView>

      {/* Modal thêm/sửa môn học */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          resetSubjectForm();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {modalMode === "add" ? "Thêm môn học mới" : "Sửa môn học"}
            </Text>
            <Text style={styles.modalSubtitle}>
              Học kỳ {selectedSemester?.semesterNumber}
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Tên môn học *"
              value={newSubjectName}
              onChangeText={setNewSubjectName}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Mã môn học *"
              value={newSubjectCode}
              onChangeText={setNewSubjectCode}
            />

            <View style={styles.modalRow}>
              <TextInput
                style={[styles.modalInput, styles.modalInputHalf]}
                placeholder="Tín chỉ"
                value={newSubjectCredits}
                onChangeText={setNewSubjectCredits}
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.modalInput, styles.modalInputHalf]}
                placeholder="Lý thuyết (h)"
                value={newSubjectTheory}
                onChangeText={setNewSubjectTheory}
                keyboardType="numeric"
              />
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Thực hành (h)"
              value={newSubjectPractice}
              onChangeText={setNewSubjectPractice}
              keyboardType="numeric"
            />

            <View style={styles.modalRow}>
              <TouchableOpacity
                style={[
                  styles.typeSelector,
                  newSubjectIsRequired && styles.typeSelectorActive,
                ]}
                onPress={() => setNewSubjectIsRequired(true)}
              >
                <Text
                  style={[
                    styles.typeSelectorText,
                    newSubjectIsRequired && styles.typeSelectorTextActive,
                  ]}
                >
                  Bắt buộc
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeSelector,
                  !newSubjectIsRequired && styles.typeSelectorActive,
                ]}
                onPress={() => setNewSubjectIsRequired(false)}
              >
                <Text
                  style={[
                    styles.typeSelectorText,
                    !newSubjectIsRequired && styles.typeSelectorTextActive,
                  ]}
                >
                  Tự chọn
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  resetSubjectForm();
                }}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleSaveSubject}
              >
                <Text style={styles.confirmButtonText}>
                  {modalMode === "add" ? "Thêm" : "Cập nhật"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal thêm/sửa học kỳ */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={semesterModalVisible}
        onRequestClose={() => {
          setSemesterModalVisible(false);
          setNewSemesterNumber("");
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {semesterModalMode === "add" ? "Thêm học kỳ mới" : "Sửa học kỳ"}
            </Text>
            <Text style={styles.modalSubtitle}>
              {semesterModalMode === "add"
                ? "Nhập số học kỳ"
                : "Cập nhật số học kỳ"}
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="VD: 3"
              value={newSemesterNumber}
              onChangeText={setNewSemesterNumber}
              keyboardType="numeric"
              autoFocus
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setSemesterModalVisible(false);
                  setNewSemesterNumber("");
                }}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleSaveSemester}
              >
                <Text style={styles.confirmButtonText}>
                  {semesterModalMode === "add" ? "Thêm" : "Cập nhật"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default CurriculumManagementScreen;