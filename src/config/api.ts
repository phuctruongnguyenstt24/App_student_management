// config/api.ts
import { Platform } from 'react-native';
import Constants from 'expo-constants';

export const getApiUrl = (): string => {
  // Trên Web - kiểm tra Platform trước
  if (Platform.OS === 'web') {
    // Chỉ gọi window khi ở web
    if (typeof window !== 'undefined') {
      const hostname = window?.location?.hostname || 'localhost';
      if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        return `http://${hostname}:5000/api`;
      }
      return `http://localhost:5000/api`;
    }
    return 'http://localhost:5000/api';
  }
  
  // Trên Mobile (Expo)
  try {
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
      const ip = hostUri.split(':')[0];
      // Kiểm tra IP hợp lệ
      if (ip && ip.match(/^(\d{1,3}\.){3}\d{1,3}$/)) {
        return `http://${ip}:5000/api`;
      }
    }
  } catch (error) {
    console.warn('Không thể lấy IP từ Constants:', error);
  }
  
  // Fallback - thử lấy IP từ các nguồn khác
  try {
    // Thử lấy từ Constants.manifest (Expo Go)
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
  
  // IP mặc định (thay bằng IP của máy tính bạn)
  return 'http://192.168.1.100:5000/api';
};

export const API_URL = getApiUrl();