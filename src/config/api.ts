// config/api.ts



import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getAuthHeaders = async (): Promise<Record<string, string>> => {
  try {
    const token = await AsyncStorage.getItem('userToken');

    // Nếu có token thì gửi kèm Authorization
    if (token) {
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
    }

    // Nếu không có token thì chỉ gửi Content-Type
    return {
      'Content-Type': 'application/json'
    };

  } catch (error) {
    console.error("Lỗi lấy token:", error);
    return { 'Content-Type': 'application/json' };
  }
};


export const getApiUrl = (): string => {
  // ... (Phần code bên trong giữ nguyên y hệt của bạn) ...
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      const hostname = window?.location?.hostname || 'localhost';
      if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        return `http://${hostname}:5000/api`;
      }
      return `http://localhost:5000/api`;
    }
    return 'http://localhost:5000/api';
  }

  try {
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
      const ip = hostUri.split(':')[0];
      if (ip && ip.match(/^(\d{1,3}\.){3}\d{1,3}$/)) {
        return `http://${ip}:5000/api`;
      }
    }
  } catch (error) { }

  try {
    const manifest = Constants.manifest || Constants.__unsafeNoWarnManifest;
    if (manifest?.hostUri) {
      const ip = manifest.hostUri.split(':')[0];
      if (ip && ip.match(/^(\d{1,3}\.){3}\d{1,3}$/)) {
        return `http://${ip}:5000/api`;
      }
    }
  } catch (error) {
    console.warn('Không thể lấy IP từ manifest:', error);
  }

  return 'http://192.168.1.100:5000/api';
};

// 👉 ĐƯA DÒNG NÀY LÊN ĐÂY (Ngay dưới hàm getApiUrl)
export const API_URL = getApiUrl();


// ==========================================
// CÁC HÀM GỌI API BÊN DƯỚI GIỮ NGUYÊN
// ==========================================

export const fetchGradesBySemester = async (semester: string) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/grades/admin?semester=${semester}`, {
      method: 'GET',
      headers,
    });
    return await response.json();
  } catch (error) {
    console.error("Lỗi fetchGradesBySemester:", error);
    throw error;
  }
};

// Sửa lại dòng khai báo biến truyền vào
export const saveStudentGrade = async (data: { studentCode: string, courseCode: string, semester: string, midtermScore: number, finalScore: number }) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/grades/admin`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    return await response.json();
  } catch (error) {
    console.error("Lỗi saveStudentGrade:", error);
    throw error;
  }
};

export const fetchMyGrades = async (semester: string) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/grades/student/me?semester=${semester}`, {
      method: 'GET',
      headers,
    });
    return await response.json();
  } catch (error) {
    console.error("Lỗi fetchMyGrades:", error);
    throw error;
  }
};
// Lấy danh sách toàn bộ môn học
export const fetchAllCourses = async () => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/courses`, {
      method: 'GET',
      headers,
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Lỗi fetchAllCourses:", error);
    return { success: false, data: [] };
  }
};
// Thêm hàm này vào cuối file src/config/api.ts của bạn
// Đảm bảo bạn đã import AsyncStorage ở đầu file api.ts nhé:
// import AsyncStorage from '@react-native-async-storage/async-storage';

export const fetchCurriculums = async () => {
  try {
    // 1. Phải lấy token để chứng minh đã đăng nhập
    const token = await AsyncStorage.getItem("token");

    // 2. Gọi đúng đường dẫn /curriculum và nhét token vào Headers
    const response = await fetch(`${API_URL}/curriculum`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    // Nếu backend trả về mã lỗi (401, 404, 500...) thì chặn luôn không cho parse JSON để tránh lỗi dấu <
    if (!response.ok) {
      throw new Error(`Lỗi Server: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, data: data };

  } catch (error: any) {
    console.error("Lỗi fetchCurriculums:", error);
    return { success: false, message: error.message };
  }
};