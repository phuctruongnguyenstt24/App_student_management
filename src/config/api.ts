import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * 👉 Lấy header cho API (có kèm token nếu đã login)
 */
const getAuthHeaders = async (): Promise<Record<string, string>> => {
  try {
    const token = await AsyncStorage.getItem('userToken');

    if (token) {
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
    }

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
  // 🌐 WEB
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

  // 📱 EXPO GO - Cách 1: Lấy từ expoConfig
  try {
    const hostUri = Constants.expoConfig?.hostUri;
    console.log('[DEBUG] hostUri từ expoConfig:', hostUri);
    
    if (hostUri) {
      const ip = hostUri.split(':')[0];
      console.log('[DEBUG] IP từ expoConfig:', ip);
      
      if (ip && ip.match(/^(\d{1,3}\.){3}\d{1,3}$/)) {
        const url = `http://${ip}:5000/api`;
        console.log('[DEBUG] URL từ expoConfig:', url);
        return url;
      }
    }
  } catch (error) {
    console.error('[DEBUG] Lỗi lấy hostUri từ expoConfig:', error);
  }

  // 📱 EXPO GO - Cách 2: Lấy từ manifest (Expo cũ)
  try {
    const manifest = Constants.manifest || Constants.__unsafeNoWarnManifest;
    console.log('[DEBUG] manifest:', manifest);
    
    if (manifest?.hostUri) {
      const ip = manifest.hostUri.split(':')[0];
      console.log('[DEBUG] IP từ manifest:', ip);
      
      if (ip && ip.match(/^(\d{1,3}\.){3}\d{1,3}$/)) {
        const url = `http://${ip}:5000/api`;
        console.log('[DEBUG] URL từ manifest:', url);
        return url;
      }
    }
  } catch (error) {
    console.error('[DEBUG] Lỗi lấy manifest:', error);
  }

  // ⚠️ IP MẶC ĐỊNH - Cập nhật IP hiện tại của máy tính bạn
  // Cách tìm IP: 
  // - Windows: cmd -> ipconfig -> tìm IPv4
  // - Mac/Linux: ifconfig | grep inet
  const defaultIp = '192.168.1.100'; // 👈 THAY BẰNG IP CỦA BẠN
  console.log('[DEBUG] Dùng IP mặc định:', defaultIp);
  return `http://${defaultIp}:5000/api`;
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
    const token = await AsyncStorage.getItem("userToken");

    const response = await fetch(`${API_URL}/curriculum`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

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