import * as Device from 'expo-device';
import { Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HintRow } from '@/components/hint-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WebBadge } from '@/components/web-badge';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

function getDevMenuHint() {
  if (Platform.OS === 'web') {
    return <ThemedText type="small">use browser devtools</ThemedText>;
  }
  if (Device.isDevice) {
    return (
      <ThemedText type="small">
        shake device or press <ThemedText type="code">m</ThemedText> in terminal
      </ThemedText>
    );
  }
  const shortcut = Platform.OS === 'android' ? 'cmd+m (or ctrl+m)' : 'cmd+d';
  return (
    <ThemedText type="small">
      press <ThemedText type="code">{shortcut}</ThemedText>
    </ThemedText>
  );
}

export default function HomeScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.heroSection}>
          
          <ThemedText type="title" style={styles.title}>
            STUDENT LEARNING MANAGEMENT SYSTEM
          </ThemedText>
          <ThemedText type="subtitle" style={styles.subtitle}>
            Manage courses, track progress, and achieve your academic goals
          </ThemedText>
        </ThemedView>

        <ThemedView type="backgroundElement" style={styles.stepContainer}>
          <HintRow
            title="📚 My Courses"
            hint={<ThemedText type="code">View enrolled courses</ThemedText>}
          />
          <HintRow 
            title="📊 Progress" 
            hint={<ThemedText type="code">Track learning analytics</ThemedText>} 
          />
          <HintRow
            title="📝 Assignments"
            hint={<ThemedText type="code">Upcoming deadlines</ThemedText>}
          />
          <HintRow
            title="🎯 Goals"
            hint={<ThemedText type="code">Set learning objectives</ThemedText>}
          />
        </ThemedView>

        <ThemedText type="code" style={styles.code}>
          Dashboard Overview
        </ThemedText>

        {Platform.OS === 'web' && <WebBadge />}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
   
  },
  safeArea: {
   paddingHorizontal: Spacing.four,
    alignItems: 'center',
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,    flex: 1,
 
  },
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
  },
  title: {
    paddingTop:10,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 16,
    opacity: 0.8,
  },
  code: {
    textTransform: 'uppercase',
    marginTop: Spacing.two,
  },
  stepContainer: {
    gap: Spacing.three,
    alignSelf: 'stretch',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.four,
    borderRadius: Spacing.four,
  },
});