import { BASE_URL } from './fetchNgrok';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const MedicalEventService = {
  getEvents: async (patientId) => {
    try {
      // Vérifier si patientId est défini
      if (!patientId) {
        console.error("getEvents: ID patient non défini");
        return { data: [] };
      }
      
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.error("getEvents: Token non trouvé");
        return { data: [] };
      }

      const response = await fetch(`${BASE_URL}/api/medical-events/patients/${patientId}/events`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log("response: ", response);
      
      if (!response.ok) {
        console.error("Erreur API:", response.status, response.statusText);
        return { data: [] };
      }
      
      const data = await response.json();
      return { data: Array.isArray(data) ? data : [] };
    } catch (error) {
      console.error("Erreur dans getEvents:", error);
      return { data: [] };
    }
  },

  createEvent: async (patientId, eventData) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Token non trouvé');
      }

      const formData = new FormData();
      
      formData.append('titre', eventData.titre);
      formData.append('date_event', eventData.date_event);
      formData.append('description', eventData.description || '');
      
      if (eventData.document) {
        formData.append('fichier', {
          uri: eventData.document.uri,
          type: eventData.document.type || 'application/octet-stream',
          name: eventData.document.name|| 'file'
        });
      }

      const response = await fetch(`${BASE_URL}/api/medical-events/patients/${patientId}/events`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error("Erreur dans createEvent:", error);
      throw error;
    }
  },

  updateEvent: async (eventId, eventData) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Token non trouvé');
      }

      const formData = new FormData();
      
      formData.append('titre', eventData.titre);
      formData.append('date_event', eventData.date_event);
      formData.append('description', eventData.description || '');
      
      
      if (eventData.document) {
        formData.append('fichier', {
          uri: eventData.document.uri,
          type: eventData.document.type || 'application/octet-stream',
          name: eventData.document.name || 'file'
        });
      }

      const response = await fetch(`${BASE_URL}/api/medical-events/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error("Erreur dans updateEvent:", error);
      throw error;
    }
  },

  deleteEvent: async (eventId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Token non trouvé');
      }

      const response = await fetch(`${BASE_URL}/api/medical-events/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }

      return { success: true };
    } catch (error) {
      console.error("Erreur dans deleteEvent:", error);
      throw error;
    }
  },

  downloadFile: async (eventId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Token non trouvé');
      }

      const response = await fetch(`${BASE_URL}/api/medical-events/events/${eventId}/file`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }

      return await response.blob();
    } catch (error) {
      console.error("Erreur dans downloadFile:", error);
      throw error;
    }
  }
};
