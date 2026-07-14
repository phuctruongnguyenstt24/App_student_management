// contexts/FieldsContext.tsx
import React, { createContext, useContext, ReactNode } from 'react';

// Định nghĩa các hằng số fields
export const FIELDS = {
  // User fields
  user: {
    fullName: { 
      type: 'string', 
      required: true, 
      label: 'Họ và tên',
      placeholder: 'Nhập họ và tên'
    },
    email: { 
      type: 'email', 
      required: true, 
      label: 'Email',
      placeholder: 'example@email.com',
      keyboardType: 'email-address'
    },
    phone: { 
      type: 'string', 
      label: 'Số điện thoại',
      placeholder: '0xx xxx xxxx',
      keyboardType: 'phone-pad'
    },
    address: { 
      type: 'string', 
      label: 'Địa chỉ',
      placeholder: 'Nhập địa chỉ'
    },
    password: {
      type: 'string',
      required: true,
      label: 'Mật khẩu',
      placeholder: 'Nhập mật khẩu',
      secureTextEntry: true
    },
    role: {
      type: 'enum',
      label: 'Vai trò',
      options: ['admin', 'teacher', 'student']
    }
  },

  // Student fields
  student: {
    studentId: { 
      type: 'string', 
      required: true, 
      label: 'Mã sinh viên',
      placeholder: 'Nhập mã sinh viên'
    },
    fullName: { 
      type: 'string', 
      required: true, 
      label: 'Họ tên',
      placeholder: 'Nhập họ tên'
    },
    class: { 
      type: 'string', 
      label: 'Lớp',
      placeholder: 'Nhập lớp'
    },
    course: { 
      type: 'string', 
      label: 'Khóa học',
      placeholder: 'Nhập khóa học'
    },
    dateOfBirth: { 
      type: 'date', 
      label: 'Ngày sinh',
      placeholder: 'DD/MM/YYYY'
    },
    gender: {
      type: 'enum',
      label: 'Giới tính',
      options: ['Nam', 'Nữ', 'Khác']
    }
  },

  // Course fields
  course: {
    courseCode: { 
      type: 'string', 
      required: true, 
      label: 'Mã môn học', 
      uppercase: true,
      placeholder: 'Nhập mã môn học'
    },
    courseName: { 
      type: 'string', 
      required: true, 
      label: 'Tên môn học',
      placeholder: 'Nhập tên môn học'
    },
    credits: { 
      type: 'number', 
      required: true, 
      label: 'Số tín chỉ', 
      min: 1, 
      max: 10,
      placeholder: '1-10'
    },
    department: { 
      type: 'string', 
      label: 'Khoa/Bộ môn',
      placeholder: 'Chọn khoa'
    },
    semester: { 
      type: 'string', 
      label: 'Học kỳ',
      placeholder: 'VD: HK1 2024'
    },
    description: {
      type: 'string',
      label: 'Mô tả',
      placeholder: 'Nhập mô tả môn học',
      multiline: true
    },
  },

  // Attendance fields
  attendance: {
    studentId: { 
      type: 'string', 
      label: 'Mã sinh viên',
      placeholder: 'Nhập mã sinh viên'
    },
    fullName: { 
      type: 'string', 
      label: 'Họ tên',
      placeholder: 'Nhập họ tên'
    },
    checkedAt: { 
      type: 'date', 
      label: 'Thời gian điểm danh'
    },
    status: { 
      type: 'enum', 
      label: 'Trạng thái',
      options: ['active', 'closed', 'pending'],
      defaultValue: 'active'
    },
  },

  // Schedule fields
  schedule: {
    dayOfWeek: { 
      type: 'enum[]', 
      label: 'Thứ',
      options: ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']
    },
    startTime: { 
      type: 'time', 
      required: true, 
      label: 'Giờ bắt đầu',
      placeholder: 'HH:MM'
    },
    endTime: { 
      type: 'time', 
      required: true, 
      label: 'Giờ kết thúc',
      placeholder: 'HH:MM'
    },
    room: { 
      type: 'string', 
      required: true, 
      label: 'Phòng học',
      placeholder: 'Nhập phòng học'
    },
    lecturer: { 
      type: 'string', 
      required: true, 
      label: 'Giảng viên',
      placeholder: 'Nhập tên giảng viên'
    },
    maxStudents: { 
      type: 'number', 
      required: true, 
      label: 'Sĩ số tối đa', 
      default: 50,
      placeholder: '50'
    },
    currentStudents: { 
      type: 'number', 
      label: 'Sĩ số hiện tại', 
      default: 0
    },
    type: {
      type: 'enum',
      label: 'Loại lịch',
      options: ['theory', 'practice', 'exam'],
      defaultValue: 'theory'
    }
  },

  // Faculty fields
  faculty: {
    name: { 
      type: 'string', 
      required: true, 
      label: 'Tên khoa',
      placeholder: 'Nhập tên khoa'
    },
    code: { 
      type: 'string', 
      required: true, 
      label: 'Mã khoa', 
      uppercase: true,
      placeholder: 'Nhập mã khoa'
    },
  },

  // Department fields
  department: {
    name: { 
      type: 'string', 
      required: true, 
      label: 'Tên bộ môn',
      placeholder: 'Nhập tên bộ môn'
    },
    code: { 
      type: 'string', 
      required: true, 
      label: 'Mã bộ môn', 
      uppercase: true,
      placeholder: 'Nhập mã bộ môn'
    },
    facultyId: {
      type: 'string',
      required: true,
      label: 'Khoa',
      placeholder: 'Chọn khoa'
    }
  },

  // Curriculum fields
  curriculum: {
    subjectName: { 
      type: 'string', 
      required: true, 
      label: 'Tên môn học',
      placeholder: 'Nhập tên môn học'
    },
    subjectCode: { 
      type: 'string', 
      required: true, 
      label: 'Mã môn học',
      placeholder: 'Nhập mã môn học'
    },
    credits: { 
      type: 'number', 
      required: true, 
      label: 'Số tín chỉ', 
      min: 1, 
      max: 10,
      placeholder: '1-10'
    },
    theoryHours: { 
      type: 'number', 
      label: 'Giờ lý thuyết', 
      default: 0,
      placeholder: '0'
    },
    practiceHours: { 
      type: 'number', 
      label: 'Giờ thực hành', 
      default: 0,
      placeholder: '0'
    },
    isRequired: { 
      type: 'boolean', 
      label: 'Môn bắt buộc', 
      default: true 
    },
    isCompleted: {
      type: 'boolean',
      label: 'Đã hoàn thành',
      default: false
    },
    semesterNumber: { 
      type: 'number', 
      required: true, 
      label: 'Học kỳ',
      placeholder: '1'
    },
  },

  // Common fields
  common: {
    id: { type: 'string', label: 'ID' },
    createdAt: { type: 'date', label: 'Ngày tạo' },
    updatedAt: { type: 'date', label: 'Ngày cập nhật' },
    isActive: { type: 'boolean', label: 'Hoạt động', default: true },
    note: { 
      type: 'string', 
      label: 'Ghi chú',
      placeholder: 'Nhập ghi chú',
      multiline: true
    }
  }
} as const;

