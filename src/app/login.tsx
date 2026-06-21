import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

//phuc

// API base URL
const host = Constants.expoConfig?.hostUri?.split(':')[0];
const API_URL = `http://${host}:5000/api`;

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Lỗi', 'Vui lòng nhập email và mật khẩu');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Lưu token và thông tin user
        await AsyncStorage.setItem('token', data.token);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));

        // Phân quyền điều hướng dựa trên role
        const userRole = data.user.role;

        if (userRole === 'admin') {
          // Admin -> vào trang quản trị
          Alert.alert('Thành công', 'Đăng nhập với quyền Quản trị viên!', [
            {
              text: 'OK',
              onPress: () => router.replace('/admin/dashboard'),
            },
          ]);
        } else {
          // Student -> vào trang sinh viên
          Alert.alert('Thành công', 'Đăng nhập thành công!', [
            {
              text: 'OK',
              onPress: () => router.replace('/tabs'),
            },
          ]);
        }
      } else {
        Alert.alert('Đăng nhập thất bại', data.message);
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Lỗi', 'Không thể kết nối đến server. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  const openTerms = () => {
    Linking.openURL('https://www.termsfeed.com/live/a3b5b4ca-4410-4599-9a25-b502d4e494a4');
  };

  const openPrivacy = () => {
    Linking.openURL('https://www.termsfeed.com/live/a3b5b4ca-4410-4599-9a25-b502d4e494a4');
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Đăng nhập
          </ThemedText>
          <ThemedText type="subtitle" style={styles.subtitle}>
            Sử dụng tài khoản được cấp bởi quản trị viên
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.form}>
          {/* Input Email */}
          <ThemedView style={styles.inputGroup}>
            <ThemedText style={styles.label}>Email</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="example@student.ctuet.edu.vn"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#999"
              editable={!isLoading}
            />
          </ThemedView>

          {/* Input Password với icon eye */}
          <ThemedView style={styles.inputGroup}>
            <ThemedText style={styles.label}>Mật khẩu</ThemedText>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Nhập mật khẩu"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholderTextColor="#999"
                editable={!isLoading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={22}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
          </ThemedView>

          {/* Nút Đăng nhập */}
          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <ThemedText style={styles.buttonText}>
              {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </ThemedText>
          </TouchableOpacity>

          {/* Điều khoản & Chính sách */}
          <ThemedView style={styles.footer}>
            <Text style={styles.footerText}>
              Bằng cách đăng nhập, bạn đồng ý với{' '}
              <Text style={styles.link} onPress={openTerms}>
                Điều khoản dịch vụ
              </Text>
              {' và '}
              <Text style={styles.link} onPress={openPrivacy}>
                Chính sách quyền riêng tư
              </Text>
              {' của chúng tôi.'}
            </Text>
          </ThemedView>
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.six,
    gap: Spacing.two,
  },
  title: {
    textAlign: 'center',
    fontSize: 32,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 14,
    opacity: 0.7,
  },
  form: {
    gap: Spacing.four,
  },
  inputGroup: {
    gap: Spacing.one,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: Spacing.one,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 16,
  },
  eyeIcon: {
    paddingHorizontal: Spacing.two,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: Spacing.three,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    marginTop: Spacing.six,
    alignItems: 'center',
    paddingHorizontal: Spacing.two,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    color: '#666',
    lineHeight: 18,
  },
  link: {
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
});


//npm run web ==> để chạy web