// src/contexts/AuthContext.tsx
import { API_URL } from '@/config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Hàm lấy thông tin user đầy đủ từ API - FIXED
  const fetchFullUserProfile = async (userId: string): Promise<User | null> => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.warn('No token available for profile fetch');
        return null;
      }

      // Try the correct endpoint - OPTION 1: /users/profile (uses token)
      try {
        const response = await fetch(`${API_URL}/users/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Profile fetched successfully via /users/profile');
          return data.user || data;
        }
      } catch (error) {
        console.warn('Fetch via /users/profile failed:', error);
      }

      // OPTION 2: Try /users/:id (without /profile)
      try {
        const response = await fetch(`${API_URL}/users/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Profile fetched successfully via /users/:id');
          return data.user || data;
        }
      } catch (error) {
        console.warn('Fetch via /users/:id failed:', error);
      }

      // OPTION 3: Try the original endpoint but handle 404 gracefully
      try {
        const response = await fetch(`${API_URL}/users/${userId}/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Profile fetched successfully via /users/:id/profile');
          return data.user || data;
        } else if (response.status === 404) {
          // Profile not found - this is fine for admin users
          console.log('ℹ️ Profile not found for user (this is normal for admins)');
          return null;
        } else {
          console.warn(`Profile fetch failed with status: ${response.status}`);
          return null;
        }
      } catch (error) {
        console.warn('Fetch via /users/:id/profile failed:', error);
        return null;
      }
    } catch (error) {
      console.warn('Fetch full profile failed:', error);
      return null;
    }
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        setIsLoading(true);
        const savedUser = await AsyncStorage.getItem('user');
        const savedToken = await AsyncStorage.getItem('token');
        
        if (savedToken) {
          setToken(savedToken);
        }
        
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
          
          // Only fetch full profile if user is NOT an admin
          // or if we have a valid userId
          if (parsedUser.role !== 'admin' && (parsedUser.id || parsedUser._id)) {
            const userId = parsedUser.id || parsedUser._id;
            const fullProfile = await fetchFullUserProfile(userId);
            if (fullProfile) {
              setUser(fullProfile);
              await AsyncStorage.setItem('user', JSON.stringify(fullProfile));
            }
          } else if (parsedUser.role === 'admin') {
            console.log('ℹ️ Admin user - skipping profile fetch');
          }
        }
      } catch (error) {
        console.warn('Auth load user failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    try {
      setIsLoading(true);
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
      
      // Store token first
      if (data.token) {
        await AsyncStorage.setItem('token', data.token);
        setToken(data.token);
      }
      
      // Only fetch full profile for non-admin users
      if (loggedUser.role !== 'admin' && (loggedUser.id || loggedUser._id)) {
        const userId = loggedUser.id || loggedUser._id;
        const fullProfile = await fetchFullUserProfile(userId);
        if (fullProfile) {
          loggedUser = { ...loggedUser, ...fullProfile };
        }
      } else if (loggedUser.role === 'admin') {
        console.log('ℹ️ Admin user logged in - skipping profile fetch');
      }
      
      await AsyncStorage.setItem('user', JSON.stringify(loggedUser));
      setUser(loggedUser);
      return loggedUser;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      setUser(null);
      setToken(null);
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('token');
    } finally {
      setIsLoading(false);
    }
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
    if (!user) return;
    
    // Skip refresh for admin users
    if (user.role === 'admin') {
      console.log('ℹ️ Admin user - skipping refresh');
      return;
    }
    
    if (user.id || user._id) {
      try {
        setIsLoading(true);
        const userId = user.id || user._id;
        const fullProfile = await fetchFullUserProfile(userId);
        if (fullProfile) {
          setUser(fullProfile);
          await AsyncStorage.setItem('user', JSON.stringify(fullProfile));
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, updateUser, refreshUser }}>
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

export const getAuthToken = async () => {
  try {
    return await AsyncStorage.getItem('token');
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};