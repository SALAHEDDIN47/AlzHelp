// frontend/utils/fetchNgrok.js

export const BASE_URL = 'http://10.0.2.2:3000'; // Remplace par ton lien ngrok actuel

export const fetchWithToken = async (endpoint, token, options = {}) => {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      method: 'GET',
      headers: {
        ...(options.headers || {}),
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    console.log("response: ",response);

    if (!response.ok) {
      throw new Error(`Erreur HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erreur fetch :', error);
    throw error;
  }
};
