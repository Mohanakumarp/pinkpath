// frontend/lib/apiClient.js
import { Platform } from 'react-native';

// 1. DYNAMIC IP HANDLING
// We are replacing localhost with your laptop's specific Hotspot IP 
// so your physical phone can talk to your laptop over the network.
const LAPTOP_IP = '172.20.10.4'; 
const API_BASE_URL = `http://${LAPTOP_IP}:8000`;

export async function sendMessageToBot(message) {
  try {
    // 2. EXTENDED TIMEOUT LOGIC
    // We give the AI up to 5 minutes (300,000 ms) to answer the first cold-start question
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000); 

    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: message }), // Notice we use "message" to match your FastAPI setup
      signal: controller.signal // Attaches the 5-minute timeout
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    const data = await response.json();
    
    // Add a console.log so you can always see exactly what the backend sends in your Expo terminal
    console.log("Received from Elara:", data); 

    // Look for 'response' first, fallback to 'answer', and fallback to a string if it's direct
    return data.response || data.answer || "Error: Could not parse text."; 

  } catch (error) {
    console.error("API Client Error:", error);
    
    if (error.name === 'AbortError') {
      throw new Error("The request took too long. Elara is still warming up.");
    }
    
    throw error; // Passes the error back to chat.js to show the "having trouble" message
  }
}