// app/admin/attendance-history.tsx
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { styles } from '../../a_styles/style_attendance';
import { closeAttendanceSession, getAttendanceSessions, type AttendanceSession } from '../../utils/attendanceStorage';




export default function AttendanceHistoryScreen() {
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSessions = useCallback(async () => {
    const data = await getAttendanceSessions();
    setSessions(data);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSessions();
  }, [fetchSessions]);

  const handleCloseAttendance = async (sessionId: string) => {
    const nextSessions = await closeAttendanceSession(sessionId);
    setSessions(nextSessions);
  };

  const activeSessions = sessions.filter(s => s.status === 'active');
  const closedSessions = sessions.filter(s => s.status === 'closed');
  const totalStudents = sessions.reduce((sum, s) => sum + s.presentStudents.length, 0);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lịch sử điểm danh</Text>
      </View>

      <ScrollView
        style={styles.body}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Thống kê */}
        <View style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{activeSessions.length}</Text>
              <Text style={styles.statLabel}>Đang mở</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{closedSessions.length}</Text>
              <Text style={styles.statLabel}>Đã đóng</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{totalStudents}</Text>
              <Text style={styles.statLabel}>Lượt điểm danh</Text>
            </View>
          </View>
        </View>

        {/* Buổi đang mở */}
        {activeSessions.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>🟢 Buổi đang mở</Text>
            {activeSessions.map((session) => (
              <View key={session.id} style={styles.historyCard}>
                <View style={styles.historyHeader}>
                  <Text style={styles.courseName}>{session.courseName}</Text>
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>Đang mở</Text>
                  </View>
                </View>
                <Text style={styles.metaText}>{session.courseCode} • {session.department || '---'}</Text>
                <Text style={styles.metaText}>
                  Mở lúc: {new Date(session.requestedAt).toLocaleString('vi-VN')}
                </Text>
                <Text style={styles.presentCount}>
                  ✓ {session.presentStudents.length} sinh viên đã điểm danh
                </Text>
                <TouchableOpacity style={styles.closeButton} onPress={() => handleCloseAttendance(session.id)}>
                  <Text style={styles.closeButtonText}>Đóng buổi</Text>
                </TouchableOpacity>
                {session.presentStudents.length > 0 && (
                  <View style={styles.studentList}>
                    {session.presentStudents.map((student, index) => (
                      <Text key={`${student.studentId}-${index}`} style={styles.studentItem}>
                        {index + 1}. {student.fullName} {student.studentId ? `(${student.studentId})` : ''}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </>
        )}

        {/* Lịch sử đã đóng */}
        {closedSessions.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 12 }]}>📋 Lịch sử đã đóng</Text>
            {closedSessions.map((session) => (
              <View key={session.id} style={styles.historyCard}>
                <View style={styles.historyHeader}>
                  <Text style={styles.courseName}>{session.courseName}</Text>
                  <View style={styles.closedBadge}>
                    <Text style={styles.closedBadgeText}>Đã đóng</Text>
                  </View>
                </View>
                <Text style={styles.metaText}>{session.courseCode} • {session.department || '---'}</Text>
                <Text style={styles.metaText}>
                  Mở: {new Date(session.requestedAt).toLocaleString('vi-VN')}
                </Text>
                <Text style={styles.metaText}>
                  Đóng: {new Date( session.requestedAt).toLocaleString('vi-VN')}
                </Text>
                <Text style={styles.presentCount}>
                  ✓ {session.presentStudents.length} sinh viên đã điểm danh
                </Text>
                {session.presentStudents.length > 0 && (
                  <View style={styles.studentList}>
                    {session.presentStudents.map((student, index) => (
                      <Text key={`${student.studentId}-${index}`} style={styles.studentItem}>
                        {index + 1}. {student.fullName} {student.studentId ? `(${student.studentId})` : ''}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </>
        )}

        {sessions.length === 0 && (
          <Text style={styles.emptyText}>Chưa có buổi điểm danh nào</Text>
        )}
      </ScrollView>
    </View>
  );
}