import axios from 'axios';

// Configurez votre URL de base dans .env
const API_URL = process.env.API_URL || 'http://10.224.1.167:3000/api';

// Configurez Axios globalement
axios.interceptors.request.use(config => {
  // Ajoutez ici votre token JWT si nécessaire
  // config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axios.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const MedicalEventService = {
  getEvents: (patientId) => axios.get(`${API_URL}/medical-events/patients/${patientId}`),
  
  createEvent: (patientId, eventData) => {
    const formData = new FormData();
    formData.append('titre', eventData.titre);
    formData.append('date_event', eventData.date_event);
    formData.append('description', eventData.description || '');
    
    if (eventData.fichier) {
      formData.append('fichier', {
        uri: eventData.fichier.uri,
        name: eventData.fichier.name || 'file',
        type: eventData.fichier.type || 'application/octet-stream'
      });
    }

    return axios.post(
      `${API_URL}/medical-events/patients/${patientId}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
  },

  updateEvent: (eventId, eventData) => {
    const formData = new FormData();
    formData.append('titre', eventData.titre);
    formData.append('date_event', eventData.date_event);
    formData.append('description', eventData.description || '');
    
    if (eventData.fichier) {
      formData.append('fichier', {
        uri: eventData.fichier.uri,
        name: eventData.fichier.name || 'file',
        type: eventData.fichier.type || 'application/octet-stream'
      });
    }

    return axios.put(
      `${API_URL}/medical-events/${eventId}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
  },

  deleteEvent: (eventId) => axios.delete(`${API_URL}/medical-events/${eventId}`)
};