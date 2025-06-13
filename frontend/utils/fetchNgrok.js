// frontend/utils/fetchNgrok.js

export const BASE_URL = 'http://10.0.2.2:3000'; // Remplace par ton lien ngrok actuel

export const fetchWithToken = async (endpoint, token, options = {}) => {
  try {
    console.log(`Request to: ${BASE_URL}${endpoint}`); // Debug
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      method: options.method || 'GET',
      headers: {
        ...(options.headers || {}),
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    console.log("response: ",response);
      console.log("Response status:", response.status); // Debug
        const text = await response.text();
    console.log("Raw response:", text); // Debug
    if (!response.ok) {
      try {
        const errorData = JSON.parse(text);
        throw new Error(errorData.message || `Erreur HTTP ${response.status}`);
      } catch {
        throw new Error(text || `Erreur HTTP ${response.status}`);
      }
    }

     return text ? JSON.parse(text) : {};
  } catch (error) {
    console.error('Erreur fetch :', error);
    throw error;
  }
};
