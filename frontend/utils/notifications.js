// notifications.js
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as Device from 'expo-device';

// Fonction pour demander l'autorisation de recevoir des notifications
export const requestPermissions = async () => {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    alert('Permission de notification non accordée');
    return;
  }
};

// Fonction pour obtenir le token du device pour les notifications
export const getPushNotificationToken = async () => {
  if (Platform.OS === 'ios' && !Device.isDevice) {
    alert('Les notifications push ne sont pas disponibles sur un émulateur iOS');
    return;
  }

  const token = await Notifications.getExpoPushTokenAsync();
  console.log('Token de notification push:', token.data);
  return token.data;  // Retourne le token de l'appareil
};
