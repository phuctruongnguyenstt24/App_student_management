import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * 👉 Lấy header cho API (có kèm token nếu đã login)
 */
const getAuthHeaders = async (): Promise<Record<string, string>> => {
  try {
    const token = await AsyncStorage.getItem('userToken');

    // Nếu có token → gửi Authorization
    if (token) {
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
    }

    // Không có token → chỉ gửi Content-Type
    return {
      'Content-Type': 'application/json'
    };

  } catch (error) {
    console.error("Lỗi lấy token:", error);
    return { 'Content-Type': 'application/json' };
  }
};

/**
 * 👉 Tự động lấy API URL tùy theo môi trường
 */
export const getApiUrl = (): string => {

  // 🌐 Nếu chạy WEB
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      const hostname = window?.location?.hostname || 'localhost';

      // Nếu deploy server thật → dùng hostname
      if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        return `http://${hostname}:5000/api`;
      }

      // Local
      return `http://localhost:5000/api`;
    }

    return 'http://localhost:5000/api';
  }

  // 📱 Nếu chạy trên Expo (lấy IP máy dev)
  try {
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
      const ip = hostUri.split(':')[0];

      // Nếu là IP hợp lệ → dùng
      if (ip && ip.match(/^(\d{1,3}\.){3}\d{1,3}$/)) {
        return `http://${ip}:5000/api`;
      }
    }
  } catch (error) { }

  // 🔁 Fallback cách 2 (Expo cũ)
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

  // ❗ Fallback cuối cùng (fix cứng IP)
  return 'http://192.168.1.100:5000/api';
};

/**
 * 👉 BASE URL dùng cho toàn app
 */
export const API_URL = getApiUrl();

// Debug xem đang dùng URL nào
console.log('[API] Using API_URL:', API_URL);



// ================= API CALL =================

/**
 * 👉 Lấy điểm theo học kỳ (admin)
 */
export const fetchGradesBySemester = async (semester: string) => {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(
      `${API_URL}/grades/admin?semester=${semester}`,
      {
        method: 'GET',
        headers,
      }
    );

    return await response.json();
  } catch (error) {
    console.error("Lỗi fetchGradesBySemester:", error);
    throw error;
  }
};

/**
 * 👉 Lưu điểm sinh viên
 */
export const saveStudentGrade = async (data: {
  studentCode: string,
  courseCode: string,
  semester: string,
  midtermScore: number,
  finalScore: number
}) => {
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

/**
 * 👉 Sinh viên xem điểm của mình
 */
export const fetchMyGrades = async (semester: string) => {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(
      `${API_URL}/grades/student/me?semester=${semester}`,
      {
        method: 'GET',
        headers,
      }
    );

    return await response.json();
  } catch (error) {
    console.error("Lỗi fetchMyGrades:", error);
    throw error;
  }
};

/**
 * 👉 Lấy danh sách môn học
 */
export const fetchAllCourses = async () => {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/courses`, {
      method: 'GET',
      headers,
    });

    return await response.json();
  } catch (error) {
    console.error("Lỗi fetchAllCourses:", error);
    return { success: false, data: [] };
  }
};

/**
 * 👉 Lấy chương trình đào tạo
 */
export const fetchCurriculums = async () => {
  try {
    // ⚠️ phải dùng đúng key userToken
    const token = await AsyncStorage.getItem("userToken");

    const response = await fetch(`${API_URL}/curriculum`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    // Nếu server lỗi → không parse JSON (tránh lỗi dấu <)
    if (!response.ok) {
      throw new Error(`Lỗi Server: ${response.status}`);
    }

    const data = await response.json();

    return { success: true, data };

  } catch (error: any) {
    console.error("Lỗi fetchCurriculums:", error);
    return { success: false, message: error.message };
  }
};