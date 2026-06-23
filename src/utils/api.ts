import Constants from 'expo-constants';

// Auto-detect host from Expo
const getHost = (): string => {
  // Try to get from Expo hostUri
  const expoHost = Constants.expoConfig?.hostUri?.split(':')[0];
  if (expoHost) {
    return expoHost;
  }

  // Fallback to localhost
  console.warn('⚠️ Could not detect Expo host, falling back to localhost');
  return 'localhost';
};

const API_HOST = getHost();
export const API_URL = `http://${API_HOST}:5000/api`;

// Log for debugging
console.log('🔗 API Configuration:', {
  host: API_HOST,
  apiUrl: API_URL,
  expoConfig: Constants.expoConfig?.hostUri,
});

export const apiCall = async (
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any,
  headers?: Record<string, string>
) => {
  const url = `${API_URL}${endpoint}`;
  
  try {
    console.log(`📡 ${method} ${url}`);
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(errorData)}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`❌ API Error (${method} ${endpoint}):`, error);
    throw error;
  }
};
