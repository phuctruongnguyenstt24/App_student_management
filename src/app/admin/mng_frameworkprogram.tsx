// mng_frameworkprogram.jsx
import { Ionicons } from "@expo/vector-icons";
import { router } from 'expo-router';
import { useCallback, useEffect, useState, ReactElement } from "react";
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { styles } from "../../a_styles/style_mng_framework";
import { API_URL } from "../../config/api";

// Interfaces
interface Course {
  _id: string;
  courseCode: string;
  courseName: string;
  credits: number;
  department: string;
  description?: string;
  semester?: string;
}

interface Subject {
  _id?: string;
  id?: string;
  name: string;
  code: string;
  credits: number;
  theoryHours: number;
  practiceHours: number;
  isRequired: boolean;
  department: string;
  isCompleted: boolean;
  semester: number;
  courseId?: string;
  isSynced?: boolean;
}

interface Semester {
  _id?: string;
  id?: string;
  semesterNumber: number;
  subjects: Subject[];
  totalCredits: number;
}

interface FormState {
  name: string;
  code: string;
  credits: string;
  theory: string;
  practice: string;
  isRequired: boolean;
  department: string;
}

interface ModalState {
  visible: boolean;
  mode: 'add' | 'edit';
  subject: Subject | null;
  semester: Semester | null;
}

interface SemesterModalState {
  visible: boolean;
  mode: 'add' | 'edit';
  semester: Semester | null;
}

