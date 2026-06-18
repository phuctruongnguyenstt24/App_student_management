// src/screens/DashboardScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, Button, Avatar, List, Chip, IconButton } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';

type Props = {
  navigation: any;
};


export default function DashboardScreen({ navigation } : Props) {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalCourses: 6,
    todaySchedule: [
      { id: 1, name: 'Lập trình Web', time: '08:00 - 10:30', room: 'P301' },
      { id: 2, name: 'Cơ sở dữ liệu', time: '13:00 - 15:30', room: 'P205' },
    ],
    upcomingAssignments: [
      { id: 1, name: 'Bài tập React Native', dueDate: '2024-01-20', course: 'Lập trình Web' },
      { id: 2, name: 'Thiết kế CSDL', dueDate: '2024-01-22', course: 'Cơ sở dữ liệu' },
    ],
    gpa: 3.6,
    notifications: [
      { id: 1, message: 'Thay đổi lịch học môn Lập trình Web', time: '2 giờ trước' },
      { id: 2, message: 'Hạn nộp bài tập môn CSDL', time: '5 giờ trước' },
    ]
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Avatar.Text size={60} label={user?.name?.charAt(0) || 'U'} style={styles.avatar} />
        <View style={styles.headerText}>
          <Text variant="titleLarge">Xin chào, {user?.name || 'Sinh viên'}</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>{user?.studentId || 'MSSV: 20210001'}</Text>
        </View>
        <IconButton icon="bell" size={24} onPress={() => navigation.navigate('Notifications')} />
      </View>

      <View style={styles.statsGrid}>
        <Card style={styles.statCard} onPress={() => navigation.navigate('Courses')}>
          <Card.Content>
            <Text variant="headlineMedium" style={styles.statNumber}>{stats.totalCourses}</Text>
            <Text variant="bodyMedium">Môn học đang học</Text>
          </Card.Content>
        </Card>
        
        <Card style={styles.statCard} onPress={() => navigation.navigate('Grades')}>
          <Card.Content>
            <Text variant="headlineMedium" style={styles.statNumber}>{stats.gpa}</Text>
            <Text variant="bodyMedium">GPA</Text>
          </Card.Content>
        </Card>
      </View>

      <Card style={styles.scheduleCard}>
        <Card.Title title="Lịch học hôm nay" left={(props) => <List.Icon {...props} icon="calendar" />} />
        <Card.Content>
          {stats.todaySchedule.map(item => (
            <View key={item.id} style={styles.scheduleItem}>
              <Text variant="titleSmall">{item.name}</Text>
              <Text variant="bodySmall">{item.time} - Phòng {item.room}</Text>
            </View>
          ))}
        </Card.Content>
      </Card>

      <Card style={styles.assignmentsCard}>
        <Card.Title title="Bài tập sắp đến hạn" left={(props) => <List.Icon {...props} icon="clipboard-list" />} />
        <Card.Content>
          {stats.upcomingAssignments.map(item => (
            <View key={item.id} style={styles.assignmentItem}>
              <View>
                <Text variant="titleSmall">{item.name}</Text>
                <Text variant="bodySmall">{item.course}</Text>
              </View>
              <Chip icon="clock" compact>Hạn: {item.dueDate}</Chip>
            </View>
          ))}
        </Card.Content>
      </Card>

      <Card style={styles.notificationsCard}>
        <Card.Title title="Thông báo mới" left={(props) => <List.Icon {...props} icon="bell" />} />
        <Card.Content>
          {stats.notifications.map(item => (
            <List.Item
              key={item.id}
              title={item.message}
              description={item.time}
              left={props => <List.Icon {...props} icon="notification" />}
            />
          ))}
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  avatar: {
    marginRight: 12,
    backgroundColor: '#2196F3',
  },
  headerText: {
    flex: 1,
  },
  subtitle: {
    opacity: 0.7,
  },
  statsGrid: {
    flexDirection: 'row',
    padding: 8,
    gap: 8,
  },
  statCard: {
    flex: 1,
    margin: 8,
  },
  statNumber: {
    fontWeight: 'bold',
    color: '#2196F3',
    textAlign: 'center',
  },
  scheduleCard: {
    margin: 12,
  },
  scheduleItem: {
    marginBottom: 12,
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  assignmentsCard: {
    margin: 12,
  },
  assignmentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  notificationsCard: {
    margin: 12,
  },
});