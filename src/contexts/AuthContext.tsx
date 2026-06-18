// src/contexts/AuthContext.tsx
import React, { createContext, useState, useContext } from 'react';

interface User {
  name: string;
  studentId: string;
  dob: string;
  faculty: string;
  class: string;
  email: string;
  phone: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string) => {
    // Giả lập đăng nhập
    setUser({
      name: 'Nguyễn Văn A',
      studentId: '20210001',
      dob: '01/01/2000',
      faculty: 'Công nghệ thông tin',
      class: 'CTTT-K61',
      email: email,
      phone: '0123456789',
    });
  };

  const logout = () => {
    setUser(null);
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
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