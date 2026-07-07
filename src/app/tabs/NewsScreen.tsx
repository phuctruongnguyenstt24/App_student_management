import Constants from "expo-constants";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Linking,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

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

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
        <ActivityIndicator size="large" color="#1E4F9A" />
        <Text style={{ marginTop: 10, color: "#666" }}>Đang tải tin tức...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
        <Text style={{ color: "#c0392b", textAlign: "center" }}>{error}</Text>
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={{ paddingBottom: 20 }}
      data={news}
      keyExtractor={(_, index) => index.toString()}
      renderItem={({ item }: any) => (
        <View
          style={{
            backgroundColor: "#fff",
            padding: 15,
            margin: 10,
            borderRadius: 10,
          }}
        >
          <Text
            style={{
              fontWeight: "bold",
              color: "#1E4F9A",
            }}
          >
            {item.title}
          </Text>

          <Text numberOfLines={3} style={{ marginTop: 6, color: "#444" }}>
            {item.description || "Không có mô tả"}
          </Text>

          <Text style={{ marginTop: 6, color: "#666" }}>{item.publishedAt}</Text>
          
        {/*Linking.openURL(item.url)} ==> thư viện này Link thắng về các trang đã fetch ra luôn */}
          <TouchableOpacity
            onPress={() => Linking.openURL(item.url)}
            style={{
              backgroundColor: "#1E4F9A",
              padding: 8,
              marginTop: 10,
              borderRadius: 20,
              width: 100,
            }}
          >
            <Text style={{ color: "#fff", textAlign: "center" }}>
              XEM THÊM
            </Text>
          </TouchableOpacity>
        </View>
      )}
    />
  );
}
