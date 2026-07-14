import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/api';

export interface AttendanceStudent {
  studentId: string;
  fullName: string;
  checkedAt: string;
}

export interface AttendanceSession {
  id: string;
  courseId: string;
  courseCode: string;
  courseName: string;
  department?: string;
  requestedAt: string;
  requestedBy: string;
  status: 'active' | 'closed';
  presentStudents: AttendanceStudent[];
}

const ATTENDANCE_SESSIONS_KEY = 'attendance_sessions';
const LEGACY_ATTENDANCE_KEY = 'attendance_session';

export const saveAttendanceSessions = async (sessions: AttendanceSession[] | null) => {
  if (!sessions || sessions.length === 0) {
    await AsyncStorage.removeItem(ATTENDANCE_SESSIONS_KEY);
    await AsyncStorage.removeItem(LEGACY_ATTENDANCE_KEY);
    return [];
  }

  await AsyncStorage.setItem(ATTENDANCE_SESSIONS_KEY, JSON.stringify(sessions));
  return sessions;
};

export const getAttendanceSessions = async (): Promise<AttendanceSession[]> => {
  // Try server first
  try {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      const res = await fetch(`${API_URL}/attendance?status=active`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          // Map server session (_id) to local shape
          return (json.data || []).map((s: any) => ({
            id: s._id,
            courseId: s.courseId,
            courseCode: s.courseCode,
            courseName: s.courseName,
            department: s.department,
            requestedAt: s.requestedAt,
            requestedBy: s.requestedBy,
            status: s.status,
            presentStudents: (s.presentStudents || []).map((p: any) => ({ studentId: p.studentId, fullName: p.fullName, checkedAt: p.checkedAt })),
          } as AttendanceSession));
        }
      }
    }
  } catch (error) {
    console.warn('Attendance API fetch failed, falling back to AsyncStorage', error);
  }

  const stored = await AsyncStorage.getItem(ATTENDANCE_SESSIONS_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as AttendanceSession[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      await AsyncStorage.removeItem(ATTENDANCE_SESSIONS_KEY);
    }
  }

  const legacy = await AsyncStorage.getItem(LEGACY_ATTENDANCE_KEY);
  if (legacy) {
    try {
      const parsed = JSON.parse(legacy) as AttendanceSession;
      const migratedSessions = parsed ? [parsed] : [];
      await saveAttendanceSessions(migratedSessions);
      await AsyncStorage.removeItem(LEGACY_ATTENDANCE_KEY);
      return migratedSessions;
    } catch {
      await AsyncStorage.removeItem(LEGACY_ATTENDANCE_KEY);
    }
  }

  return [];
};

export const upsertAttendanceSession = async (session: AttendanceSession) => {
  // Try to create session on server (admin)
  try {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      const body = {
        courseId: session.courseId,
        courseCode: session.courseCode,
        courseName: session.courseName,
        department: session.department,
      };
      const res = await fetch(`${API_URL}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        // Return fresh list from server
        const sessions = await getAttendanceSessions();
        return sessions;
      }
    }
  } catch (error) {
    console.warn('upsertAttendanceSession failed, falling back to local', error);
  }

  // Fallback: local upsert
  const sessions = await getAttendanceSessions();
  const existingIndex = sessions.findIndex((item) => item.id === session.id || item.courseId === session.courseId);

  if (existingIndex >= 0) {
    sessions[existingIndex] = session;
  } else {
    sessions.push(session);
  }

  return saveAttendanceSessions(sessions);
};

export const closeAttendanceSession = async (sessionId: string) => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      const res = await fetch(`${API_URL}/attendance/${sessionId}/close`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        return getAttendanceSessions();
      }
    }
  } catch (error) {
    console.warn('closeAttendanceSession API failed, falling back to local', error);
  }

  const sessions = await getAttendanceSessions();
  const updatedSessions = sessions.map((session) =>
    session.id === sessionId ? { ...session, status: 'closed' as const } : session
  );

  return saveAttendanceSessions(updatedSessions);
};

export const markAttendanceForStudent = async (
  student: { studentId?: string; fullName?: string },
  sessionId?: string
) => {
  // Try server mark
  try {
    const token = await AsyncStorage.getItem('token');
    if (token && sessionId) {
      const payload = {
        studentId: student.studentId ? student.studentId.toString().trim() : undefined,
        fullName: student.fullName ? student.fullName.toString().trim() : undefined,
      };
      const res = await fetch(`${API_URL}/attendance/${sessionId}/mark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        const sessions = await getAttendanceSessions();
        return sessions;
      }
    }
  } catch (error) {
    console.warn('markAttendanceForStudent API failed, falling back to local', error);
  }

  const sessions = await getAttendanceSessions();
  const studentId = student.studentId?.trim();
  const fullName = student.fullName?.trim();

  if (!studentId && !fullName) {
    return sessions;
  }

  const updatedSessions = sessions.map((session) => {
    if (sessionId && session.id !== sessionId) return session;
    if (!sessionId && session.status !== 'active') return session;

    const alreadyMarked = session.presentStudents.some((item) => {
      if (studentId && item.studentId === studentId) return true;
      if (fullName && item.fullName === fullName) return true;
      return false;
    });

    if (alreadyMarked) {
      return session;
    }

    return {
      ...session,
      presentStudents: [
        ...session.presentStudents,
        {
          studentId: studentId || `student-${Date.now()}`,
          fullName: fullName || 'Sinh viên',
          checkedAt: new Date().toISOString(),
        },
      ],
    };
  });

  await saveAttendanceSessions(updatedSessions);
  return updatedSessions;
};
