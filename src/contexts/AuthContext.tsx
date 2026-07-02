// src/contexts/AuthContext.tsx
import { API_URL } from '@/config/api'; //Import hàm gọi API tới backend. 
import AsyncStorage from '@react-native-async-storage/async-storage'; //AsyncStorage: Dùng để lưu dữ liệu vào bộ nhớ điện thoại. ==> Khi tắt app mở lại vẫn còn.
import React, { createContext, useContext, useEffect, useState } from 'react';

// Cập nhật interface User với đầy đủ các trường từ CSDL
interface User {
  id?: string;
  username?: string;
  fullName?: string;
  studentId?: string;
  email?: string;
  phone?: string;
  role?: string;
  avatar?: string;
  // Thông tin học vấn
  faculty?: string;
  facultyId?: string;
  departmentId?: string;
  class?: string;
  course?: string;
  // Thông tin cá nhân
  dateOfBirth?: string;
  placeOfBirth?: string;
  address?: string;
  status?: string;
  gender?: string;
  // Academic Info
  academicInfo?: {
    enrollmentDate?: string;
    trainingLevel?: string;
    trainingType?: string;
    courseYear?: string;
    base?: string;
    profileCode?: string;
  };
  // Personal Info
  personalInfo?: {
    ethnicity?: string;
    religion?: string;
    nationality?: string;
    region?: string;
    cccd?: string;
    cccdIssueDate?: string;
    cccdIssuePlace?: string;
    object?: string;
    policyType?: string;
    unionJoinDate?: string;
    partyJoinDate?: string;
    permanentResidence?: string;
    bankName?: string;
    bankBranch?: string;
    accountHolder?: string;
    accountNumber?: string;
  };
  // Family Info
  familyInfo?: {
    father?: {
      name?: string;
      birthYear?: string;
      occupation?: string;
      nationality?: string;
      ethnicity?: string;
      religion?: string;
      workplace?: string;
      position?: string;
      phone?: string;
      permanentResidence?: string;
      currentResidence?: string;
    };
    mother?: {
      name?: string;
      birthYear?: string;
      occupation?: string;
      nationality?: string;
      ethnicity?: string;
      religion?: string;
      workplace?: string;
      position?: string;
      phone?: string;
      permanentResidence?: string;
      currentResidence?: string;
    };
  };
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  token:string | null;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  refreshUser: () => Promise<void>; // Thêm hàm refresh
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] =
  useState<string | null>(null);

  // Hàm lấy thông tin user đầy đủ từ API
  const fetchFullUserProfile = async (userId: string): Promise<User | null> => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/users/${userId}/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.user || data;
      }
      return null;
    } catch (error) {
      console.warn('Fetch full profile failed:', error);
      return null;
    }
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        const savedUser = await AsyncStorage.getItem('user');
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
          
          // Nếu có userId, lấy thông tin đầy đủ
          if (parsedUser.id || parsedUser._id) {
            const userId = parsedUser.id || parsedUser._id;
            const fullProfile = await fetchFullUserProfile(userId);
            if (fullProfile) {
              setUser(fullProfile);
              await AsyncStorage.setItem('user', JSON.stringify(fullProfile));
            }
          }
        }
      } catch (error) {
        console.warn('Auth load user failed:', error);
      }
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: email.trim(), password }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Đăng nhập thất bại');
    }

    let loggedUser: User = data.user;
    
    // Lấy thông tin đầy đủ của user
    if (loggedUser.id || loggedUser._id) {
      const userId = loggedUser.id || loggedUser._id;
      const fullProfile = await fetchFullUserProfile(userId);
      if (fullProfile) {
        loggedUser = { ...loggedUser, ...fullProfile };
      }
    }
    
    await AsyncStorage.setItem('user', JSON.stringify(loggedUser));
    if (data.token) {
      await AsyncStorage.setItem('token', data.token);
    }
    setUser(loggedUser);
    return loggedUser;
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('token');
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      AsyncStorage.setItem('user', JSON.stringify(updatedUser)).catch((err) => {
        console.warn('Auth update user save failed:', err);
      });
    }
  };

  // Hàm refresh để lấy lại thông tin user mới nhất
  const refreshUser = async () => {
    if (user && (user.id || user._id)) {
      const userId = user.id || user._id;
      const fullProfile = await fetchFullUserProfile(userId);
      if (fullProfile) {
        setUser(fullProfile);
        await AsyncStorage.setItem('user', JSON.stringify(fullProfile));
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, token , login, logout, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}