// Type helpers
export type FieldKey = keyof typeof FIELDS;
export type FieldConfig = typeof FIELDS;

// Context
interface FieldsContextType {
  fields: typeof FIELDS;
  getFieldLabel: (category: keyof typeof FIELDS, field: string) => string;
  getFieldType: (category: keyof typeof FIELDS, field: string) => string;
  getFieldConfig: (category: keyof typeof FIELDS, field: string) => any;
  getFieldOptions: (category: keyof typeof FIELDS, field: string) => string[] | undefined;
  getPlaceholder: (category: keyof typeof FIELDS, field: string) => string | undefined;
  getDefaultValue: (category: keyof typeof FIELDS, field: string) => any;
  isFieldRequired: (category: keyof typeof FIELDS, field: string) => boolean;
}

const FieldsContext = createContext<FieldsContextType | undefined>(undefined);

export function FieldsProvider({ children }: { children: ReactNode }) {
  const getFieldConfig = (category: keyof typeof FIELDS, field: string): any => {
    const categoryFields = FIELDS[category] as Record<string, any>;
    return categoryFields[field] || null;
  };

  const getFieldLabel = (category: keyof typeof FIELDS, field: string): string => {
    const config = getFieldConfig(category, field);
    return config?.label || field;
  };

  const getFieldType = (category: keyof typeof FIELDS, field: string): string => {
    const config = getFieldConfig(category, field);
    return config?.type || 'string';
  };

  const getFieldOptions = (category: keyof typeof FIELDS, field: string): string[] | undefined => {
    const config = getFieldConfig(category, field);
    return config?.options;
  };

  const getPlaceholder = (category: keyof typeof FIELDS, field: string): string | undefined => {
    const config = getFieldConfig(category, field);
    return config?.placeholder;
  };

  const getDefaultValue = (category: keyof typeof FIELDS, field: string): any => {
    const config = getFieldConfig(category, field);
    return config?.default;
  };

  const isFieldRequired = (category: keyof typeof FIELDS, field: string): boolean => {
    const config = getFieldConfig(category, field);
    return config?.required || false;
  };

  return (
    <FieldsContext.Provider value={{
      fields: FIELDS,                //biến quan trọng
      getFieldLabel,
      getFieldType,
      getFieldConfig,
      getFieldOptions,
      getPlaceholder,
      getDefaultValue,
      isFieldRequired,
    }}>
      {children}
    </FieldsContext.Provider>
  );
}

export function useFields() {
  const context = useContext(FieldsContext);
  if (!context) {
    throw new Error('useFields must be used within FieldsProvider');
  }
  return context;
}