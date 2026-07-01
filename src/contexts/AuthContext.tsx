// src/contexts/AuthContext.tsx
import { API_URL } from '@/config/api'; //Import hàm gọi API tới backend. 
import AsyncStorage from '@react-native-async-storage/async-storage'; //AsyncStorage: Dùng để lưu dữ liệu vào bộ nhớ điện thoại. ==> Khi tắt app mở lại vẫn còn.
import React, { createContext, useContext, useEffect, useState } from 'react';

//Khai báo kiểu dữ liệu User ==> Nó quy định một User phải có những thuộc tính nào.
//Dấu ? : Thuộc tính này có thể có hoặc không.
interface User {
  username?: string;
  fullName?: string;
  studentId?: string;
  dob?: string;
  faculty?: string;
  class?: string;
  email?: string;
  phone?: string;
  role?: string;
  [key: string]: any;
}

//Khai báo cấu trúc của Context.
interface AuthContextType {
  user: User | null;//Nếu chưa đăng nhập: user:null
  login: (email: string, password: string) => Promise<User>;//Hàm đăng nhập. nhận email pass trả Promise.
  logout: () => Promise<void>;//Hàm đăng xuất.
  updateUser: (userData: Partial<User>) => void;//Partial<User>:Chỉ cần truyền những trường muốn sửa thay vì toàn bộ user
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
//Đây là component chứa dữ liệu đăng nhập.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);//Nghĩa là chưa đăng nhập. user = null

  useEffect(() => {
    const loadUser = async () => {
      try {
        //Gửi request đến backend và await nó trả 
        const savedUser = await AsyncStorage.getItem('user');
        if (savedUser) {
          //Chuyển dữ liệu backend sang đúng kiểu User.
          setUser(JSON.parse(savedUser));
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

    const loggedUser: User = data.user;
    await AsyncStorage.setItem('user', JSON.stringify(loggedUser));//Lưu user xuống bộ nhớ điện thoại.
    if (data.token) {
      await AsyncStorage.setItem('token', data.token);
    }
    setUser(loggedUser);//gọi loggedUser đã lưu trong phone ra
    return loggedUser;
  };

  const logout = async () => {
    //reset user = null và remove nó khỏi bộ nhớ điện thoại
    setUser(null);
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('token');
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);//sao chép user và ghi đè lên từ updatedUser
      AsyncStorage.setItem('user', JSON.stringify(updatedUser)).catch((err) => {
        console.warn('Auth update user save failed:', err);
      });
    }
  };

  //Đưa các dữ liệu và hàm ra ngoài.value={{ user, login, logout, updateUser 
  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom Hook dùng để lấy dữ liệu từ AuthContext.
// Được gọi trong các component (ví dụ HomeScreen) để lấy user,
// login, logout, updateUser, restoreSession.
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}