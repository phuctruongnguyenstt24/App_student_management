// src/app/tabs/screens-for-profile/TermsScreen.tsx
import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation } from 'expo-router';
import { router } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';

export default function TermsScreen() {
  const navigation = useNavigation();
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);

  // Lấy thư mục lưu trữ an toàn
  const getStorageDirectory = (): string | null => {
    try {
      // Sử dụng type assertion để bypass lỗi TypeScript
      const docDir = (FileSystem as any).documentDirectory;
      const cacheDir = (FileSystem as any).cacheDirectory;
      const dir = docDir || cacheDir;
      
      if (!dir) {
        console.error('Không thể truy cập thư mục lưu trữ');
        return null;
      }
      return dir;
    } catch (error) {
      console.error('Lỗi khi lấy thư mục:', error);
      return null;
    }
  };

  // Hàm tải PDF
  const downloadPDF = async () => {
    if (isDownloading) return;
    
    try {
      setIsDownloading(true);
      
      const docDir = getStorageDirectory();
      if (!docDir) {
        Alert.alert('Lỗi', 'Không thể truy cập bộ nhớ thiết bị.');
        setIsDownloading(false);
        return;
      }

      // LƯU Ý: Thay URL này bằng URL file PDF thực tế
      const pdfUrl = 'https://www.termsfeed.com/live/703686ef-7824-4053-a74d-dd241c8b3907.pdf';
      
      const timestamp = new Date().getTime();
      const fileName = `Terms_OneUni_${timestamp}.pdf`;
      const fileUri = `${docDir}${fileName}`;

      console.log('📥 Đang tải xuống:', fileUri);

      // Kiểm tra file đã tồn tại
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (fileInfo.exists) {
        Alert.alert(
          'File đã tồn tại',
          'Bạn có muốn tải lại file không?',
          [
            { text: 'Hủy', style: 'cancel', onPress: () => setIsDownloading(false) },
            { text: 'Tải lại', onPress: () => startDownload(pdfUrl, fileUri) }
          ]
        );
        return;
      }

      await startDownload(pdfUrl, fileUri);
    } catch (error) {
      console.error('❌ Lỗi khi tải PDF:', error);
      Alert.alert('Lỗi', 'Không thể tải PDF. Vui lòng thử lại sau.');
      setIsDownloading(false);
    }
  };

  // Bắt đầu quá trình tải xuống
  const startDownload = async (url: string, fileUri: string) => {
    try {
      setDownloadProgress(0);
      
      const downloadResumable = FileSystem.createDownloadResumable(
        url,
        fileUri,
        {},
        (downloadProgress) => {
          const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
          setDownloadProgress(progress);
        }
      );

      const result = await downloadResumable.downloadAsync();
      
      if (result) {
        setDownloadProgress(1);
        setIsDownloading(false);
        
        Alert.alert(
          '✅ Tải xuống thành công',
          'File PDF đã được tải về. Bạn có muốn mở file?',
          [
            { text: 'Đóng', style: 'cancel' },
            { text: '📄 Mở file', onPress: () => sharePDF(result.uri) }
          ]
        );
      }
    } catch (error) {
      console.error('❌ Lỗi khi tải xuống:', error);
      Alert.alert('Lỗi', 'Không thể tải xuống file. Vui lòng thử lại.');
      setIsDownloading(false);
    } finally {
      setDownloadProgress(0);
    }
  };

  // Chia sẻ/ Mở file PDF
  const sharePDF = async (fileUri: string) => {
    try {
      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (isSharingAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Chia sẻ file PDF',
          UTI: 'com.adobe.pdf',
        });
      } else {
        // Fallback: mở file bằng Linking
        await Linking.openURL(fileUri);
      }
    } catch (error) {
      console.error('❌ Lỗi khi mở file:', error);
      Alert.alert('Lỗi', 'Không thể mở file PDF.');
    }
  };
 const handleBack = () => {
    router.replace('/tabs/ProfileScreen');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={handleBack}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Điều khoản sử dụng</Text>
        
        <TouchableOpacity 
          onPress={downloadPDF}
          style={styles.downloadButton}
          disabled={isDownloading || loading}
        >
          {isDownloading ? (
            <ActivityIndicator size="small" color="#1a73e8" />
          ) : (
            <Ionicons name="download-outline" size={24} color="#1a73e8" />
          )}
        </TouchableOpacity>
      </View>

      {/* WebView */}
      <WebView
        ref={webViewRef}
        source={{
          uri: 'https://www.termsfeed.com/live/703686ef-7824-4053-a74d-dd241c8b3907',
        }}
        style={styles.webview}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1a73e8" />
            <Text style={styles.loadingText}>Đang tải...</Text>
          </View>
        )}
      />

      {/* Progress Bar */}
      {downloadProgress > 0 && downloadProgress < 1 && (
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <View 
              style={[
                styles.progressBarFill, 
                { width: `${downloadProgress * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            Đang tải: {Math.round(downloadProgress * 100)}%
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
 header: {
      backgroundColor: '#214D8A',
    padding: 16,
    paddingTop: 40,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
     
  },
  backButton: {
    padding: 4,
    width: 40,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
    marginHorizontal: 8,
  },
  downloadButton: {
    padding: 4,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666666',
  },
  progressBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopWidth: 1,
    borderTopColor: '#e8e8e8',
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: '#e8e8e8',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#1a73e8',
    borderRadius: 3,
  },
  progressText: {
    marginTop: 8,
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
});