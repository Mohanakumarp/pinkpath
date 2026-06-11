import { Platform } from 'react-native';

const WEB_BACKEND_URL = (process.env.EXPO_PUBLIC_BACKEND_URL_WEB || 'http://127.0.0.1:8000').trim();
const MOBILE_BACKEND_URL = (process.env.EXPO_PUBLIC_BACKEND_URL || '').trim();
const BACKEND_URL = Platform.OS === 'web' ? WEB_BACKEND_URL : MOBILE_BACKEND_URL;
const REQUEST_TIMEOUT_MS = 60000;

const fetchWithTimeout = async (url, options, timeoutMs = REQUEST_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
};

export const sendMessageToBot = async (message) => {
  try {
    if (!BACKEND_URL) throw new Error('EXPO_PUBLIC_BACKEND_URL is not set');

    const response = await fetchWithTimeout(`${BACKEND_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) throw new Error(`Status ${response.status}`);
    const data = await response.json();
    return data.response;
    
  } catch (error) {
    console.error("Backend Connection Error:", error);
    if (error?.name === 'AbortError') return "The request timed out.";
    return "I'm having trouble connecting to the backend.";
  }
};