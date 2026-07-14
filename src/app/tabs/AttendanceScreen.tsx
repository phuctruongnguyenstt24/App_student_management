import { useEffect, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { getAttendanceSessions, markAttendanceForStudent, type AttendanceSession } from "../../utils/attendanceStorage";

export default function AttendanceScreen() {
  const { user } = useAuth();
  const [attendanceSessions, setAttendanceSessions] = useState<AttendanceSession[]>([]);
  const [markingSessionId, setMarkingSessionId] = useState<string | null>(null);

  useEffect(() => {
    const loadSessions = async () => {
      const sessions = await getAttendanceSessions();
      setAttendanceSessions(sessions.filter((session) => session.status === 'active'));
    };

    loadSessions();
    const interval = setInterval(loadSessions, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAttendance = async (sessionId: string) => {
    if (!user) return;

    setMarkingSessionId(sessionId);
    const updatedSessions = await markAttendanceForStudent(
      {
        studentId: user.studentId || user.id,
        fullName: user.fullName || user.username,
      },
      sessionId
    );
    setAttendanceSessions((updatedSessions || []).filter((session) => session.status === 'active'));
    setMarkingSessionId(null);
  };

  const isMarked = (session: AttendanceSession) => {
    const studentId = user?.studentId || user?.id;
    return session.presentStudents.some((student) => {
      if (studentId && student.studentId === studentId) return true;
      return student.fullName === (user?.fullName || user?.username);
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Điểm danh</Text>
      </View>

      {/* Card */}
      <View style={styles.card}>
        {attendanceSessions.length > 0 ? (
          attendanceSessions.map((session) => (
            <View key={session.id} style={styles.sessionCard}>
              <Text style={styles.subject}>{session.courseCode} - {session.courseName}</Text>
              <View style={styles.line} />

              <View style={styles.content}>
                {/* Left */}
                <View style={{ flex: 1 }}>
                  <InfoRow label="Môn :" value={session.courseName} />
                  <InfoRow label="Khoa :" value={session.department || '---'} />
                  <Text style={styles.notYet}>
                    {isMarked(session) ? 'Bạn đã điểm danh' : 'Chưa điểm danh'}
                  </Text>

                  <View style={styles.listBox}>
                    <Text style={styles.listTitle}>Danh sách đã điểm danh</Text>
                    {session.presentStudents.length > 0 ? session.presentStudents.map((student, index) => (
                      <Text key={`${student.studentId}-${index}`} style={styles.listItem}>{index + 1}. {student.fullName}</Text>
                    )) : (
                      <Text style={styles.listEmpty}>Chưa có sinh viên nào điểm danh</Text>
                    )}
                  </View>
                </View>

                {/* Right */}
                <View style={styles.right}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{(user?.fullName || user?.username || 'S').charAt(0).toUpperCase()}</Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.button, isMarked(session) && styles.buttonDisabled]}
                    onPress={() => handleMarkAttendance(session.id)}
                    disabled={isMarked(session) || markingSessionId === session.id}
                  >
                    <Text style={styles.buttonText}>{markingSessionId === session.id ? 'Đang lưu...' : isMarked(session) ? 'Đã điểm danh' : 'Điểm danh'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.subject}>Chưa có buổi điểm danh nào</Text>
            <Text style={styles.emptyText}>Admin cần mở buổi điểm danh cho môn học trước khi sinh viên có thể thực hiện.</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const InfoRow = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (
  <View style={styles.infoRow}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F5F9",
  },
  header: {
    height: 70,
    backgroundColor: "#0B66D6",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  card: {
    margin: 15,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    elevation: 3,
  },
  sessionCard: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#FAFAFA",
  },
  subject: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  line: {
    height: 1,
    backgroundColor: "#E6E6E6",
    marginVertical: 12,
  },
  content: {
    flexDirection: "row",
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  label: {
    width: 70,
    color: "#8B8B8B",
    fontSize: 15,
  },
  value: {
    fontWeight: "700",
    fontSize: 15,
    color: "#222",
  },
  notYet: {
    marginTop: 18,
    color: "#F28C28",
    fontSize: 15,
  },
  listBox: {
    marginTop: 14,
    marginRight:20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    padding: 10,
    backgroundColor: "#F9FAFB",
  },
  listTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },
  listItem: {
    fontSize: 13,
    color: "#374151",
    marginBottom: 4,
  },
  listEmpty: {
    fontSize: 13,
    color: "#6B7280",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 220,
  },
  emptyText: {
    color: "#6B7280",
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
  },
  right: {
    justifyContent: "space-between",
    alignItems: "center",
  },
  avatar: {
    width: 65,
    height: 65,
    borderRadius: 35,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    marginBottom: 20,
  },
  avatarText: {
    fontSize: 40,
    fontFamily: "serif",
  },
  button: {
    backgroundColor: "#0B66D6",
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 24,
  },
  buttonDisabled: {
    backgroundColor: "#9CA3AF",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
});