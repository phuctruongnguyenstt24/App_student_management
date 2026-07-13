import AsyncStorage from '@react-native-async-storage/async-storage';

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