const CurriculumManagementScreen = () => {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Modal states
  const [modal, setModal] = useState<ModalState>({
    visible: false,
    mode: 'add',
    subject: null,
    semester: null
  });
  const [semesterModal, setSemesterModal] = useState<SemesterModalState>({
    visible: false,
    mode: 'add',
    semester: null
  });

  // Form states
  const [form, setForm] = useState<FormState>({
    name: '',
    code: '',
    credits: '3',
    theory: '45',
    practice: '0',
    isRequired: true,
    department: ''
  });
  const [semesterNumber, setSemesterNumber] = useState<string>('');

  // Fetch data
  const fetchData = useCallback(async (): Promise<void> => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        router.replace('/login');
        return;
      }

      const [curriculumRes, coursesRes] = await Promise.all([
        fetch(`${API_URL}/curriculum`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/courses`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const curriculumData = await curriculumRes.json();
      const coursesData = await coursesRes.json();

      // Đồng bộ dữ liệu từ courses
      const syncedSemesters: Semester[] = (curriculumData.data || curriculumData || []).map((semester: Semester) => ({
        ...semester,
        subjects: semester.subjects?.map((subject: Subject) => {
          const matchedCourse: Course | undefined = coursesData.data?.find(
            (c: Course) => c.courseCode === subject.code
          );
          return matchedCourse ? {
            ...subject,
            name: matchedCourse.courseName,
            credits: matchedCourse.credits,
            department: matchedCourse.department || subject.department,
            courseId: matchedCourse._id,
            isSynced: true
          } : {
            ...subject,
            isSynced: false
          };
        }) || []
      }));

      setSemesters(syncedSemesters);
      if (coursesData.success) {
        setCourses(coursesData.data || []);
      }
    } catch (error) {
      Alert.alert("Lỗi", "Không thể tải dữ liệu");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = (): void => {
    setRefreshing(true);
    fetchData();
  };

  // API helper
  const apiCall = async (url: string, method: string, body: any = null): Promise<Response> => {
    const token = await AsyncStorage.getItem("token");
    const options: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    };
    if (body) options.body = JSON.stringify(body);
    return fetch(url, options);
  };

  // Subject CRUD
  const handleSaveSubject = async (): Promise<void> => {
    if (!form.name.trim() || !form.code.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin");
      return;
    }

    const matchedCourse: Course | undefined = courses.find(
      (c: Course) => c.courseCode === form.code.trim()
    );

    const subjectData: Subject = {
      name: form.name.trim(),
      code: form.code.trim(),
      credits: parseInt(form.credits) || 0,
      theoryHours: parseInt(form.theory) || 0,
      practiceHours: parseInt(form.practice) || 0,
      isRequired: form.isRequired,
      department: form.department.trim() || "Công nghệ thông tin",
      isCompleted: false,
      semester: modal.semester?.semesterNumber || 1,
      courseId: matchedCourse?._id,
      isSynced: !!matchedCourse
    };

    try {
      const currentSubjects: Subject[] = modal.semester?.subjects || [];
      let updatedSubjects: Subject[];

      if (modal.mode === 'add') {
        updatedSubjects = [...currentSubjects, subjectData];
      } else {
        const subjectId: string = modal.subject?._id || modal.subject?.id || '';
        updatedSubjects = currentSubjects.map((s: Subject) => {
          const sId: string = s._id || s.id || '';
          return sId === subjectId ? { ...s, ...subjectData } : s;
        });
      }

      const response: Response = await apiCall(
        `${API_URL}/curriculum/semester/${modal.semester?.semesterNumber}`,
        "PUT",
        { subjects: updatedSubjects }
      );

      if (response.ok) {
        Alert.alert(
          "Thành công",
          modal.mode === 'add' ? "Thêm môn học thành công" : "Cập nhật môn học thành công"
        );
        setModal({ visible: false, mode: 'add', subject: null, semester: null });
        resetForm();
        fetchData();
      }
    } catch (error) {
      Alert.alert("Lỗi", "Không thể lưu môn học");
    }
  };

  const deleteSubject = (subjectId: string, semester: Semester): void => {
    Alert.alert("Xóa môn học", "Bạn có chắc chắn muốn xóa?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async (): Promise<void> => {
          const updatedSubjects: Subject[] = semester.subjects.filter(
            (s: Subject) => (s._id || s.id) !== subjectId
          );
          const response: Response = await apiCall(
            `${API_URL}/curriculum/semester/${semester.semesterNumber}`,
            "PUT",
            { subjects: updatedSubjects }
          );
          if (response.ok) {
            fetchData();
          }
        }
      }
    ]);
  };

  const toggleCompletion = (subjectId: string, currentStatus: boolean, semester: Semester): void => {
    const updatedSubjects: Subject[] = semester.subjects.map((s: Subject) => {
      const sId: string = s._id || s.id || '';
      return sId === subjectId ? { ...s, isCompleted: !currentStatus } : s;
    });
    apiCall(
      `${API_URL}/curriculum/semester/${semester.semesterNumber}`,
      "PUT",
      { subjects: updatedSubjects }
    ).then((response: Response) => {
      if (response.ok) {
        fetchData();
      }
    });
  };

  // Semester CRUD
  const handleSaveSemester = async (): Promise<void> => {
    if (!semesterNumber.trim() || isNaN(Number(semesterNumber))) {
      Alert.alert("Lỗi", "Vui lòng nhập số học kỳ hợp lệ");
      return;
    }

    const num: number = parseInt(semesterNumber);
    const exists: boolean = semesters.some((s: Semester) =>
      s.semesterNumber === num &&
      (semesterModal.mode === 'add' ||
        (semesterModal.semester && s.semesterNumber !== semesterModal.semester.semesterNumber))
    );

    if (exists) {
      Alert.alert("Lỗi", `Học kỳ ${num} đã tồn tại`);
      return;
    }

    try {
      let response: Response;
      if (semesterModal.mode === 'add') {
        response = await apiCall(`${API_URL}/curriculum`, "POST", {
          semesterNumber: num,
          subjects: [],
          totalCredits: 0
        });
      } else {
        response = await apiCall(
          `${API_URL}/curriculum/semester/${semesterModal.semester?.semesterNumber}`,
          "PUT",
          {
            semesterNumber: num,
            subjects: semesterModal.semester?.subjects || []
          }
        );
      }

      if (response.ok) {
        Alert.alert(
          "Thành công",
          semesterModal.mode === 'add' ? "Thêm học kỳ thành công" : "Cập nhật học kỳ thành công"
        );
        setSemesterModal({ visible: false, mode: 'add', semester: null });
        setSemesterNumber('');
        fetchData();
      }
    } catch (error) {
      Alert.alert("Lỗi", "Không thể lưu học kỳ");
    }
  };

  const deleteSemester = (semester: Semester): void => {
    Alert.alert("Xóa học kỳ", `Xóa học kỳ ${semester.semesterNumber}?`, [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async (): Promise<void> => {
          const response: Response = await apiCall(
            `${API_URL}/curriculum/semester/${semester.semesterNumber}`,
            "DELETE"
          );
          if (response.ok) {
            fetchData();
          }
        }
      }
    ]);
  };

  // Đồng bộ từ courses
  const syncFromCourses = async (): Promise<void> => {
    try {
      const token = await AsyncStorage.getItem("token");
      const coursesRes = await fetch(`${API_URL}/courses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const coursesData = await coursesRes.json();

      if (!coursesData.success) {
        Alert.alert("Lỗi", "Không thể lấy danh sách môn học");
        return;
      }

      // Lọc chỉ lấy các môn học có semester là số (1, 2, 3, ...)
      const validCourses = (coursesData.data || []).filter((course: Course) => {
        const semester = parseInt(course.semester || "0");
        // Chỉ lấy các semester từ 1 đến 10 (hoặc số hợp lý)
        return semester >= 1 && semester <= 10;
      });

      if (validCourses.length === 0) {
        Alert.alert("Thông báo", "Không có môn học nào có học kỳ hợp lệ để đồng bộ");
        return;
      }

      const grouped: Record<number, Course[]> = validCourses.reduce(
        (acc: Record<number, Course[]>, course: Course) => {
          const semester: number = parseInt(course.semester || "1");
          if (!acc[semester]) acc[semester] = [];
          acc[semester].push(course);
          return acc;
        },
        {} as Record<number, Course[]>
      );

      const syncPromises: Promise<Response>[] = Object.entries(grouped).map(
        async ([semesterNum, courseList]: [string, Course[]]) => {
          const semesterNumber = parseInt(semesterNum);

          // Chỉ xử lý các học kỳ từ 1-10
          if (semesterNumber < 1 || semesterNumber > 12) {
            return Promise.resolve(new Response(null, { status: 200 }));
          }

          const existing: Semester | undefined = semesters.find(
            (s: Semester) => s.semesterNumber === semesterNumber
          );

          const subjects: Subject[] = courseList.map((course: Course) => ({
            name: course.courseName,
            code: course.courseCode,
            credits: course.credits,
            theoryHours: 30,
            practiceHours: 15,
            isRequired: true,
            department: course.department || "Công nghệ thông tin",
            isCompleted: false,
            semester: semesterNumber,
            courseId: course._id,
            isSynced: true
          }));

          if (existing) {
            // Hợp nhất subjects
            const merged: Subject[] = [...existing.subjects];
            subjects.forEach((subject: Subject) => {
              const idx: number = merged.findIndex((s: Subject) => s.code === subject.code);
              if (idx >= 0) {
                merged[idx] = { ...merged[idx], ...subject };
              } else {
                merged.push(subject);
              }
            });
            return apiCall(
              `${API_URL}/curriculum/semester/${existing.semesterNumber}`,
              "PUT",
              { subjects: merged }
            );
          } else {
            return apiCall(`${API_URL}/curriculum`, "POST", {
              semesterNumber: semesterNumber,
              subjects,
              totalCredits: subjects.reduce((sum: number, s: Subject) => sum + s.credits, 0)
            });
          }
        }
      );

      await Promise.all(syncPromises);
      Alert.alert("Thành công", "Đồng bộ dữ liệu thành công");
      fetchData();
    } catch (error) {
      Alert.alert("Lỗi", "Không thể đồng bộ dữ liệu");
    }
  };

  // Form helpers
  const resetForm = (): void => {
    setForm({
      name: '',
      code: '',
      credits: '3',
      theory: '45',
      practice: '0',
      isRequired: true,
      department: ''
    });
  };

  const openSubjectModal = (mode: 'add' | 'edit', semester: Semester, subject: Subject | null = null): void => {
    setModal({ visible: true, mode, subject, semester });
    if (subject) {
      setForm({
        name: subject.name,
        code: subject.code,
        credits: String(subject.credits),
        theory: String(subject.theoryHours),
        practice: String(subject.practiceHours),
        isRequired: subject.isRequired,
        department: subject.department || ''
      });
    } else {
      resetForm();
      setForm(prev => ({ ...prev, code: `M${Date.now()}` }));
    }
  };

  // Render
  const renderSubject = (
    subject: Subject,
    semester: Semester
  ): ReactElement => {
    const isSynced =
      !!courses.find((c: Course) => c.courseCode === subject.code) ||
      !!subject.isSynced;

    const subjectId =
      subject._id || subject.id || subject.code;

    return (
      <View key={subjectId} style={styles.subjectCard}>
        <View style={styles.subjectHeader}>
          <View style={styles.subjectTitle}>
            <Text style={styles.subjectName}>{subject.name}</Text>
            <View style={styles.subjectCodeContainer}>
              <Text style={styles.subjectCode}>{subject.code}</Text>
              {isSynced && (
                <Ionicons name="sync" size={14} color="#4CAF50" style={styles.syncIcon} />
              )}
            </View>
          </View>
          <View style={styles.subjectActions}>
            <TouchableOpacity
              onPress={(): void => toggleCompletion(subjectId, subject.isCompleted, semester)}
              style={[
                styles.statusButton,
                subject.isCompleted ? styles.completed : styles.incomplete
              ]}
            >
              <Text style={styles.statusText}>
                {subject.isCompleted ? "Hoàn thành" : "Chưa hoàn thành"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={(): void => openSubjectModal('edit', semester, subject)}
              style={styles.editButton}
            >
              <Ionicons name="pencil" size={20} color="#2196F3" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={(): void => deleteSubject(subjectId, semester)}
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
            <Text style={[
              styles.detailValue,
              subject.isRequired ? styles.requiredText : styles.electiveText
            ]}>
              {subject.isRequired ? "Bắt buộc" : "Tự chọn"}
            </Text>
          </View>
        </View>
        {subject.department && (
          <Text style={styles.subjectDepartment}>Khoa: {subject.department}</Text>
        )}
      </View>
    );
  };

  const renderSemester = (semester: Semester): ReactElement => {
    const semesterId: string = semester._id || semester.id || String(semester.semesterNumber);

    return (
      <View key={semesterId} style={styles.semesterCard}>
        <View style={styles.semesterHeader}>
          <Text style={styles.semesterTitle}>Học kỳ {semester.semesterNumber}</Text>
          <View style={styles.semesterHeaderRight}>
            <View style={styles.semesterStats}>
              <Text style={styles.statsText}>
                {semester.subjects?.length || 0} môn |
                {semester.subjects?.reduce((sum: number, s: Subject) => sum + s.credits, 0) || 0} TC
              </Text>
            </View>
            <TouchableOpacity
              onPress={(): void => {
                setSemesterModal({ visible: true, mode: 'edit', semester });
                setSemesterNumber(String(semester.semesterNumber));
              }}
              style={styles.editSemesterButton}
            >
              <Ionicons name="pencil" size={20} color="#2196F3" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={(): void => deleteSemester(semester)}
              style={styles.deleteSemesterButton}
            >
              <Ionicons name="trash-outline" size={20} color="#ff4444" />
            </TouchableOpacity>
          </View>
        </View>

        {!semester.subjects?.length ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Chưa có môn học nào</Text>
          </View>
        ) : (
          semester.subjects.map((subject: Subject) => renderSubject(subject, semester))
        )}

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.addButton, styles.halfButton]}
            onPress={(): void => openSubjectModal('add', semester)}
          >
            <Ionicons name="add" size={20} color="#4CAF50" />
            <Text style={styles.addButtonText}>Thêm môn</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addButton, styles.halfButton, styles.syncButton]}
            onPress={syncFromCourses}
          >
            <Ionicons name="sync" size={20} color="#2196F3" />
            <Text style={[styles.addButtonText, styles.syncButtonText]}>Đồng bộ</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={(): void => router.replace('/admin/dashboard')}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#0c0707" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chương trình khung</Text>
          <Text style={styles.headerSubtitle}>Kỹ thuật phần mềm - Đại học chính quy</Text>

          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.addSemesterButton}
              onPress={(): void => {
                setSemesterModal({ visible: true, mode: 'add', semester: null });
                setSemesterNumber('');
              }}
            >
              <Ionicons name="add-circle" size={20} color="white" />
              <Text style={styles.addSemesterText}>Thêm học kỳ</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.addSemesterButton, styles.syncAllButton]}
              onPress={syncFromCourses}
            >
              <Ionicons name="sync" size={20} color="white" />
              <Text style={styles.addSemesterText}>Đồng bộ</Text>
            </TouchableOpacity>
          </View>
        </View>

        {semesters.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Chưa có học kỳ nào</Text>
          </View>
        ) : (
          semesters.map((semester: Semester) => renderSemester(semester))
        )}
      </ScrollView>

      {/* Subject Modal */}
      <Modal
        visible={modal.visible}
        transparent
        animationType="slide"
        onRequestClose={(): void => {
          setModal({ visible: false, mode: 'add', subject: null, semester: null });
          resetForm();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {modal.mode === 'add' ? 'Thêm môn học' : 'Sửa môn học'}
            </Text>
            <Text style={styles.modalSubtitle}>
              Học kỳ {modal.semester?.semesterNumber}
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Tên môn học *"
              value={form.name}
              onChangeText={(text: string): void => setForm({ ...form, name: text })}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Mã môn học *"
              value={form.code}
              onChangeText={(text: string): void => setForm({ ...form, code: text })}
            />

            <View style={styles.modalRow}>
              <TextInput
                style={[styles.modalInput, styles.modalInputHalf]}
                placeholder="Tín chỉ"
                value={form.credits}
                onChangeText={(text: string): void => setForm({ ...form, credits: text })}
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.modalInput, styles.modalInputHalf]}
                placeholder="Lý thuyết "
                value={form.theory}
                onChangeText={(text: string): void => setForm({ ...form, theory: text })}
                keyboardType="numeric"
              />
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Thực hành (h)"
              value={form.practice}
              onChangeText={(text: string): void => setForm({ ...form, practice: text })}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Khoa/Bộ môn"
              value={form.department}
              onChangeText={(text: string): void => setForm({ ...form, department: text })}
            />

            <View style={styles.modalRow}>
              <TouchableOpacity
                style={[styles.typeSelector, form.isRequired && styles.typeSelectorActive]}
                onPress={(): void => setForm({ ...form, isRequired: true })}
              >
                <Text style={[styles.typeSelectorText, form.isRequired && styles.typeSelectorTextActive]}>
                  Bắt buộc
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeSelector, !form.isRequired && styles.typeSelectorActive]}
                onPress={(): void => setForm({ ...form, isRequired: false })}
              >
                <Text style={[styles.typeSelectorText, !form.isRequired && styles.typeSelectorTextActive]}>
                  Tự chọn
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={(): void => {
                  setModal({ visible: false, mode: 'add', subject: null, semester: null });
                  resetForm();
                }}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleSaveSubject}
              >
                <Text style={styles.confirmButtonText}>
                  {modal.mode === 'add' ? 'Thêm' : 'Cập nhật'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Semester Modal */}
      <Modal
        visible={semesterModal.visible}
        transparent
        animationType="slide"
        onRequestClose={(): void => {
          setSemesterModal({ visible: false, mode: 'add', semester: null });
          setSemesterNumber('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {semesterModal.mode === 'add' ? 'Thêm học kỳ' : 'Sửa học kỳ'}
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Số học kỳ (VD: 3)"
              value={semesterNumber}
              onChangeText={setSemesterNumber}
              keyboardType="numeric"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={(): void => {
                  setSemesterModal({ visible: false, mode: 'add', semester: null });
                  setSemesterNumber('');
                }}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleSaveSemester}
              >
                <Text style={styles.confirmButtonText}>
                  {semesterModal.mode === 'add' ? 'Thêm' : 'Cập nhật'}
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