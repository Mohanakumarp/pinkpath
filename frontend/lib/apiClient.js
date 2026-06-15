// frontend/lib/apiClient.js
import { Platform } from 'react-native';

// Standardized dynamic URL helper
const getBackendUrl = () => {
  if (Platform.OS === 'web') {
    return process.env.EXPO_PUBLIC_BACKEND_URL_WEB || 'http://127.0.0.1:8000';
  }
  // Remember to use your specific Hotspot IP (172.20.10.4) in the fallback if you aren't using a .env file!
  return process.env.EXPO_PUBLIC_BACKEND_URL || 'http://172.20.10.4:8000'; 
};

export async function sendMessageToBot(message, history = []) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000); 

    // We only send the last 6 messages to save tokens and keep processing fast
    const recentHistory = history.slice(-6).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));

    // Grab the dynamic URL based on the current environment
    const BACKEND_URL = getBackendUrl();

    const response = await fetch(`${BACKEND_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        message: message,
        history: recentHistory 
      }), 
      signal: controller.signal 
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    const data = await response.json();
    console.log("Received from Elara:", data); 

    return data.response || data.answer || "Error: Could not parse text."; 

  } catch (error) {
    console.error("API Client Error:", error);
    if (error.name === 'AbortError') {
      throw new Error("The request took too long. Elara is still warming up.");
    }
    throw error; 
  }
}