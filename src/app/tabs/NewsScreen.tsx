import { Ionicons } from '@expo/vector-icons';
import Constants from "expo-constants";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

import { styles as globalStyles } from '../../a_styles/style_student_info';
const getApiUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) {
    return envUrl;
  }

  const hostUri = (Constants.expoConfig?.hostUri as string | undefined) ?? (Constants as any).manifest?.debuggerHost;
  if (hostUri) {
    const host = hostUri.split(":")[0];
    return `http://${host}:5000/api/news`;
  }

  return "http://localhost:5000/api/news";
};

export default function NewsScreen() {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(getApiUrl());
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        setNews(Array.isArray(data) ? data : []);
      } catch (err: any) {
        console.log("News fetch error:", err);
        setError("Không thể tải tin tức. Vui lòng kiểm tra backend và kết nối mạng.");
        setNews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  // nếu đang tải dữ liệu thì hiển thị các component ActivityIndicator và Text thông báo đang tải tin tức
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
        <ActivityIndicator size="large" color="#1E4F9A" />
        <Text style={{ marginTop: 10, color: "#666" }}>Đang tải tin tức...</Text>
      </View>
    );
  }

  // nếu có lỗi xảy ra thì hiển thị thông báo lỗi
  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
        <Text style={{ color: "#c0392b", textAlign: "center" }}>{error}</Text>
      </View>
    );
  }

  // hiển thị card danh sách tin tức bằng FlatList nếu thành công fetch dữ liệu
  return (
    <SafeAreaView style={globalStyles.container}>
      <View style={globalStyles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={globalStyles.headerTitle}>Tin tức</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={globalStyles.card}>
        <FlatList
          contentContainerStyle={{ paddingBottom: 20 }}
          data={news}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({ item }: any) => (
            <View style={styles.newsCard}>
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.newsImage} />
              ) : null}

              <View style={styles.newsContent}>
                <Text numberOfLines={2} style={styles.newsTitle}>
                  {item.title}
                </Text>

                <Text numberOfLines={3} style={styles.newsDescription}>
                  {item.description}
                </Text>

                <View style={styles.newsFooter}>
                  {/*Linking.openURL(item.url)} ==> thư viện này Link thắng về các trang đã fetch ra luôn */}
                  <TouchableOpacity
                    onPress={() => Linking.openURL(item.url)}
                    style={styles.newsButton}
                  >
                    <Text style={styles.newsButtonText}>XEM THÊM</Text>
                  </TouchableOpacity>

                  <Text style={styles.newsDate}>{item.publishedAt}</Text>
                </View>
              </View>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  newsCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginBottom: 16,
    padding: 12,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  newsImage: {
    width: 90,
    height: 90,
    borderRadius: 14,
    backgroundColor: "#f0f0f0",
  },
  newsContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "space-between",
  },
  newsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E4F9A",
  },
  newsDescription: {
    marginTop: 4,
    color: "#555",
    fontSize: 13,
  },
  newsFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  newsButton: {
    backgroundColor: "#1E4F9A",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  newsButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  newsDate: {
    color: "#666",
    fontSize: 11,
  },
});
